import { DEFAULT_SLOTS } from '../content/constants';
import { computeLevelFromXp, getHeroDef } from '../content/heroes';
import { SAGA_LEVELS, computeSagaStarsEarned } from '../content/saga';
import { POFI_COSTUME, STORY_CHAPTERS, computeEndingFromCounts } from '../content/story';
import {
  PlayerProgression,
  PlayerSlotConfig,
  RoundResult,
  SagaLevelDef,
  SagaProgress,
  StoryChapterDef,
  StoryProgress,
} from '../sim/types';

function fillOff(result: PlayerSlotConfig[]): PlayerSlotConfig[] {
  for (let s = result.length; s < 4; s++) {
    result.push({ ...DEFAULT_SLOTS[s], slotIndex: s, kind: 'off' });
  }
  return result;
}

/** Story chapters: player is always Pofi; allies & rivals fight with their own hero kits. */
export function buildStorySlots(chapter: StoryChapterDef): PlayerSlotConfig[] {
  const result: PlayerSlotConfig[] = [
    { slotIndex: 0, kind: 'human', name: 'Pofi', team: 'A', aiPersonality: 'balanced', heroId: 'pofi', costume: { ...POFI_COSTUME } },
  ];
  if (chapter.ally) {
    result.push({
      slotIndex: result.length,
      kind: 'bot',
      name: chapter.ally.name,
      team: 'A',
      aiPersonality: chapter.ally.aiPersonality,
      heroId: chapter.ally.heroId ?? 'leyla',
      costume: { ...chapter.ally.costume },
    });
  }
  for (const rival of chapter.rivals) {
    if (result.length >= 4) break;
    result.push({
      slotIndex: result.length,
      kind: 'bot',
      name: rival.name,
      team: rival.team,
      aiPersonality: rival.aiPersonality,
      heroId: rival.heroId ?? 'tiknaz',
      costume: { ...rival.costume },
    });
  }
  return fillOff(result);
}

export function buildSagaSlots(level: SagaLevelDef, p1Slot: PlayerSlotConfig): PlayerSlotConfig[] {
  const hero = getHeroDef(p1Slot.heroId);
  const result: PlayerSlotConfig[] = [
    { ...p1Slot, slotIndex: 0, kind: 'human', team: 'A', heroId: hero.id, costume: { ...p1Slot.costume } },
  ];
  if (level.ally) {
    result.push({
      slotIndex: result.length,
      kind: 'bot',
      name: level.ally.name,
      team: 'A',
      aiPersonality: level.ally.aiPersonality,
      heroId: level.ally.heroId,
      costume: { ...level.ally.costume },
    });
  }
  for (const rival of level.rivals) {
    if (result.length >= 4) break;
    result.push({
      slotIndex: result.length,
      kind: 'bot',
      name: rival.name,
      team: 'B',
      aiPersonality: rival.aiPersonality,
      heroId: rival.heroId,
      costume: { ...rival.costume },
    });
  }
  return fillOff(result);
}

export function applyStoryVictory(prev: StoryProgress, chapterId: number): StoryProgress {
  const ch = STORY_CHAPTERS.find((c) => c.id === chapterId);
  if (!ch) return prev;
  const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
  let endingReached = prev.endingReached;
  if (ch.id === 7) {
    const chosen = ch.choices.find((opt) => opt.id === prev.choicesByChapter[7]);
    endingReached = computeEndingFromCounts(prev.alignmentCounts, chosen?.alignment);
  }
  return {
    ...prev,
    completedChapters: uniq([...prev.completedChapters, ch.id]),
    unlockedMaps: uniq([...prev.unlockedMaps, ch.unlockMapId]),
    unlockedColors: ch.unlockColorId ? uniq([...prev.unlockedColors, ch.unlockColorId]) : prev.unlockedColors,
    unlockedFes: ch.unlockFesId ? uniq([...prev.unlockedFes, ch.unlockFesId]) : prev.unlockedFes,
    secretsFound: ch.secretLore ? uniq([...prev.secretsFound, ch.secretLore]) : prev.secretsFound,
    endingReached,
  };
}

export interface RewardOutcome {
  result: RoundResult;
  progression: PlayerProgression;
  saga: SagaProgress;
}

/** Pure reward calculation for the local player (slot 0, or `localSlot` online). */
export function applyRoundRewards(
  raw: RoundResult,
  progression: PlayerProgression,
  saga: SagaProgress,
  localSlot = 0
): RewardOutcome {
  const me = raw.standings.find((s) => s.slotIndex === localSlot) ?? raw.standings[0];
  const won = raw.winnerSlot === localSlot || Boolean(raw.storyWon) || Boolean(raw.sagaWon) ||
    (raw.winnerTeam != null && me?.team === raw.winnerTeam);

  let sagaStars: 0 | 1 | 2 | 3 | undefined;
  let sagaBonusXp = 0;
  let nextSaga = saga;
  if (raw.sagaLevelId) {
    sagaStars = computeSagaStarsEarned(me?.deaths ?? 0, me?.score ?? 0, Boolean(raw.sagaWon));
    if (raw.sagaWon) {
      const levelId = raw.sagaLevelId;
      sagaBonusXp = SAGA_LEVELS.find((l) => l.id === levelId)?.rewardXp ?? 80;
      const prevStars = saga.starsByLevel[levelId] ?? 0;
      nextSaga = {
        ...saga,
        highestUnlockedLevel: Math.max(saga.highestUnlockedLevel, Math.min(SAGA_LEVELS.length, levelId + 1)),
        starsByLevel: { ...saga.starsByLevel, [levelId]: Math.max(prevStars, sagaStars ?? 1) as 1 | 2 | 3 },
      };
    }
  }

  const xpEarned = 25 + Math.round((me?.score ?? 0) * 0.5) + (won ? 40 : 10) + sagaBonusXp;
  const nextXp = progression.xp + xpEarned;
  const levelInfo = computeLevelFromXp(nextXp);
  const nextProg: PlayerProgression = {
    xp: nextXp,
    level: levelInfo.level,
    matchesPlayed: progression.matchesPlayed + 1,
    wins: progression.wins + (won ? 1 : 0),
    totalStomps: progression.totalStomps + (me?.stomps ?? 0),
    totalKills: progression.totalKills + (me?.kills ?? 0),
  };
  return {
    result: { ...raw, sagaStars, xpEarned, leveledUpTo: levelInfo.level > progression.level ? levelInfo.level : undefined },
    progression: nextProg,
    saga: nextSaga,
  };
}
