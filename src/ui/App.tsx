import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import { GameHud } from './components/GameHud';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import {
  evaluateLiveAchievements,
  evaluateRoundEndAchievements,
  loadAchievements,
  saveAchievements,
} from './game/achievements';
import { computeBotInput } from './game/ai';
import { soundEngine } from './game/audio';
import {
  computeLevelFromXp,
  getHeroDef,
  loadProgression,
  saveProgression,
} from './game/characters';
import {
  DEFAULT_CONTROLS,
  DEFAULT_SETTINGS,
  DEFAULT_SLOTS,
  formatKeyCode,
} from './game/constants';
import { InputHub } from './game/input';
import { applyNetSnapshot, NetSnapshot, OnlineClient } from './game/net';
import {
  buildHudSnapshot,
  buildRoundResult,
  createSimulation,
  stepSimulation,
} from './game/physics';
import { CastleRenderer } from './game/renderer';
import {
  computeSagaStarsEarned,
  loadSagaProgress,
  SAGA_LEVELS,
  saveSagaProgress,
} from './game/saga';
import {
  computeEndingFromCounts,
  loadStoryProgress,
  POFI_COSTUME,
  saveStoryProgress,
  STORY_CHAPTERS,
} from './game/story';
import {
  AchievementId,
  AchievementState,
  AppScreenState,
  CostumeConfig,
  GameModeId,
  GameSettings,
  HudSnapshot,
  MapId,
  MenuSubView,
  OnlineRoomState,
  PlayerInputState,
  PlayerProgression,
  PlayerSlotConfig,
  RoundResult,
  SagaLevelDef,
  SagaProgress,
  SimulationState,
  StoryChapterDef,
  StoryChoiceOption,
  StoryProgress,
} from './game/types';

const STORAGE_KEY = 'kale_kapmaca_prefs_v1';

function loadSavedState(): { settings: GameSettings; slots: PlayerSlotConfig[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { settings: DEFAULT_SETTINGS, slots: DEFAULT_SLOTS };
    const parsed = JSON.parse(raw);
    const savedControls = parsed.settings?.controls ?? {};
    const savedSlots: PlayerSlotConfig[] =
      Array.isArray(parsed.slots) && parsed.slots.length === 4
        ? parsed.slots.map((s: PlayerSlotConfig, idx: number) => ({
            ...DEFAULT_SLOTS[idx],
            ...s,
            heroId: s.heroId ?? DEFAULT_SLOTS[idx].heroId ?? 'pofi',
            costume: {
              ...DEFAULT_SLOTS[idx].costume,
              ...(s.costume ?? {}),
              accessoryId: s.costume?.accessoryId ?? 'yok',
            },
          }))
        : DEFAULT_SLOTS;

    return {
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
        audio: {
          ...DEFAULT_SETTINGS.audio,
          ...(parsed.settings?.audio ?? {}),
        },
        controls: {
          ...DEFAULT_CONTROLS,
          ...savedControls,
          p1: {
            ...DEFAULT_CONTROLS.p1,
            ...(savedControls.p1 ?? {}),
          },
          p2: {
            ...DEFAULT_CONTROLS.p2,
            ...(savedControls.p2 ?? {}),
          },
        },
      },
      slots: savedSlots,
    };
  } catch {
    return { settings: DEFAULT_SETTINGS, slots: DEFAULT_SLOTS };
  }
}

function createAttractSimulation(settings: GameSettings): SimulationState {
  const attractSlots: PlayerSlotConfig[] = DEFAULT_SLOTS.map((s) => ({
    ...s,
    kind: 'bot',
  }));
  return createSimulation(
    { ...settings, mode: 'chaos', botsEnabled: true },
    attractSlots
  );
}

function buildOnlineSlots(room: OnlineRoomState): PlayerSlotConfig[] {
  return [0, 1, 2, 3].map((slotIdx) => {
    const peer = room.peers.find((p) => p.slotIndex === slotIdx);
    const fallback = DEFAULT_SLOTS[slotIdx];
    if (peer) {
      return {
        slotIndex: slotIdx,
        kind: 'human',
        name: peer.name,
        team: slotIdx % 2 === 0 ? 'A' : 'B',
        aiPersonality: fallback.aiPersonality,
        heroId: fallback.heroId ?? 'pofi',
        costume: { ...peer.costume },
      };
    }
    return {
      ...fallback,
      kind: room.botsEnabled ? 'bot' : 'off',
      team: slotIdx % 2 === 0 ? 'A' : 'B',
    };
  });
}

function buildStorySlots(chapter: StoryChapterDef): PlayerSlotConfig[] {
  const result: PlayerSlotConfig[] = [
    {
      slotIndex: 0,
      kind: 'human',
      name: 'Pofi',
      team: 'A',
      aiPersonality: 'balanced',
      heroId: 'pofi',
      costume: { ...POFI_COSTUME },
    },
  ];
  let nextSlot = 1;
  if (chapter.ally) {
    result.push({
      slotIndex: nextSlot++,
      kind: 'bot',
      name: chapter.ally.name,
      team: 'A',
      aiPersonality: chapter.ally.aiPersonality,
      heroId: 'leyla',
      costume: { ...chapter.ally.costume },
    });
  }
  for (const rival of chapter.rivals) {
    if (nextSlot >= 4) break;
    result.push({
      slotIndex: nextSlot++,
      kind: 'bot',
      name: rival.name,
      team: rival.team,
      aiPersonality: rival.aiPersonality,
      heroId: 'tiknaz',
      costume: { ...rival.costume },
    });
  }
  while (nextSlot < 4) {
    result.push({
      ...DEFAULT_SLOTS[nextSlot],
      slotIndex: nextSlot,
      kind: 'off',
    });
    nextSlot++;
  }
  return result;
}

