import { getHeroDef } from '../content/heroes';
import { KILL_PLANE, PHYSICS } from '../sim/constants';
import { CharacterEntity, PlatformState, SimulationState } from '../sim/types';

export function isStandable(p: PlatformState): boolean {
  return p.crumbleState !== 'fallen';
}

export function isSafe(p: PlatformState): boolean {
  return p.crumbleState === 'solid';
}

export function centerX(c: { x: number; w: number }): number {
  return c.x + c.w / 2;
}

/** Platform the character is currently standing on, if any. */
export function currentPlatform(bot: CharacterEntity, sim: SimulationState): PlatformState | null {
  if (!bot.grounded) return null;
  const feet = bot.y + bot.h;
  for (const p of sim.platforms) {
    if (!isStandable(p)) continue;
    if (bot.x + 4 >= p.x + p.w || bot.x + bot.w - 4 <= p.x) continue;
    if (Math.abs(p.y - feet) <= 6) return p;
  }
  return null;
}

/** Highest standable platform under point (x, y) within `maxDrop` pixels. */
export function platformBelow(sim: SimulationState, x: number, y: number, maxDrop = 2000): PlatformState | null {
  let best: PlatformState | null = null;
  for (const p of sim.platforms) {
    if (!isStandable(p)) continue;
    if (x < p.x + 6 || x > p.x + p.w - 6) continue;
    if (p.y < y - 2 || p.y - y > maxDrop) continue;
    if (!best || p.y < best.y) best = p;
  }
  return best;
}

export interface LandingPrediction {
  plat: PlatformState;
  x: number;
  time: number;
}

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

/**
 * Ballistic forward model of the character holding `dir` in the air.
 * Returns where (and if) it would land, or null when the trajectory ends in the abyss.
 */
export function predictLanding(
  bot: CharacterEntity,
  sim: SimulationState,
  dir: -1 | 0 | 1,
  opts: { vx?: number; vy?: number; x?: number; y?: number; horizon?: number; fastFall?: boolean } = {}
): LandingPrediction | null {
  const hero = getHeroDef(bot.heroId);
  const dt = 1 / 30;
  let x = opts.x ?? bot.x;
  let y = opts.y ?? bot.y;
  let vx = opts.vx ?? bot.vx;
  let vy = opts.vy ?? bot.vy;
  const horizon = opts.horizon ?? 2.2;
  const speed = PHYSICS.MOVE_SPEED * hero.stats.speedMult;
  for (let t = 0; t < horizon; t += dt) {
    vx = moveTowards(vx, dir * speed, PHYSICS.AIR_ACCEL * dt);
    vx += (sim.windForce * 1.1 * dt) / hero.stats.weightMult;
    vy = opts.fastFall
      ? Math.min(PHYSICS.FAST_FALL_MAX, vy + PHYSICS.FAST_FALL_ACCEL * dt)
      : Math.min(PHYSICS.MAX_FALL_SPEED, vy + PHYSICS.GRAVITY * dt);
    const prevBottom = y + bot.h;
    x += vx * dt;
    y += vy * dt;
    if (vy >= 0) {
      for (const p of sim.platforms) {
        if (!isStandable(p)) continue;
        if (x + 6 >= p.x + p.w || x + bot.w - 6 <= p.x) continue;
        const tolerance = p.type === 'moving' ? 24 : 12;
        if (prevBottom <= p.y + tolerance && y + bot.h >= p.y) {
          return { plat: p, x: x + bot.w / 2, time: t };
        }
      }
    }
    if (y > KILL_PLANE.bottom - 40 || x + bot.w < KILL_PLANE.left + 30 || x > KILL_PLANE.right - 30) return null;
  }
  const below = platformBelow(sim, x + bot.w / 2, y + bot.h);
  return below ? { plat: below, x: x + bot.w / 2, time: horizon } : null;
}

/** Nearest safe platform to the given point. */
export function nearestSafePlatform(sim: SimulationState, x: number, y: number, exclude?: PlatformState | null) {
  let best: PlatformState | null = null;
  let bestCost = Infinity;
  for (const p of sim.platforms) {
    if (!isSafe(p) || p === exclude) continue;
    const px = Math.max(p.x + 20, Math.min(p.x + p.w - 20, x));
    const cost =
      Math.abs(px - x) + Math.max(0, y - p.y) * 0.6 + Math.max(0, p.y - y) * 0.25 - Math.min(p.w, 400) * 0.1;
    if (cost < bestCost) {
      bestCost = cost;
      best = p;
    }
  }
  return best;
}

/** The widest, most central safe platform — the "home" a cautious bot retreats to. */
export function homePlatform(sim: SimulationState): PlatformState | null {
  let best: PlatformState | null = null;
  let bestScore = -Infinity;
  for (const p of sim.platforms) {
    if (!isSafe(p) || p.type === 'moving') continue;
    const score = Math.min(p.w, 700) - Math.abs(p.x + p.w / 2 - 640) * 0.6;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

/** Distance from the character to each edge of its platform that drops into the abyss (Infinity if covered). */
export function distanceToDeadlyEdge(bot: CharacterEntity, sim: SimulationState, plat: PlatformState) {
  const cx = centerX(bot);
  const left = platformBelow(sim, plat.x - 20, plat.y + 4) ? Infinity : cx - plat.x;
  const right = platformBelow(sim, plat.x + plat.w + 20, plat.y + 4) ? Infinity : plat.x + plat.w - cx;
  return { left, right };
}
