import { ACHIEVEMENTS } from '../content/constants';
import {
  AchievementDef,
  AchievementId,
  AchievementState,
  RoundResult,
  SimulationState,
} from '../sim/types';

const ACH_STORAGE_KEY = 'kale_kapmaca_achievements_v1';

export function loadAchievements(): AchievementState {
  try {
    const raw = localStorage.getItem(ACH_STORAGE_KEY);
    if (!raw) return { unlockedIds: [], unlockedAt: {} };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.unlockedIds)) {
      return { unlockedIds: [], unlockedAt: {} };
    }
    return {
      unlockedIds: parsed.unlockedIds,
      unlockedAt: parsed.unlockedAt ?? {},
    };
  } catch {
    return { unlockedIds: [], unlockedAt: {} };
  }
}

export function saveAchievements(state: AchievementState) {
  try {
    localStorage.setItem(ACH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function getAchievementDef(id: AchievementId): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Evaluates live mid-match achievements for active human players (or slot 0 in online guest).
 */
export function evaluateLiveAchievements(
  sim: SimulationState,
  alreadyUnlocked: Set<AchievementId>,
  isOnlineMatch = false
): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];
  const checkTargets = sim.players.filter((p) => !p.isBot);
  const targets = checkTargets.length > 0 ? checkTargets : [sim.players[0]].filter(Boolean);

  const unlock = (id: AchievementId) => {
    if (!alreadyUnlocked.has(id) && !newlyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
    }
  };

  if (isOnlineMatch && sim.elapsedSec > 1) {
    unlock('cevrimici_dost');
  }

  for (const p of targets) {
    if (p.kills >= 1) unlock('ilk_eleme');
    if (p.jumpsMade >= 5) unlock('bes_zipla');
    if (p.stomps >= 3) unlock('kafa_avcisi');
    if (p.score >= 100) unlock('yuz_puan');
  }

  return newlyUnlocked;
}

/**
 * Evaluates end-of-round achievements (including 'Sıfır Hata' when winning with 0 deaths).
 */
export function evaluateRoundEndAchievements(
  result: RoundResult,
  alreadyUnlocked: Set<AchievementId>,
  isOnlineMatch = false
): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];
  const unlock = (id: AchievementId) => {
    if (!alreadyUnlocked.has(id) && !newlyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
    }
  };

  if (isOnlineMatch) {
    unlock('cevrimici_dost');
  }

  if (result.storyWon) {
    unlock('hikaye_kasifi');
  }

  const winner =
    result.standings.find((p) => p.slotIndex === result.winnerSlot) ??
    result.standings[0];

  if (winner && !winner.isBot && winner.deaths === 0) {
    unlock('sifir_hata');
  }

  for (const p of result.standings) {
    if (p.isBot) continue;
    if (p.kills >= 1) unlock('ilk_eleme');
    if (p.jumpsMade >= 5) unlock('bes_zipla');
    if (p.stomps >= 3) unlock('kafa_avcisi');
    if (p.score >= 100) unlock('yuz_puan');
  }

  return newlyUnlocked;
}
