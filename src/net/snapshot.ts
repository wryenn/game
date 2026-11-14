import { CharacterEntity, SimulationState } from '../sim/types';
import { NetPlayerState, NetSnapshot } from './protocol';

const r1 = (v: number) => Math.round(v * 10) / 10;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

const CRUMBLE = ['solid', 'shaking', 'fallen'] as const;

export function serializePlayer(p: CharacterEntity): NetPlayerState {
  return {
    slotIndex: p.slotIndex,
    x: r1(p.x),
    y: r1(p.y),
    vx: r1(p.vx),
    vy: r1(p.vy),
    facing: p.facing,
    grounded: p.grounded,
    alive: p.alive,
    eliminated: p.eliminated,
    lives: p.lives,
    score: p.score,
    kills: p.kills,
    deaths: p.deaths,
    stomps: p.stomps,
    jumpsMade: p.jumpsMade,
    stunTimer: r3(p.stunTimer),
    pancakeTimer: r3(p.pancakeTimer),
    invulnTimer: r3(p.invulnTimer),
    shieldTimer: r3(p.shieldTimer),
    abilityCooldown: r3(p.abilityCooldown),
    respawnTimer: r3(p.respawnTimer),
    squashX: r3(p.squashX),
    squashY: r3(p.squashY),
    airTilt: r3(p.airTilt),
    walkCycle: r3(p.walkCycle),
    tasselAngle: r3(p.tasselAngle),
    jiggleAmp: r3(p.jiggleAmp),
    jigglePhase: r3(p.jigglePhase),
    blinkTimer: r3(p.blinkTimer),
    flashTimer: r3(p.flashTimer),
    quakeDiving: p.quakeDiving,
    empoweredTimer: r3(p.empoweredTimer),
  };
}

export function serializeSnapshot(sim: SimulationState, ack: number): NetSnapshot {
  return {
    tick: sim.tick,
    ack,
    elapsedSec: r3(sim.elapsedSec),
    timeRemainingSec: r3(sim.timeRemainingSec),
    countdownSec: r3(sim.countdownSec),
    hazardPhase: sim.hazardPhase,
    windForce: sim.windForce,
    frictionFactor: sim.frictionFactor,
    trauma: r3(sim.trauma),
    cannons: sim.cannons.map((c) => ({ ...c })),
    platforms: sim.platforms.map((p) => ({ id: p.id, x: r1(p.x), y: r1(p.y), c: CRUMBLE.indexOf(p.crumbleState) as 0 | 1 | 2 })),
    players: sim.players.map(serializePlayer),
    events: [...sim.pendingEvents],
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Applies snapshot `b` onto the client sim, interpolating continuous values from `a` by `t` (0..1).
 * Discrete state always comes from `b`. Teleports (respawn) are not interpolated.
 */
export function applySnapshot(sim: SimulationState, a: NetSnapshot | null, b: NetSnapshot, t: number) {
  sim.tick = b.tick;
  sim.elapsedSec = b.elapsedSec;
  sim.timeRemainingSec = b.timeRemainingSec;
  sim.countdownSec = b.countdownSec;
  sim.hazardPhase = b.hazardPhase;
  sim.windForce = b.windForce;
  sim.frictionFactor = b.frictionFactor;
  sim.trauma = Math.max(sim.trauma, b.trauma);
  sim.cannons = b.cannons;

  for (const ps of b.players) {
    const p = sim.players.find((x) => x.slotIndex === ps.slotIndex);
    if (!p) continue;
    const prev = a?.players.find((x) => x.slotIndex === ps.slotIndex);
    const { slotIndex: _s, ...rest } = ps;
    Object.assign(p, rest);
    if (prev && prev.alive === ps.alive && Math.hypot(prev.x - ps.x, prev.y - ps.y) < 160) {
      p.x = lerp(prev.x, ps.x, t);
      p.y = lerp(prev.y, ps.y, t);
    }
  }

  for (const pl of b.platforms) {
    const plat = sim.platforms.find((x) => x.id === pl.id);
    if (!plat) continue;
    const prev = a?.platforms.find((x) => x.id === pl.id);
    plat.x = prev ? lerp(prev.x, pl.x, t) : pl.x;
    plat.y = prev ? lerp(prev.y, pl.y, t) : pl.y;
    plat.crumbleState = CRUMBLE[pl.c];
  }
}
