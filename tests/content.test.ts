import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/content/heroes';
import { SAGA_LEVELS } from '../src/content/saga';
import { STORY_CHAPTERS } from '../src/content/story';
import { applyRoundRewards, buildSagaSlots, buildStorySlots } from '../src/state/progress';
import { createInitialProgression } from '../src/content/heroes';
import { loadSagaProgress } from '../src/content/saga';
import { DEFAULT_SLOTS } from '../src/content/constants';

describe('story & saga slots', () => {
  test('every story rival fights with its own hero kit', () => {
    const heroIds = new Set<string>();
    for (const ch of STORY_CHAPTERS) {
      const s = buildStorySlots(ch);
      expect(s).toHaveLength(4);
      ch.rivals.slice(0, 3).forEach((r) => {
        const slot = s.find((x) => x.name === r.name)!;
        expect(slot.heroId).toBe(r.heroId!);
        heroIds.add(slot.heroId!);
      });
    }
    expect(heroIds.size).toBeGreaterThan(3);
    const finale = buildStorySlots(STORY_CHAPTERS[STORY_CHAPTERS.length - 1]);
    expect(finale.some((s) => s.heroId === 'altin_hakan')).toBe(true);
  });

  test('saga slots keep the chosen hero for the player', () => {
    const s = buildSagaSlots(SAGA_LEVELS[0], { ...DEFAULT_SLOTS[0], heroId: 'zeynep' });
    expect(s[0].heroId).toBe('zeynep');
    expect(s[0].kind).toBe('human');
  });

  test('all heroes have valid stats', () => {
    for (const h of HEROES) {
      expect(h.stats.maxJumps).toBeGreaterThanOrEqual(2);
      expect(h.abilityCooldown).toBeGreaterThan(1);
    }
  });
});

describe('rewards', () => {
  test('winning earns more XP than losing', () => {
    const base = { mode: 'ffa' as const, mapId: 'classic' as const, durationSec: 60, winnerTeam: null, winReason: '', standings: [] };
    const prog = createInitialProgression();
    const saga = loadSagaProgress();
    const win = applyRoundRewards({ ...base, winnerSlot: 0 }, prog, saga);
    const lose = applyRoundRewards({ ...base, winnerSlot: 1 }, prog, saga);
    expect(win.result.xpEarned!).toBeGreaterThan(lose.result.xpEarned!);
    expect(win.progression.wins).toBe(1);
  });
});
