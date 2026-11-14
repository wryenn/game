import { randomRange } from './rng';
import { HazardPhase, SimulationState } from './types';

const HAZARD_SEQUENCE: HazardPhase[] = ['calm', 'wind_left', 'slippery', 'wind_right', 'cannon'];

export function updatePlatforms(sim: SimulationState, dt: number) {
  for (const plat of sim.platforms) {
    const prevX = plat.x;
    const prevY = plat.y;
    if (plat.type === 'moving' && plat.moveRange && plat.moveSpeed) {
      const offset = Math.sin((plat.movePhase ?? 0) + sim.elapsedSec * plat.moveSpeed) * plat.moveRange;
      if (plat.moveAxis === 'x') plat.x = plat.baseX + offset;
      else if (plat.moveAxis === 'y') plat.y = plat.baseY + offset;
    }
    plat.vx = (plat.x - prevX) / dt;
    plat.vy = (plat.y - prevY) / dt;

    if (plat.type === 'crumbling') {
      if (plat.crumbleState === 'shaking') {
        plat.crumbleTimer -= dt;
        if (plat.crumbleTimer <= 0) {
          plat.crumbleState = 'fallen';
          plat.crumbleTimer = 3.2;
          sim.pendingEvents.push({ type: 'crumble', x: plat.x + plat.w / 2, y: plat.y + plat.h / 2 });
        }
      } else if (plat.crumbleState === 'fallen') {
        plat.crumbleTimer -= dt;
        if (plat.crumbleTimer <= 0) {
          plat.crumbleState = 'solid';
          plat.crumbleTimer = 0;
        }
      }
    }
  }
}

export function mapHasHazards(mapId: SimulationState['mapId']): boolean {
  return (
    mapId === 'hazard' ||
    mapId === 'story_crimson' ||
    mapId === 'story_golden' ||
    mapId === 'story_frost' ||
    mapId === 'story_shadow'
  );
}

function nextPhase(sim: SimulationState): { phase: HazardPhase; duration: number } {
  const cur = sim.hazardPhase;
  switch (sim.mapId) {
    case 'hazard': {
      const phase = HAZARD_SEQUENCE[(HAZARD_SEQUENCE.indexOf(cur) + 1) % HAZARD_SEQUENCE.length];
      return { phase, duration: phase === 'calm' ? 5.5 : 9.0 };
    }
    case 'story_crimson':
    case 'story_golden': {
      const phase: HazardPhase = cur === 'cannon' ? 'calm' : 'cannon';
      return { phase, duration: phase === 'cannon' ? 8.0 : 5.0 };
    }
    case 'story_frost': {
      const phase: HazardPhase = cur === 'slippery' ? 'wind_left' : 'slippery';
      return { phase, duration: phase === 'slippery' ? 9.0 : 6.0 };
    }
    default: {
      const phase: HazardPhase = cur === 'wind_left' ? 'wind_right' : cur === 'wind_right' ? 'calm' : 'wind_left';
      return { phase, duration: 7.0 };
    }
  }
}

export function spawnCannonStrike(sim: SimulationState) {
  // Aim at a random living player (with spread) so strikes are a real threat everywhere.
  const living = sim.players.filter((p) => p.alive);
  const target = living.length > 0 ? living[Math.floor(randomRange(sim, 0, living.length))] : null;
  const baseX = target ? target.x + target.w / 2 : randomRange(sim, 300, 980);
  sim.cannons.push({
    id: sim.nextCannonId++,
    x: Math.max(120, Math.min(1160, baseX + randomRange(sim, -90, 90))),
    y: target ? target.y + target.h : 545,
    radius: 72,
    telegraphTimer: 1.0,
    blastTimer: 0,
    exploded: false,
  });
}

export function updateHazards(sim: SimulationState, dt: number) {
  if (!mapHasHazards(sim.mapId)) {
    sim.windForce = 0;
    sim.frictionFactor = 1;
    return;
  }

  sim.hazardTimer -= dt;
  if (sim.hazardTimer <= 0) {
    const { phase, duration } = nextPhase(sim);
    sim.hazardPhase = phase;
    sim.hazardTimer = duration;
    if (phase === 'cannon') spawnCannonStrike(sim);
  }

  const isFrost = sim.mapId === 'story_frost';
  sim.windForce = sim.hazardPhase === 'wind_left' ? -175 : sim.hazardPhase === 'wind_right' ? 175 : 0;
  sim.frictionFactor =
    sim.hazardPhase === 'slippery' ? 0.22 : sim.hazardPhase === 'wind_left' && isFrost ? 0.45 : 1;

  if (sim.hazardPhase === 'cannon') {
    // One new strike every ~2.4s while the cannon phase lasts.
    const period = Math.round(2.4 / dt);
    if (sim.cannons.length < 2 && sim.tick % period === 0) spawnCannonStrike(sim);
  }

  for (let i = sim.cannons.length - 1; i >= 0; i--) {
    const c = sim.cannons[i];
    if (!c.exploded) {
      c.telegraphTimer -= dt;
      if (c.telegraphTimer > 0) continue;
      c.exploded = true;
      c.blastTimer = 0.35;
      sim.trauma = Math.min(1, sim.trauma + 0.45);
      sim.pendingEvents.push({ type: 'cannon', x: c.x, y: c.y });
      for (const p of sim.players) {
        if (!p.alive || p.invulnTimer > 0) continue;
        const dx = p.x + p.w / 2 - c.x;
        const dy = p.y + p.h / 2 - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < c.radius + 26) {
          const nx = dist > 1 ? dx / dist : p.slotIndex % 2 === 0 ? -1 : 1;
          p.vx += nx * 460;
          p.vy = -540;
          p.grounded = false;
          p.stunTimer = Math.max(p.stunTimer, 0.45);
          p.flashTimer = 0.08;
        }
      }
    } else {
      c.blastTimer -= dt;
      if (c.blastTimer <= 0) sim.cannons.splice(i, 1);
    }
  }
}
