import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import { soundEngine } from '../audio/sound';
import { DEFAULT_SLOTS, formatKeyCode } from '../content/constants';
import { loadProgression, saveProgression, computeLevelFromXp } from '../content/heroes';
import { loadSagaProgress, saveSagaProgress } from '../content/saga';
import { loadStoryProgress, saveStoryProgress } from '../content/story';
import { InputHub } from '../input/input';
import { ConnectionStatus, OnlineClient } from '../net/client';
import { MatchStartPayload, Profile, RoomSettings } from '../net/protocol';
import { buildHudSnapshot, buildRoundResult, createSimulation } from '../sim';
import {
  AchievementId,
  AchievementState,
  AppScreenState,
  GameSettings,
  HudSnapshot,
  MenuSubView,
  OnlineRoomState,
  PlayerProgression,
  PlayerSlotConfig,
  RoundResult,
  SagaLevelDef,
  SagaProgress,
  SimulationState,
  StoryChapterDef,
  StoryChoiceOption,
  StoryProgress,
} from '../sim/types';
import { MatchConfig } from '../sim/world';
import {
  evaluateLiveAchievements,
  evaluateRoundEndAchievements,
  loadAchievements,
  saveAchievements,
} from '../state/achievements';
import { applyRoundRewards, applyStoryVictory, buildSagaSlots, buildStorySlots } from '../state/progress';
import { loadPrefs, savePrefs } from '../state/settings';
import { GameHud } from './components/GameHud';
import { MainMenu } from './components/MainMenu';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { GameSession } from './game/session';

type ActiveMatch =
  | { kind: 'local' }
  | { kind: 'story'; chapter: StoryChapterDef; bonusLives: number }
  | { kind: 'saga'; level: SagaLevelDef }
  | { kind: 'online'; localSlot: number };

type Screen = AppScreenState | 'exited';

function configFromSettings(s: GameSettings, patch: Partial<MatchConfig> = {}): MatchConfig {
  return {
    mode: s.mode,
    mapId: s.mapId,
    lives: s.lives,
    roundDurationSec: s.roundDurationSec,
    botsEnabled: s.botsEnabled,
    botDifficulty: s.botDifficulty,
    jumpCutEnabled: s.controls.jumpCutEnabled,
    ...patch,
  };
}

function createAttractSim(settings: GameSettings): SimulationState {
  const slots: PlayerSlotConfig[] = DEFAULT_SLOTS.map((s) => ({ ...s, kind: 'bot', aiDifficulty: 'hard' }));
  return createSimulation(
    configFromSettings(settings, { mode: 'chaos', botsEnabled: true, botDifficulty: 'hard', countdownSec: 0 }),
    slots
  );
}

function profileFromSlot(slot: PlayerSlotConfig): Profile {
  return { name: slot.name || 'Oyuncu', heroId: slot.heroId ?? 'pofi', costume: { ...slot.costume } };
}