function buildSagaSlots(
  level: SagaLevelDef,
  p1Slot: PlayerSlotConfig
): PlayerSlotConfig[] {
  const hero = getHeroDef(p1Slot.heroId);
  const result: PlayerSlotConfig[] = [
    {
      ...p1Slot,
      slotIndex: 0,
      kind: 'human',
      team: 'A',
      heroId: hero.id,
      costume: { ...p1Slot.costume },
    },
  ];
  let nextSlot = 1;
  if (level.ally) {
    result.push({
      slotIndex: nextSlot++,
      kind: 'bot',
      name: level.ally.name,
      team: 'A',
      aiPersonality: level.ally.aiPersonality,
      heroId: level.ally.heroId,
      costume: { ...level.ally.costume },
    });
  }
  for (const rival of level.rivals) {
    if (nextSlot >= 4) break;
    result.push({
      slotIndex: nextSlot++,
      kind: 'bot',
      name: rival.name,
      team: 'B',
      aiPersonality: rival.aiPersonality,
      heroId: rival.heroId,
      costume: { ...rival.costume },
    });
  }
  while (nextSlot < 4) {
    result.push({
      ...DEFAULT_SLOTS[nextSlot],
      slotIndex: nextSlot,
      kind: 'off',
    });
    nextSlot++;
  }
  return result;
}

