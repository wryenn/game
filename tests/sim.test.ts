import { describe, expect, test } from 'bun:test';
import { BotDirector } from '../src/ai/brain';
import { FixedStepper, SIM_DT, stepSimulation } from '../src/sim';
import { triggerHeroAbility } from '../src/sim/abilities';
import { GameEvent, SimulationState } from '../src/sim/types';
import { idle, sim, slots } from './helpers';

function runBots(s: SimulationState, ticks: number) {
  const director = new BotDirector(s.rngState);
  for (let i = 0; i < ticks && !s.finished; i++) stepSimulation(s, director.computeInputs(s, {}));
}

function overlapsSolid(s: SimulationState, x: number, y: number, w: number, h: number) {
  return s.platforms.some(
    (p) => !p.oneWay && p.crumbleState !== 'fallen' && x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y
  );
}

describe('deterministic simulation', () => {
  test('same seed + same inputs produce identical matches', () => {
    const allBots = slots(['pofi', 'tiknaz', 'karanlik', 'altin_hakan'], ['bot', 'bot', 'bot', 'bot']);
    const a = sim({ mapId: 'hazard', seed: 7 }, allBots);
    const b = sim({ mapId: 'hazard', seed: 7 }, allBots);
    runBots(a, 1800);
    runBots(b, 1800);
    expect(a.tick).toBe(b.tick);
    expect(a.players.map((p) => [p.x, p.y, p.lives, p.score])).toEqual(b.players.map((p) => [p.x, p.y, p.lives, p.score]));
  });

  test('different seeds diverge on hazard map', () => {
    const allBots = slots(['pofi', 'tiknaz', 'karanlik', 'altin_hakan'], ['bot', 'bot', 'bot', 'bot']);
    const a = sim({ mapId: 'hazard', seed: 1 }, allBots);
    const b = sim({ mapId: 'hazard', seed: 2 }, allBots);
    runBots(a, 1800);
    runBots(b, 1800);
    expect(a.players.map((p) => p.x)).not.toEqual(b.players.map((p) => p.x));
  });

  test('stepSimulation advances exactly one 60 Hz tick', () => {
    const s = sim();
    stepSimulation(s, {});
    expect(s.tick).toBe(1);
    expect(s.elapsedSec).toBeCloseTo(SIM_DT, 6);
  });

  test('FixedStepper yields 60 steps per second at any refresh rate', () => {
    for (const hz of [30, 60, 75, 144, 240]) {
      const st = new FixedStepper();
      let steps = 0;
      for (let i = 0; i < hz; i++) steps += st.advance(1 / hz);
      expect(Math.abs(steps - 60)).toBeLessThanOrEqual(1);
    }
  });

  test('jump height does not depend on frame rate', () => {
    const peak = (hz: number) => {
      const s = sim({}, slots(['pofi'], ['human']));
      const p = s.players[0];
      for (let i = 0; i < 90; i++) stepSimulation(s, { 0: idle });
      const st = new FixedStepper();
      const startY = p.y;
      let minY = p.y;
      let pressed = false;
      for (let f = 0; f < hz * 1.5; f++) {
        const n = st.advance(1 / hz);
        for (let k = 0; k < n; k++) {
          stepSimulation(s, { 0: { ...idle, upHeld: true, jumpPressed: !pressed } });
          pressed = true;
          minY = Math.min(minY, p.y);
        }
      }
      return startY - minY;
    };
    expect(peak(144)).toBeCloseTo(peak(60), 0);
  });

  test('countdown freezes players', () => {
    const s = sim({ countdownSec: 1 }, slots(['pofi'], ['human']));
    const x0 = s.players[0].x;
    for (let i = 0; i < 30; i++) stepSimulation(s, { 0: { ...idle, right: true } });
    expect(s.players[0].x).toBe(x0);
    for (let i = 0; i < 60; i++) stepSimulation(s, { 0: { ...idle, right: true } });
    expect(s.players[0].x).toBeGreaterThan(x0);
  });
});

describe('hero abilities', () => {
  test('gold quake dives and releases a shockwave on landing', () => {
    const s = sim({}, slots(['altin_hakan', 'pofi'], ['human', 'human']));
    const hakan = s.players[0];
    for (let i = 0; i < 60; i++) stepSimulation(s, {});
    hakan.y -= 160;
    hakan.grounded = false;
    hakan.vy = 0;
    triggerHeroAbility(hakan, s);
    expect(hakan.quakeDiving).toBe(true);
    const events: GameEvent[] = [];
    for (let i = 0; i < 120 && hakan.quakeDiving; i++) {
      stepSimulation(s, {});
      events.push(...s.pendingEvents);
    }
    expect(hakan.quakeDiving).toBe(false);
    expect(events.some((e) => e.type === 'quake_land')).toBe(true);
  });

  test('shadow warp never ends inside solid geometry', () => {
    for (const mapId of ['classic', 'towers', 'crumbling', 'hazard'] as const) {
      const s = sim({ mapId }, slots(['karanlik'], ['human']));
      const k = s.players[0];
      for (let x = 40; x < 1240; x += 60) {
        for (const facing of [1, -1] as const) {
          k.x = x;
          k.y = 200;
          k.facing = facing;
          if (overlapsSolid(s, k.x, k.y, k.w, k.h)) continue;
          triggerHeroAbility(k, s);
          expect(overlapsSolid(s, k.x, k.y, k.w, k.h)).toBe(false);
          expect(k.empoweredTimer).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('rules', () => {
  test('time mode ends when the clock runs out', () => {
    const s = sim({ mode: 'time', roundDurationSec: 2 }, slots(['pofi', 'tiknaz'], ['human', 'human']));
    for (let i = 0; i < 200; i++) stepSimulation(s, {});
    expect(s.finished).toBe(true);
  });

  test('chaos mode is endless', () => {
    const s = sim({ mode: 'chaos', roundDurationSec: 1 }, slots(['pofi', 'tiknaz'], ['human', 'human']));
    for (let i = 0; i < 300; i++) stepSimulation(s, {});
    expect(s.finished).toBe(false);
  });

  test('ffa: last survivor wins', () => {
    const s = sim({ lives: 1 }, slots(['pofi', 'tiknaz'], ['human', 'human']));
    s.players[1].y = 5000;
    for (let i = 0; i < 5; i++) stepSimulation(s, {});
    expect(s.finished).toBe(true);
    expect(s.winnerSlot).toBe(0);
  });
});