export default function App() {
  const initial = useRef(loadPrefs());
  const roomParam = useRef(new URLSearchParams(location.search).get('oda')?.toUpperCase().slice(0, 6) ?? '');

  const [settings, setSettings] = useState<GameSettings>(initial.current.settings);
  const [slots, setSlots] = useState<PlayerSlotConfig[]>(initial.current.slots);
  const [screen, setScreen] = useState<Screen>('title');
  const [subView, setSubView] = useState<MenuSubView>(roomParam.current ? 'online' : 'home');
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(loadStoryProgress);
  const [sagaProgress, setSagaProgress] = useState<SagaProgress>(loadSagaProgress);
  const [progression, setProgression] = useState<PlayerProgression>(loadProgression);
  const [achievementState, setAchievementState] = useState<AchievementState>(loadAchievements);
  const [toasts, setToasts] = useState<AchievementId[]>([]);
  const [postVictoryChapterId, setPostVictoryChapterId] = useState<number | null>(null);

  const [room, setRoom] = useState<OnlineRoomState | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [netStatus, setNetStatus] = useState<ConnectionStatus>('idle');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(() => profileFromSlot(initial.current.slots[0]));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<InputHub>(new InputHub());
  const sessionRef = useRef<GameSession | null>(null);
  const clientRef = useRef<OnlineClient>(new OnlineClient());
  const activeRef = useRef<ActiveMatch>({ kind: 'local' });
  const screenRef = useRef<Screen>(screen);
  const subViewRef = useRef(subView);
  const settingsRef = useRef(settings);
  const slotsRef = useRef(slots);
  const progressionRef = useRef(progression);
  const sagaRef = useRef(sagaProgress);
  const achievementRef = useRef(achievementState);
  const roundUnlocked = useRef(new Set<AchievementId>());

  settingsRef.current = settings;
  slotsRef.current = slots;
  progressionRef.current = progression;
  sagaRef.current = sagaProgress;
  subViewRef.current = subView;

  const go = useCallback((next: Screen) => {
    screenRef.current = next;
    document.body.dataset.state = next;
    setScreen(next);
  }, []);

  useEffect(() => savePrefs({ settings, slots }), [settings, slots]);
  useEffect(() => saveStoryProgress(storyProgress), [storyProgress]);
  useEffect(() => saveSagaProgress(sagaProgress), [sagaProgress]);
  useEffect(() => saveProgression(progression), [progression]);
  useEffect(() => {
    soundEngine.updateSettings(settings.audio);
    sessionRef.current?.updateSettings(settings);
  }, [settings]);

  const grantAchievements = useCallback((ids: AchievementId[]) => {
    const current = achievementRef.current;
    const fresh = ids.filter((id) => !current.unlockedIds.includes(id));
    if (fresh.length === 0) return;
    const now = Date.now();
    const next: AchievementState = {
      unlockedIds: [...current.unlockedIds, ...fresh],
      unlockedAt: { ...current.unlockedAt, ...Object.fromEntries(fresh.map((id) => [id, now])) },
    };
    fresh.forEach((id) => roundUnlocked.current.add(id));
    achievementRef.current = next;
    setAchievementState(next);
    saveAchievements(next);
    soundEngine.playAchievementUnlock();
    setToasts((prev) => Array.from(new Set([...prev, ...fresh])));
    window.setTimeout(() => setToasts((prev) => prev.filter((id) => !fresh.includes(id))), 3800);
  }, []);

  const runSession = useCallback((session: GameSession) => {
    sessionRef.current?.stop();
    sessionRef.current = session;
    if (canvasRef.current) session.start(canvasRef.current);
  }, []);

  const startAttract = useCallback(() => {
    runSession(new GameSession({ kind: 'attract', sim: createAttractSim(settingsRef.current), settings: settingsRef.current, input: inputRef.current }));
  }, [runSession]);

  const finalizeRound = useCallback(
    (raw: RoundResult) => {
      soundEngine.stopMusic();
      soundEngine.playVictoryFanfare();
      const active = activeRef.current;
      const isOnline = active.kind === 'online';
      grantAchievements(evaluateRoundEndAchievements(raw, new Set(achievementRef.current.unlockedIds), isOnline));
      if (raw.storyWon && raw.storyChapterId) setStoryProgress((prev) => applyStoryVictory(prev, raw.storyChapterId!));
      const outcome = applyRoundRewards(raw, progressionRef.current, sagaRef.current, isOnline ? active.localSlot : 0);
      setProgression(outcome.progression);
      setSagaProgress(outcome.saga);
      setRoundResult({ ...outcome.result, unlockedAchievements: Array.from(roundUnlocked.current) });
      if (sessionRef.current) setHud(buildHudSnapshot(sessionRef.current.sim));
      go('gameover');
    },
    [go, grantAchievements]
  );

  const onHud = useCallback(
    (next: HudSnapshot, sim: SimulationState) => {
      setHud(next);
      const active = activeRef.current;
      const live = evaluateLiveAchievements(sim, new Set(achievementRef.current.unlockedIds), active.kind === 'online');
      if (live.length) grantAchievements(live);
    },
    [grantAchievements]
  );

  const startMatch = useCallback(
    (active: ActiveMatch) => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      soundEngine.unlock();
      soundEngine.playMenuClick();
      soundEngine.startMusic();
      inputRef.current.clearAll();
      roundUnlocked.current.clear();
      activeRef.current = active;
      const s = settingsRef.current;
      let sim: SimulationState;
      if (active.kind === 'story') {
        const ch = active.chapter;
        sim = createSimulation(
          configFromSettings(s, { mode: 'story', mapId: ch.mapId, lives: ch.lives + active.bonusLives, roundDurationSec: ch.roundDurationSec ?? 60, botsEnabled: true }),
          buildStorySlots(ch),
          ch.storyRule
        );
      } else if (active.kind === 'saga') {
        const lvl = active.level;
        sim = createSimulation(
          configFromSettings(s, { mode: 'saga', mapId: lvl.mapId, lives: lvl.lives, roundDurationSec: lvl.roundDurationSec ?? 60, botsEnabled: true }),
          buildSagaSlots(lvl, slotsRef.current[0]),
          lvl.rule
        );
      } else {
        sim = createSimulation(configFromSettings(s), slotsRef.current);
      }
      runSession(new GameSession({ kind: 'local', sim, settings: s, input: inputRef.current, onHud, onFinished: finalizeRound }));
      setRoundResult(null);
      setHud(buildHudSnapshot(sim));
      go('playing');
      canvasRef.current?.focus();
    },
    [finalizeRound, go, onHud, runSession]
  );

  const beginOnlineMatch = useCallback(
    (match: MatchStartPayload) => {
      soundEngine.unlock();
      soundEngine.startMusic();
      inputRef.current.clearAll();
      roundUnlocked.current.clear();
      activeRef.current = { kind: 'online', localSlot: match.yourSlot };
      const sim = createSimulation(match.config, match.slots);
      runSession(
        new GameSession({ kind: 'online', sim, settings: settingsRef.current, input: inputRef.current, online: clientRef.current, localSlot: match.yourSlot, onHud })
      );
      setRoundResult(null);
      setHud(buildHudSnapshot(sim));
      go('playing');
    },
    [go, onHud, runSession]
  );

  const returnToMenu = useCallback(
    (view: MenuSubView = 'home') => {
      soundEngine.playMenuClick();
      soundEngine.stopMusic();
      inputRef.current.clearAll();
      const wasOnline = activeRef.current.kind === 'online';
      activeRef.current = { kind: 'local' };
      setRoundResult(null);
      setSubView(wasOnline && clientRef.current.room && view === 'home' ? 'online' : view);
      startAttract();
      go('title');
    },
    [go, startAttract]
  );

  // Online client wiring (callbacks always see latest handlers through refs)
  const beginOnlineRef = useRef(beginOnlineMatch);
  const finalizeRef = useRef(finalizeRound);
  beginOnlineRef.current = beginOnlineMatch;
  finalizeRef.current = finalizeRound;
  useEffect(() => {
    const client = clientRef.current;
    client.setCallbacks({
      onStatus: (s) => {
        setNetStatus(s);
        setPeerId(client.peerId);
      },
      onRoom: setRoom,
      onError: setOnlineError,
      onPing: setPingMs,
      onMatchStart: (m) => beginOnlineRef.current(m),
      onMatchEnd: (r) => {
        if (activeRef.current.kind === 'online') finalizeRef.current(r);
      },
    });
    return () => client.disconnect();
  }, []);

  const withConnection = useCallback(
    async (action: (client: OnlineClient) => void) => {
      soundEngine.unlock();
      setOnlineError(null);
      try {
        await clientRef.current.connect(profile);
        action(clientRef.current);
      } catch (e) {
        setOnlineError(e instanceof Error ? e.message : 'Bağlantı kurulamadı');
      }
    },
    [profile]
  );

  const updateProfile = useCallback((next: Profile) => {
    setProfile(next);
    if (next.name.trim()) clientRef.current.updateProfile({ ...next, name: next.name.trim() });
  }, []);

  const pause = useCallback(() => {
    if (screenRef.current !== 'playing' || activeRef.current.kind === 'online') return;
    soundEngine.playMenuClick();
    soundEngine.stopMusic();
    sessionRef.current?.setPaused(true);
    go('paused');
  }, [go]);

  const resume = useCallback(() => {
    if (screenRef.current !== 'paused') return;
    soundEngine.startMusic();
    sessionRef.current?.setPaused(false);
    go('playing');
    canvasRef.current?.focus();
  }, [go]);

  const toggleMute = useCallback(() => {
    soundEngine.unlock();
    setSettings((prev) => ({ ...prev, audio: { ...prev.audio, muted: !prev.audio.muted } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    soundEngine.unlock();
    soundEngine.playMenuClick();
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSlot = useCallback((slotIndex: number, patch: Partial<PlayerSlotConfig>) => {
    soundEngine.unlock();
    soundEngine.playMenuClick();
    setSlots((prev) => prev.map((s) => (s.slotIndex === slotIndex ? { ...s, ...patch } : s)));
  }, []);

  const selectStoryChoice = useCallback((chapter: StoryChapterDef, choice: StoryChoiceOption) => {
    soundEngine.playMenuClick();
    setStoryProgress((prev) => {
      const counts = { ...prev.alignmentCounts };
      if (!prev.choicesByChapter[chapter.id]) counts[choice.alignment] = (counts[choice.alignment] ?? 0) + 1;
      return {
        ...prev,
        choicesByChapter: { ...prev.choicesByChapter, [chapter.id]: choice.id },
        alignmentCounts: counts,
        secretsFound: choice.secretFound ? Array.from(new Set([...prev.secretsFound, choice.secretFound])) : prev.secretsFound,
      };
    });
  }, []);

  const claimSagaMilestone = useCallback((stars: number, rewardXp: number) => {
    if (sagaRef.current.claimedMilestones.includes(stars)) return;
    soundEngine.playAchievementUnlock();
    setSagaProgress((prev) => ({ ...prev, claimedMilestones: Array.from(new Set([...prev.claimedMilestones, stars])) }));
    setProgression((prev) => {
      const xp = prev.xp + rewardXp;
      return { ...prev, xp, level: computeLevelFromXp(xp).level };
    });
  }, []);

  // Input, attract loop, audio unlock and hotkeys
  useEffect(() => {
    const input = inputRef.current;
    input.attach();
    startAttract();
    const unlock = () => soundEngine.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'KeyM') return toggleMute();
      const sc = screenRef.current;
      if (sc === 'playing' && (e.code === 'Escape' || e.code === 'KeyP')) pause();
      else if (sc === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
      else if (sc === 'title' && e.code === 'Escape' && subViewRef.current !== 'home') setSubView('home');
    };
    window.addEventListener('keydown', onKey);
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (new URLSearchParams(location.search).get('autostart') === '1') startMatch({ kind: 'local' });
    return () => {
      input.detach();
      sessionRef.current?.stop();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', unlock);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = activeRef.current;
  const isOnline = active.kind === 'online';

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        data-testid="game-canvas"
        aria-label="Kale Kapmaca oyun alanı"
        className="block w-full h-full outline-none pixel-canvas"
      />

      {screen === 'title' && (
        <MainMenu
          subView={subView}
          settings={settings}
          slots={slots}
          storyProgress={storyProgress}
          sagaProgress={sagaProgress}
          progression={progression}
          achievementState={achievementState}
          postVictoryChapterId={postVictoryChapterId}
          onSetSubView={(v) => {
            soundEngine.unlock();
            soundEngine.playMenuClick();
            setSubView(v);
          }}
          onUpdateSettings={updateSettings}
          onUpdateSlot={updateSlot}
          onStartGame={() => startMatch({ kind: 'local' })}
          onStartSagaLevel={(level) => startMatch({ kind: 'saga', level })}
          onClaimSagaMilestone={claimSagaMilestone}
          onDismissStoryVictory={() => setPostVictoryChapterId(null)}
          onSelectStoryChoice={selectStoryChoice}
          onStartStoryChapter={(chapter, bonusLives) => {
            setPostVictoryChapterId(null);
            startMatch({ kind: 'story', chapter, bonusLives });
          }}
          onQuitApp={() => {
            sessionRef.current?.stop();
            soundEngine.stopMusic();
            go('exited');
          }}
          onlineLobby={
            <OnlineLobbyModal
              room={room}
              myPeerId={peerId}
              status={netStatus}
              pingMs={pingMs}
              error={onlineError}
              initialRoomCode={roomParam.current}
              profile={profile}
              progression={progression}
              onCreateRoom={(rs: RoomSettings) => withConnection((c) => c.createRoom(rs))}
              onJoinRoom={(code) => withConnection((c) => c.joinRoom(code))}
              onUpdateProfile={updateProfile}
              onUpdateSettings={(rs) => clientRef.current.updateSettings(rs)}
              onStartMatch={() => clientRef.current.startMatch()}
              onLeaveRoom={() => {
                soundEngine.playMenuClick();
                clientRef.current.leaveRoom();
                setRoom(null);
              }}
              onClearError={() => setOnlineError(null)}
              onBack={() => setSubView('home')}
            />
          }
        />
      )}

      {(screen === 'playing' || screen === 'paused') && hud && (
        <GameHud
          hud={hud}
          muted={settings.audio.muted}
          achievementToasts={toasts}
          isOnline={isOnline}
          localSlot={isOnline ? active.localSlot : 0}
          touchControlsEnabled={settings.controls.touchControlsEnabled}
          abilityKeyLabel={formatKeyCode(settings.controls.p1.ability)}
          onToggleMute={toggleMute}
          onPause={pause}
          onFinishChaos={() => sessionRef.current && finalizeRound(buildRoundResult(sessionRef.current.sim))}
          onQuit={() => {
            if (isOnline) clientRef.current.leaveRoom();
            returnToMenu('home');
          }}
          onTouchHeld={(key, on) => inputRef.current.setVirtualHeld(key, on)}
          onTouchJump={() => inputRef.current.triggerVirtualJump()}
          onTouchAbility={() => inputRef.current.triggerVirtualAbility()}
        />
      )}

      {screen === 'paused' && (
        <PauseModal onResume={resume} onRestart={() => startMatch(activeRef.current)} onMainMenu={() => returnToMenu('home')} />
      )}

      {screen === 'gameover' && roundResult && (
        <VictoryModal
          result={roundResult}
          isOnline={isOnline}
          canRematch={!isOnline || clientRef.current.isHost}
          onContinueStory={
            roundResult.storyWon
              ? () => {
                  setPostVictoryChapterId(roundResult.storyChapterId ?? null);
                  returnToMenu('story');
                }
              : undefined
          }
          onOpenSagaMap={roundResult.sagaLevelId ? () => returnToMenu('saga') : undefined}
          onPlayAgain={() => (isOnline ? clientRef.current.startMatch() : startMatch(activeRef.current))}
          onMainMenu={() => returnToMenu(isOnline ? 'online' : 'home')}
        />
      )}

      {screen === 'exited' && (
        <div data-testid="exited-screen" className="fixed inset-0 z-30 bg-slate-950/92 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border-2 border-amber-500/80 pixel-panel p-7 text-center text-amber-50">
            <LogOut className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="font-display text-3xl font-bold text-amber-300">Oyundan Çıkıldı</h2>
            <p className="text-sm text-slate-300 mt-2">Tüm yıldızların, başarımların ve seviye ilerlemen kaydedildi. Sekmeyi kapatabilirsin.</p>
            <button
              type="button"
              data-testid="exited-return-btn"
              onClick={() => returnToMenu('home')}
              className="mt-6 w-full min-h-12 px-5 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold inline-flex items-center justify-center gap-2 cursor-pointer pixel-btn"
            >
              <RotateCcw className="w-4 h-4" /> Ana Menüye Dön
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