export default function App() {
  const initial = useRef(loadSavedState());
  const urlRoomParam = useRef(
    new URLSearchParams(window.location.search).get('room')?.trim().toUpperCase() ?? ''
  );

  const [settings, setSettings] = useState<GameSettings>(initial.current.settings);
  const [slots, setSlots] = useState<PlayerSlotConfig[]>(initial.current.slots);
  const [screenState, setScreenState] = useState<AppScreenState>('title');
  const [menuSubView, setMenuSubView] = useState<MenuSubView>(
    urlRoomParam.current ? 'online' : 'home'
  );
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  // Story & Saga Mode & Player Progression State
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(() =>
    loadStoryProgress()
  );
  const [sagaProgress, setSagaProgress] = useState<SagaProgress>(() =>
    loadSagaProgress()
  );
  const [progression, setProgression] = useState<PlayerProgression>(() =>
    loadProgression()
  );
  const [postVictoryChapterId, setPostVictoryChapterId] = useState<number | null>(
    null
  );
  const activeStoryRef = useRef<{
    chapter: StoryChapterDef;
    bonusLives: number;
  } | null>(null);
  const activeSagaLevelRef = useRef<SagaLevelDef | null>(null);

  // Achievements State & Toasts
  const [achievementState, setAchievementState] = useState<AchievementState>(() =>
    loadAchievements()
  );
  const [achievementToasts, setAchievementToasts] = useState<AchievementId[]>([]);
  const achievementStateRef = useRef<AchievementState>(achievementState);
  const roundUnlockedRef = useRef<Set<AchievementId>>(new Set());

  // Online Multiplayer State
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomState | null>(null);
  const [onlinePeerId, setOnlinePeerId] = useState<string | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [onlineHasTurn, setOnlineHasTurn] = useState(false);

  const onlineClientRef = useRef<OnlineClient | null>(null);
  const onlineRoomRef = useRef<OnlineRoomState | null>(null);
  const onlinePeerIdRef = useRef<string | null>(null);
  const isOnlineMatchRef = useRef<boolean>(false);
  const guestInputsRef = useRef<Record<number, PlayerInputState>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputHubRef = useRef<InputHub | null>(null);
  const rendererRef = useRef<CastleRenderer | null>(null);
  const simRef = useRef<SimulationState>(
    createAttractSimulation(initial.current.settings)
  );
  const attractSimRef = useRef<SimulationState>(
    createAttractSimulation(initial.current.settings)
  );

  const screenStateRef = useRef<AppScreenState>(screenState);
  const menuSubViewRef = useRef<MenuSubView>(menuSubView);
  const settingsRef = useRef<GameSettings>(settings);
  const slotsRef = useRef<PlayerSlotConfig[]>(slots);
  const storyProgressRef = useRef<StoryProgress>(storyProgress);
  const progressionRef = useRef<PlayerProgression>(progression);
  const sagaProgressRef = useRef<SagaProgress>(sagaProgress);

  useEffect(() => {
    screenStateRef.current = screenState;
    document.body.dataset.state = screenState;
  }, [screenState]);

  useEffect(() => {
    menuSubViewRef.current = menuSubView;
  }, [menuSubView]);

  useEffect(() => {
    achievementStateRef.current = achievementState;
  }, [achievementState]);

  useEffect(() => {
    storyProgressRef.current = storyProgress;
    saveStoryProgress(storyProgress);
  }, [storyProgress]);

  useEffect(() => {
    sagaProgressRef.current = sagaProgress;
    saveSagaProgress(sagaProgress);
  }, [sagaProgress]);

  useEffect(() => {
    progressionRef.current = progression;
    saveProgression(progression);
  }, [progression]);

  useEffect(() => {
    settingsRef.current = settings;
    soundEngine.updateSettings(settings.audio);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, slots: slotsRef.current })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [settings]);

  useEffect(() => {
    slotsRef.current = slots;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings: settingsRef.current, slots })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [slots]);

  const grantAchievements = useCallback((ids: AchievementId[]) => {
    if (ids.length === 0) return;
    const current = achievementStateRef.current;
    const existingSet = new Set(current.unlockedIds);
    const fresh = ids.filter((id) => !existingSet.has(id));
    if (fresh.length === 0) return;

    const now = Date.now();
    const nextUnlockedAt = { ...current.unlockedAt };
    for (const id of fresh) {
      nextUnlockedAt[id] = now;
      roundUnlockedRef.current.add(id);
    }

    const nextState: AchievementState = {
      unlockedIds: [...current.unlockedIds, ...fresh],
      unlockedAt: nextUnlockedAt,
    };
    achievementStateRef.current = nextState;
    setAchievementState(nextState);
    saveAchievements(nextState);
    soundEngine.playAchievementUnlock();

    setAchievementToasts((prev) => Array.from(new Set([...prev, ...fresh])));
    window.setTimeout(() => {
      setAchievementToasts((prev) => prev.filter((id) => !fresh.includes(id)));
    }, 3800);
  }, []);

  const recordStoryVictory = useCallback(
    (chapterId: number) => {
      const ch = STORY_CHAPTERS.find((c) => c.id === chapterId);
      if (!ch) return;
      setStoryProgress((prev) => {
        const completedChapters = Array.from(
          new Set([...prev.completedChapters, ch.id])
        );
        const unlockedMaps = Array.from(
          new Set([...prev.unlockedMaps, ch.unlockMapId])
        );
        const unlockedColors = ch.unlockColorId
          ? Array.from(new Set([...prev.unlockedColors, ch.unlockColorId]))
          : prev.unlockedColors;
        const unlockedFes = ch.unlockFesId
          ? Array.from(new Set([...prev.unlockedFes, ch.unlockFesId]))
          : prev.unlockedFes;
        const secretsFound = ch.secretLore
          ? Array.from(new Set([...prev.secretsFound, ch.secretLore]))
          : prev.secretsFound;

        let endingReached = prev.endingReached;
        if (ch.id === 7) {
          const choiceId = prev.choicesByChapter[7];
          const chosen = ch.choices.find((opt) => opt.id === choiceId);
          endingReached = computeEndingFromCounts(
            prev.alignmentCounts,
            chosen?.alignment
          );
        }

        return {
          ...prev,
          completedChapters,
          unlockedMaps,
          unlockedColors,
          unlockedFes,
          secretsFound,
          endingReached,
        };
      });
    },
    []
  );

  const finalizeRound = useCallback(
    (rawResult: RoundResult, fromOnlineBroadcast = false) => {
      soundEngine.stopMusic();
      soundEngine.playVictoryFanfare();

      const unlockedSet = new Set(achievementStateRef.current.unlockedIds);
      const endUnlocked = evaluateRoundEndAchievements(
        rawResult,
        unlockedSet,
        isOnlineMatchRef.current
      );
      grantAchievements(endUnlocked);

      if (rawResult.storyWon && rawResult.storyChapterId) {
        recordStoryVictory(rawResult.storyChapterId);
      }

      // Compute Saga Stars & Progression XP
      const p1Standing =
        rawResult.standings.find((s) => s.slotIndex === 0) ?? rawResult.standings[0];
      const p1Won =
        rawResult.winnerSlot === 0 ||
        Boolean(rawResult.storyWon) ||
        Boolean(rawResult.sagaWon);

      let sagaStars: 0 | 1 | 2 | 3 | undefined;
      let sagaBonusXp = 0;
      if (rawResult.sagaLevelId) {
        sagaStars = computeSagaStarsEarned(
          p1Standing?.deaths ?? 0,
          p1Standing?.score ?? 0,
          Boolean(rawResult.sagaWon)
        );
        if (rawResult.sagaWon) {
          const levelId = rawResult.sagaLevelId;
          const levelDef = SAGA_LEVELS.find((l) => l.id === levelId);
          sagaBonusXp = levelDef?.rewardXp ?? 80;
          setSagaProgress((prev) => {
            const prevStars = prev.starsByLevel[levelId] ?? 0;
            const nextStars = Math.max(prevStars, sagaStars ?? 1) as 1 | 2 | 3;
            return {
              ...prev,
              highestUnlockedLevel: Math.max(
                prev.highestUnlockedLevel,
                Math.min(SAGA_LEVELS.length, levelId + 1)
              ),
              starsByLevel: {
                ...prev.starsByLevel,
                [levelId]: nextStars,
              },
            };
          });
        }
      }

      const xpEarned =
        25 +
        Math.round((p1Standing?.score ?? 0) * 0.5) +
        (p1Won ? 40 : 10) +
        sagaBonusXp;
      const prevProg = progressionRef.current;
      const nextXp = prevProg.xp + xpEarned;
      const levelInfo = computeLevelFromXp(nextXp);
      const leveledUpTo =
        levelInfo.level > prevProg.level ? levelInfo.level : undefined;

      const nextProg: PlayerProgression = {
        xp: nextXp,
        level: levelInfo.level,
        matchesPlayed: prevProg.matchesPlayed + 1,
        wins: prevProg.wins + (p1Won ? 1 : 0),
        totalStomps: prevProg.totalStomps + (p1Standing?.stomps ?? 0),
        totalKills: prevProg.totalKills + (p1Standing?.kills ?? 0),
      };
      progressionRef.current = nextProg;
      setProgression(nextProg);

      const finalResult: RoundResult = {
        ...rawResult,
        unlockedAchievements: Array.from(roundUnlockedRef.current),
        sagaStars,
        xpEarned,
        leveledUpTo,
      };

      if (
        !fromOnlineBroadcast &&
        isOnlineMatchRef.current &&
        onlineClientRef.current?.isHost()
      ) {
        onlineClientRef.current.broadcastRoundResult(finalResult);
        onlineClientRef.current.notifyMatchEndedOnServer();
      }

      setHud(buildHudSnapshot(simRef.current));
      setRoundResult(finalResult);
      screenStateRef.current = 'gameover';
      document.body.dataset.state = 'gameover';
      setScreenState('gameover');
    },
    [grantAchievements, recordStoryVictory]
  );

  const beginOnlineMatch = useCallback((room: OnlineRoomState) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundEngine.startMusic();
    inputHubRef.current?.clearAll();
    rendererRef.current?.resetParticles();
    roundUnlockedRef.current.clear();
    guestInputsRef.current = {};
    activeStoryRef.current = null;
    activeSagaLevelRef.current = null;
    isOnlineMatchRef.current = true;

    const onlineSettings: GameSettings = {
      ...settingsRef.current,
      mode: room.mode,
      mapId: room.mapId,
      lives: room.lives,
      roundDurationSec: room.roundDurationSec,
      botsEnabled: room.botsEnabled,
    };
    const onlineSlots = buildOnlineSlots(room);
    const freshSim = createSimulation(onlineSettings, onlineSlots);
    simRef.current = freshSim;
    setRoundResult(null);
    setHud(buildHudSnapshot(freshSim));
    screenStateRef.current = 'playing';
    document.body.dataset.state = 'playing';
    setScreenState('playing');
    canvasRef.current?.focus();
  }, []);

  // Initialize OnlineClient WebRTC + Signaling once
  useEffect(() => {
    const client = new OnlineClient({
      onRoomUpdated: (room, myPeerId) => {
        onlineRoomRef.current = room;
        onlinePeerIdRef.current = myPeerId;
        setOnlineRoom(room);
        setOnlinePeerId(myPeerId);
        setOnlineHasTurn(client.hasTurnConfigured());
      },
      onError: (message) => {
        setOnlineError(message);
      },
      onMatchStarted: (room) => {
        onlineRoomRef.current = room;
        setOnlineRoom(room);
        beginOnlineMatch(room);
      },
      onGuestInput: (slotIndex, input) => {
        guestInputsRef.current[slotIndex] = input;
      },
      onSnapshotReceived: (snap: NetSnapshot) => {
        if (!isOnlineMatchRef.current || client.isHost()) return;
        const sim = simRef.current;
        applyNetSnapshot(sim, snap);
      },
      onMatchEnded: (result) => {
        if (!isOnlineMatchRef.current || client.isHost()) return;
        finalizeRound(result, true);
      },
    });
    onlineClientRef.current = client;

    // Auto-join if invite link ?room=CODE was opened
    const code = urlRoomParam.current;
    if (code) {
      const me = initial.current.slots[0];
      client
        .joinRoom({
          roomCode: code,
          name: me?.name || 'Misafir',
          costume: me?.costume ?? DEFAULT_SLOTS[0].costume,
        })
        .catch((err) => {
          setOnlineError(
            err instanceof Error ? err.message : 'Odaya katılınamadı.'
          );
        });
    }

    return () => {
      client.disconnect();
    };
  }, [beginOnlineMatch, finalizeRound]);

  const startLocalGame = useCallback((fromUserGesture = true) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (fromUserGesture) {
      soundEngine.unlock();
      soundEngine.playMenuClick();
    }
    soundEngine.startMusic();
    inputHubRef.current?.clearAll();
    rendererRef.current?.resetParticles();
    roundUnlockedRef.current.clear();
    isOnlineMatchRef.current = false;

    let freshSim: SimulationState;
    if (activeSagaLevelRef.current) {
      const lvl = activeSagaLevelRef.current;
      const sagaSettings: GameSettings = {
        ...settingsRef.current,
        mode: 'saga',
        mapId: lvl.mapId,
        lives: lvl.lives,
        roundDurationSec: lvl.roundDurationSec ?? 60,
        botsEnabled: true,
      };
      freshSim = createSimulation(
        sagaSettings,
        buildSagaSlots(lvl, slotsRef.current[0]),
        lvl.rule
      );
    } else if (activeStoryRef.current) {
      const { chapter, bonusLives } = activeStoryRef.current;
      const storySettings: GameSettings = {
        ...settingsRef.current,
        mode: 'story',
        mapId: chapter.mapId,
        lives: chapter.lives + bonusLives,
        roundDurationSec: chapter.roundDurationSec ?? 60,
        botsEnabled: true,
      };
      freshSim = createSimulation(
        storySettings,
        buildStorySlots(chapter),
        chapter.storyRule
      );
    } else {
      freshSim = createSimulation(settingsRef.current, slotsRef.current);
    }

    simRef.current = freshSim;
    setRoundResult(null);
    setHud(buildHudSnapshot(freshSim));
    screenStateRef.current = 'playing';
    document.body.dataset.state = 'playing';
    setScreenState('playing');
    canvasRef.current?.focus();
  }, []);

  const handleStartSagaLevel = useCallback(
    (level: SagaLevelDef) => {
      soundEngine.unlock();
      soundEngine.playMenuClick();
      activeStoryRef.current = null;
      activeSagaLevelRef.current = level;
      startLocalGame(true);
    },
    [startLocalGame]
  );

  const handleClaimSagaMilestone = useCallback(
    (stars: number, rewardXp: number) => {
      if (sagaProgressRef.current.claimedMilestones.includes(stars)) return;
      soundEngine.unlock();
      soundEngine.playAchievementUnlock();
      setSagaProgress((prev) => ({
        ...prev,
        claimedMilestones: Array.from(new Set([...prev.claimedMilestones, stars])),
      }));
      setProgression((prev) => {
        const nextXp = prev.xp + rewardXp;
        const { level } = computeLevelFromXp(nextXp);
        return { ...prev, xp: nextXp, level };
      });
    },
    []
  );

  const handleStartStoryChapter = useCallback(
    (chapter: StoryChapterDef, bonusLives: number) => {
      soundEngine.unlock();
      soundEngine.playMenuClick();
      activeSagaLevelRef.current = null;
      activeStoryRef.current = { chapter, bonusLives };
      setPostVictoryChapterId(null);
      startLocalGame(true);
    },
    [startLocalGame]
  );

  const handleSelectStoryChoice = useCallback(
    (chapter: StoryChapterDef, choice: StoryChoiceOption) => {
      soundEngine.unlock();
      soundEngine.playMenuClick();
      setStoryProgress((prev) => {
        const hadPrev = prev.choicesByChapter[chapter.id];
        const nextCounts = { ...prev.alignmentCounts };
        if (!hadPrev) {
          nextCounts[choice.alignment] = (nextCounts[choice.alignment] ?? 0) + 1;
        }
        const nextSecrets = choice.secretFound
          ? Array.from(new Set([...prev.secretsFound, choice.secretFound]))
          : prev.secretsFound;

        return {
          ...prev,
          choicesByChapter: {
            ...prev.choicesByChapter,
            [chapter.id]: choice.id,
          },
          alignmentCounts: nextCounts,
          secretsFound: nextSecrets,
        };
      });
    },
    []
  );

  const handleContinueStory = useCallback(() => {
    soundEngine.playMenuClick();
    soundEngine.stopMusic();
    const wonChId = roundResult?.storyChapterId ?? null;
    activeStoryRef.current = null;
    activeSagaLevelRef.current = null;
    setRoundResult(null);
    setPostVictoryChapterId(wonChId);
    setMenuSubView('story');
    screenStateRef.current = 'title';
    document.body.dataset.state = 'title';
    setScreenState('title');
  }, [roundResult]);

  const handleOpenSagaMap = useCallback(() => {
    soundEngine.playMenuClick();
    soundEngine.stopMusic();
    inputHubRef.current?.clearAll();
    rendererRef.current?.resetParticles();
    activeStoryRef.current = null;
    activeSagaLevelRef.current = null;
    setRoundResult(null);
    setMenuSubView('saga');
    screenStateRef.current = 'title';
    document.body.dataset.state = 'title';
    setScreenState('title');
  }, []);

  const pauseGame = useCallback(() => {
    if (screenStateRef.current !== 'playing') return;
    soundEngine.playMenuClick();
    soundEngine.stopMusic();
    inputHubRef.current?.clearAll();
    screenStateRef.current = 'paused';
    document.body.dataset.state = 'paused';
    setScreenState('paused');
  }, []);

  const resumeGame = useCallback(() => {
    if (screenStateRef.current !== 'paused') return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundEngine.unlock();
    soundEngine.playMenuClick();
    soundEngine.startMusic();
    inputHubRef.current?.clearAll();
    screenStateRef.current = 'playing';
    document.body.dataset.state = 'playing';
    setScreenState('playing');
    canvasRef.current?.focus();
  }, []);

  const returnToMainMenu = useCallback(() => {
    soundEngine.playMenuClick();
    soundEngine.stopMusic();
    inputHubRef.current?.clearAll();
    rendererRef.current?.resetParticles();
    activeStoryRef.current = null;
    activeSagaLevelRef.current = null;
    if (isOnlineMatchRef.current) {
      isOnlineMatchRef.current = false;
      onlineClientRef.current?.leaveRoom();
    }
    attractSimRef.current = createAttractSimulation(settingsRef.current);
    setRoundResult(null);
    setMenuSubView('home');
    screenStateRef.current = 'title';
    document.body.dataset.state = 'title';
    setScreenState('title');
  }, []);

  const handleQuitApp = useCallback(() => {
    soundEngine.playMenuClick();
    soundEngine.stopMusic();
    inputHubRef.current?.clearAll();
    rendererRef.current?.resetParticles();
    activeStoryRef.current = null;
    activeSagaLevelRef.current = null;
    if (isOnlineMatchRef.current) {
      isOnlineMatchRef.current = false;
      onlineClientRef.current?.leaveRoom();
    }
    setRoundResult(null);
    screenStateRef.current = 'exited';
    document.body.dataset.state = 'exited';
    setScreenState('exited');
  }, []);

  const finishChaosRound = useCallback(() => {
    if (screenStateRef.current !== 'playing') return;
    const res = buildRoundResult(simRef.current);
    finalizeRound(res, false);
  }, [finalizeRound]);

  const toggleMute = useCallback(() => {
    soundEngine.unlock();
    setSettings((prev) => ({
      ...prev,
      audio: { ...prev.audio, muted: !prev.audio.muted },
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    soundEngine.unlock();
    soundEngine.playMenuClick();
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.mapId && screenStateRef.current === 'title') {
        attractSimRef.current = createAttractSimulation(next);
      }
      return next;
    });
  }, []);

  const updateSlot = useCallback(
    (slotIndex: number, patch: Partial<PlayerSlotConfig>) => {
      soundEngine.unlock();
      soundEngine.playMenuClick();
      setSlots((prev) =>
        prev.map((s) => (s.slotIndex === slotIndex ? { ...s, ...patch } : s))
      );
    },
    []
  );

  // Unlock Web Audio on first user interaction
  useEffect(() => {
    const unlockOnGesture = () => {
      soundEngine.unlock();
    };
    window.addEventListener('pointerdown', unlockOnGesture, { once: true });
    window.addEventListener('keydown', unlockOnGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
    };
  }, []);

  // ?autostart=1 support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startLocalGame(false);
    }
  }, [startLocalGame]);

  // Mount Canvas simulation loop & InputHub once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const inputHub = new InputHub();
    inputHub.attach();
    inputHubRef.current = inputHub;

    const renderer = new CastleRenderer();
    rendererRef.current = renderer;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    // Global shell hotkeys
    const onGlobalKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.code === 'Escape' && screenStateRef.current === 'title') {
          setMenuSubView('home');
        }
        return;
      }

      if (e.code === 'KeyM') {
        toggleMute();
        return;
      }

      if (screenStateRef.current === 'title') {
        if (
          menuSubViewRef.current === 'home' &&
          (e.code === 'Enter' || e.code === 'Space')
        ) {
          e.preventDefault();
          activeStoryRef.current = null;
          startLocalGame(true);
        } else if (e.code === 'Escape' && menuSubViewRef.current !== 'home') {
          setMenuSubView('home');
        }
        return;
      }

      if (screenStateRef.current === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          pauseGame();
        } else if (e.code === 'KeyR' && !isOnlineMatchRef.current) {
          e.preventDefault();
          startLocalGame(true);
        }
      } else if (screenStateRef.current === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          resumeGame();
        } else if (e.code === 'KeyR' && !isOnlineMatchRef.current) {
          e.preventDefault();
          startLocalGame(true);
        }
      }
    };
    window.addEventListener('keydown', onGlobalKey);

    let rafId = 0;
    let lastTime = performance.now();
    let totalTime = 0;
    let hudSyncAccum = 0;
    let netSyncAccum = 0;
    let lastHudSignature = '';

    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      totalTime += dt;

      const state = screenStateRef.current;

      if (state === 'title') {
        const attractSim = attractSimRef.current;
        const botInputs: Record<number, PlayerInputState> = {};
        for (const p of attractSim.players) {
          botInputs[p.slotIndex] = computeBotInput(p, attractSim, dt);
        }
        stepSimulation(
          attractSim,
          botInputs,
          dt,
          settingsRef.current.controls.jumpCutEnabled
        );
        renderer.consumeEvents(attractSim.pendingEvents);
        renderer.updateParticles(dt);
        renderer.render(
          ctx,
          canvas.clientWidth,
          canvas.clientHeight,
          attractSim,
          totalTime,
          true
        );
      } else if (state === 'playing') {
        const sim = simRef.current;
        const isOnline = isOnlineMatchRef.current;
        const client = onlineClientRef.current;
        const room = onlineRoomRef.current;
        const myPeerId = onlinePeerIdRef.current;
        const isGuest = isOnline && Boolean(client && !client.isHost());
        const controls = settingsRef.current.controls;

        if (isGuest && client && room && myPeerId) {
          // Guest sends local player input to Host & renders latest snapshot
          const me = room.peers.find((p) => p.peerId === myPeerId);
          if (me) {
            const myInput = inputHub.readPlayerInput(0, true, controls);
            netSyncAccum += dt;
            if (netSyncAccum >= 0.032 || myInput.jumpPressed || myInput.abilityPressed) {
              netSyncAccum = 0;
              client.sendGuestInput(myInput);
            }
          }
        } else {
          // Host (Online) OR Local/Story/Saga Simulation
          const humanCount = sim.players.filter((p) => !p.isBot).length;
          const singleHumanMode = isOnline || humanCount === 1;
          const myOnlineSlot =
            isOnline && room && myPeerId
              ? room.peers.find((p) => p.peerId === myPeerId)?.slotIndex ?? 0
              : 0;

          const inputs: Record<number, PlayerInputState> = {};
          for (const p of sim.players) {
            if (p.isBot) {
              inputs[p.slotIndex] = computeBotInput(p, sim, dt);
            } else if (isOnline) {
              if (p.slotIndex === myOnlineSlot) {
                inputs[p.slotIndex] = inputHub.readPlayerInput(0, true, controls);
              } else {
                const gIn = guestInputsRef.current[p.slotIndex];
                if (gIn) {
                  inputs[p.slotIndex] = { ...gIn };
                  // consume one-frame edge triggers
                  gIn.jumpPressed = false;
                  gIn.abilityPressed = false;
                } else {
                  inputs[p.slotIndex] = {
                    left: false,
                    right: false,
                    upHeld: false,
                    jumpPressed: false,
                    down: false,
                    abilityPressed: false,
                  };
                }
              }
            } else {
              inputs[p.slotIndex] = inputHub.readPlayerInput(
                p.slotIndex,
                singleHumanMode,
                controls
              );
            }
          }

          stepSimulation(sim, inputs, dt, controls.jumpCutEnabled);

          if (isOnline && client?.isHost()) {
            netSyncAccum += dt;
            if (netSyncAccum >= 0.033 || sim.pendingEvents.length > 0) {
              netSyncAccum = 0;
              client.broadcastSimSnapshot(sim, [...sim.pendingEvents]);
            }
          }
        }

        // Trigger synchronized SFX for simulation events (host, local, and guest)
        for (const ev of sim.pendingEvents) {
          if (ev.type === 'jump') soundEngine.playJump(false);
          else if (ev.type === 'double_jump') soundEngine.playJump(true);
          else if (ev.type === 'stomp') soundEngine.playStomp();
          else if (ev.type === 'bump') soundEngine.playBump();
          else if (ev.type === 'ko') soundEngine.playKO();
          else if (ev.type === 'cannon') soundEngine.playCannon();
          else if (ev.type === 'ability') soundEngine.playJump(true);
        }

        renderer.consumeEvents(sim.pendingEvents);
        renderer.updateParticles(dt);
        renderer.render(
          ctx,
          canvas.clientWidth,
          canvas.clientHeight,
          sim,
          totalTime,
          false
        );

        // Check round completion (Host / Local)
        if (!isGuest && sim.finished) {
          const result = buildRoundResult(sim);
          finalizeRound(result, false);
        } else {
          // Throttled HUD & Live Achievement sync
          hudSyncAccum += dt;
          if (hudSyncAccum >= 0.12) {
            hudSyncAccum = 0;
            const liveUnlocked = evaluateLiveAchievements(
              sim,
              new Set(achievementStateRef.current.unlockedIds),
              isOnline
            );
            if (liveUnlocked.length > 0) {
              grantAchievements(liveUnlocked);
            }

            const snap = buildHudSnapshot(sim);
            const sig = `${Math.ceil(snap.timeRemainingSec)}|${snap.aliveCount}|${snap.hazardPhase}|${snap.storyObjective ?? ''}|${snap.players
              .map(
                (p) =>
                  `${p.lives}:${p.score}:${p.kills}:${p.stomps}:${p.eliminated}:${p.abilityCooldown.toFixed(
                    1
                  )}:${p.shielded ? 1 : 0}:${p.stunned ? 1 : 0}`
              )
              .join(',')}`;
            if (sig !== lastHudSignature) {
              lastHudSignature = sig;
              setHud(snap);
            }
          }
        }
      } else {
        // Paused or GameOver: freeze sim, render latest frame
        const sim = simRef.current;
        renderer.render(
          ctx,
          canvas.clientWidth,
          canvas.clientHeight,
          sim,
          totalTime,
          false
        );
      }

      inputHub.endFrame();
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('keydown', onGlobalKey);
      inputHub.detach();
      soundEngine.stopMusic();
    };
  }, [
    finalizeRound,
    grantAchievements,
    pauseGame,
    resumeGame,
    startLocalGame,
    toggleMute,
  ]);

  const isOnlineGuest =
    isOnlineMatchRef.current && Boolean(onlineClientRef.current && !onlineClientRef.current.isHost());

  return (
    <main className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* Persistent Full-Viewport 2D Game Canvas */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        data-testid="game-canvas"
        aria-label="Kale Kapmaca Oyun Alanı"
        className="block w-full h-full outline-none pixel-canvas"
      />

      {/* Title Screen & Sub-menus */}
      {screenState === 'title' && (
        <MainMenu
          subView={menuSubView}
          settings={settings}
          slots={slots}
          storyProgress={storyProgress}
          sagaProgress={sagaProgress}
          progression={progression}
          achievementState={achievementState}
          postVictoryChapterId={postVictoryChapterId}
          onlineRoom={onlineRoom}
          onlinePeerId={onlinePeerId}
          onlineError={onlineError}
          onlineHasTurn={onlineHasTurn}
          initialRoomCode={urlRoomParam.current}
          onSetSubView={(v) => {
            soundEngine.unlock();
            soundEngine.playMenuClick();
            setMenuSubView(v);
          }}
          onUpdateSettings={updateSettings}
          onUpdateSlot={updateSlot}
          onStartGame={() => {
            activeStoryRef.current = null;
            activeSagaLevelRef.current = null;
            startLocalGame(true);
          }}
          onStartSagaLevel={handleStartSagaLevel}
          onClaimSagaMilestone={handleClaimSagaMilestone}
          onDismissStoryVictory={() => setPostVictoryChapterId(null)}
          onSelectStoryChoice={handleSelectStoryChoice}
          onStartStoryChapter={handleStartStoryChapter}
          onCreateOnlineRoom={async (name: string, costume: CostumeConfig) => {
            soundEngine.unlock();
            const currentMode = settingsRef.current.mode;
            const roomMode =
              currentMode === 'story' || currentMode === 'saga' ? 'ffa' : currentMode;
            await onlineClientRef.current?.createRoom({
              name,
              costume,
              mode: roomMode,
              mapId: settingsRef.current.mapId,
              lives: settingsRef.current.lives,
              roundDurationSec: settingsRef.current.roundDurationSec,
              botsEnabled: settingsRef.current.botsEnabled,
            });
          }}
          onJoinOnlineRoom={async (
            code: string,
            name: string,
            costume: CostumeConfig
          ) => {
            soundEngine.unlock();
            await onlineClientRef.current?.joinRoom({
              roomCode: code,
              name,
              costume,
            });
          }}
          onUpdateOnlineProfile={(name, costume) => {
            onlineClientRef.current?.updateProfile({ name, costume });
          }}
          onUpdateOnlineRoomConfig={(patch: {
            mode?: GameModeId;
            mapId?: MapId;
            lives?: number;
            roundDurationSec?: number;
            botsEnabled?: boolean;
          }) => {
            onlineClientRef.current?.updateRoomConfig(patch);
          }}
          onStartOnlineMatch={() => {
            soundEngine.unlock();
            soundEngine.playMenuClick();
            onlineClientRef.current?.startMatch();
          }}
          onLeaveOnlineRoom={() => {
            soundEngine.playMenuClick();
            onlineClientRef.current?.leaveRoom();
          }}
          onClearOnlineError={() => setOnlineError(null)}
          onQuitApp={handleQuitApp}
        />
      )}

      {/* Active Gameplay HUD */}
      {(screenState === 'playing' || screenState === 'paused') && hud && (
        <GameHud
          hud={hud}
          muted={settings.audio.muted}
          achievementToasts={achievementToasts}
          isOnlineGuest={isOnlineGuest}
          touchControlsEnabled={settings.controls.touchControlsEnabled}
          abilityKeyLabel={formatKeyCode(settings.controls.p1.ability)}
          onToggleMute={toggleMute}
          onPause={pauseGame}
          onRestart={() => startLocalGame(true)}
          onFinishChaos={finishChaosRound}
          onQuit={returnToMainMenu}
          onTouchHeld={(key, active) => inputHubRef.current?.setVirtualHeld(key, active)}
          onTouchJump={() => inputHubRef.current?.triggerVirtualJump()}
          onTouchAbility={() => inputHubRef.current?.triggerVirtualAbility()}
        />
      )}

      {/* Pause Modal */}
      {screenState === 'paused' && (
        <PauseModal
          onResume={resumeGame}
          onRestart={() => {
            if (!isOnlineMatchRef.current) startLocalGame(true);
            else resumeGame();
          }}
          onMainMenu={returnToMainMenu}
          onQuit={handleQuitApp}
        />
      )}

      {/* Round Victory / Leaderboard Modal */}
      {screenState === 'gameover' && roundResult && (
        <VictoryModal
          result={roundResult}
          isOnlineGuest={isOnlineGuest}
          onContinueStory={
            roundResult.storyWon ? handleContinueStory : undefined
          }
          onOpenSagaMap={
            roundResult.sagaLevelId ? handleOpenSagaMap : undefined
          }
          onPlayAgain={() => {
            if (isOnlineMatchRef.current && onlineClientRef.current?.isHost()) {
              onlineClientRef.current.startMatch();
            } else {
              startLocalGame(true);
            }
          }}
          onMainMenu={returnToMainMenu}
          onQuit={handleQuitApp}
        />
      )}

      {/* Clean Exit Screen */}
      {screenState === 'exited' && (
        <div
          data-testid="exited-screen"
          className="fixed inset-0 z-30 bg-slate-950/92 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-slate-950 border-2 border-amber-500/80 pixel-panel p-7 text-center text-amber-50">
            <LogOut className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="font-display text-3xl font-bold text-amber-300">
              Oyundan Çıkıldı
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Kale Kapmaca oturumun güvenle sonlandırıldı. Tüm yıldızların, başarımların ve seviye ilerlemen kaydedildi.
            </p>
            <div className="mt-6">
              <button
                type="button"
                data-testid="exited-return-btn"
                onClick={returnToMainMenu}
                className="w-full py-3.5 px-5 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer pixel-btn"
              >
                <RotateCcw className="w-4 h-4" />
                Tekrar Oyna / Ana Menüye Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
