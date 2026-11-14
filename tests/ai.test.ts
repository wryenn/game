import { describe, expect, test } from 'bun:test';
import { runBalance } from '../tools/balance';

describe('AI regression', () => {
  test('bots fight and rarely fall off on their own', () => {
    const r = runBalance({ matches: 16, difficulty: 'hard', personality: 'mixed', maps: ['classic', 'towers', 'crumbling', 'hazard'], maxSeconds: 90 });
    const heroes = Object.values(r.heroes);
    const deaths = heroes.reduce((a, h) => a + h.deaths, 0);
    const selfKos = heroes.reduce((a, h) => a + h.selfKos, 0);
    const kos = heroes.reduce((a, h) => a + h.kos, 0);
    expect(kos).toBeGreaterThan(20);
    expect(selfKos / Math.max(1, deaths)).toBeLessThan(0.2);
  }, 60000);
});
