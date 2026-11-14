import { CHARACTER_COLORS } from '../content/constants';
import { getHeroDef } from '../content/heroes';
import { areAllies } from './abilities';
import { ARENA_HEIGHT, ARENA_WIDTH, PHYSICS } from './constants';
import { usesLives } from './world';
import { CharacterEntity, SimulationState } from './types';

function creditHit(victim: CharacterEntity, attacker: CharacterEntity) {
  victim.lastHitBy = attacker.slotIndex;
  victim.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
}

export function applyHeadStomp(attacker: CharacterEntity, victim: CharacterEntity, sim: SimulationState) {
  const pushDir = attacker.x + attacker.w / 2 < victim.x + victim.w / 2 ? 1 : -1;

  if (victim.shieldTimer > 0) {
    attacker.y = victim.y - attacker.h - 4;
    attacker.vx = -pushDir * 390;
    attacker.vy = -480;
    attacker.stunTimer = Math.max(attacker.stunTimer, 0.42);
    attacker.quakeDiving = false;
    attacker.squashX = 0.72;
    attacker.squashY = 1.3;
    creditHit(attacker, victim);
    sim.trauma = Math.min(1, sim.trauma + 0.28);
    sim.pendingEvents.push({ type: 'shield_block', x: victim.x + victim.w / 2, y: victim.y, slotIndex: victim.slotIndex });
    return;
  }

  const empowered = attacker.empoweredTimer > 0 ? 1.5 : 1;
  const ratio =
    (getHeroDef(attacker.heroId).stats.stompPower * empowered) / getHeroDef(victim.heroId).stats.weightMult;

  attacker.y = victim.y - attacker.h - 2;
  attacker.vy = PHYSICS.STOMP_BOUNCE_VELOCITY;
  attacker.jumpsUsed = 0;
  attacker.empoweredTimer = 0;
  attacker.squashX = 0.68;
  attacker.squashY = 1.42;
  attacker.jiggleAmp = Math.max(attacker.jiggleAmp, 0.28);
  attacker.stomps += 1;
  attacker.score += PHYSICS.STOMP_POINTS;

  victim.stunTimer = PHYSICS.STOMP_STUN_DURATION * Math.min(1.3, Math.max(0.8, ratio));
  victim.pancakeTimer = PHYSICS.STOMP_PANCAKE_DURATION;
  victim.flashTimer = 0.09;
  victim.squashX = 1.95;
  victim.squashY = 0.32;
  victim.jiggleAmp = 0.45;
  victim.quakeDiving = false;
  victim.vx = pushDir * PHYSICS.STOMP_KNOCKBACK_X * ratio;
  victim.vy = Math.max(victim.vy, 120) + PHYSICS.STOMP_VICTIM_DOWN_IMPULSE * ratio;
  creditHit(victim, attacker);

  sim.hitstopTimer = 0.055;
  sim.trauma = Math.min(1, sim.trauma + 0.48);
  sim.pendingEvents.push({
    type: 'stomp',
    x: victim.x + victim.w / 2,
    y: victim.y + victim.h * 0.72,
    slotIndex: attacker.slotIndex,
    victimSlot: victim.slotIndex,
    color: CHARACTER_COLORS[victim.costume.colorId].primary,
    points: PHYSICS.STOMP_POINTS,
  });
}

function bump(a: CharacterEntity, b: CharacterEntity, sim: SimulationState, pushDir: number) {
  const aw = getHeroDef(a.heroId).stats.weightMult;
  const bw = getHeroDef(b.heroId).stats.weightMult;
  const base = Math.max(PHYSICS.BUMP_MIN_IMPULSE_X, Math.abs(a.vx - b.vx) * 0.85);
  const aBonus = a.shieldTimer > 0 ? 1.45 : 1;
  const bBonus = b.shieldTimer > 0 ? 1.45 : 1;
  a.vx = pushDir * ((base * bw * bBonus) / aw);
  b.vx = -pushDir * ((base * aw * aBonus) / bw);
  a.vy = Math.min(a.vy, PHYSICS.BUMP_IMPULSE_Y * 0.6);
  b.vy = Math.min(b.vy, PHYSICS.BUMP_IMPULSE_Y * 0.6);
  for (const c of [a, b]) {
    c.squashX = 0.72;
    c.squashY = 1.28;
    c.jiggleAmp = Math.max(c.jiggleAmp, 0.24);
  }
  creditHit(a, b);
  creditHit(b, a);
  sim.pendingEvents.push({
    type: 'bump',
    x: (a.x + b.x + a.w) / 2,
    y: (a.y + b.y + a.h) / 2,
  });
}

export function resolveCharacterCollisions(sim: SimulationState) {
  const players = sim.players;
  for (let i = 0; i < players.length; i++) {
    const a = players[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < players.length; j++) {
      const b = players[j];
      if (!b.alive) continue;
      if (a.x >= b.x + b.w || a.x + a.w <= b.x || a.y >= b.y + b.h || a.y + a.h <= b.y) continue;

      const allies = areAllies(sim, a, b);
      const aAboveB = a.y + a.h <= b.y + b.h * 0.56 && a.vy > 30;
      const bAboveA = b.y + b.h <= a.y + a.h * 0.56 && b.vy > 30;
      if (!allies && aAboveB && b.invulnTimer <= 0) {
        applyHeadStomp(a, b, sim);
        continue;
      }
      if (!allies && bAboveA && a.invulnTimer <= 0) {
        applyHeadStomp(b, a, sim);
        continue;
      }

      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (overlapX < overlapY) {
        const pushDir = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
        const half = overlapX / 2 + 0.5;
        a.x += pushDir * half;
        b.x -= pushDir * half;
        if (allies) {
          const avg = (a.vx + b.vx) / 2;
          a.vx = avg + pushDir * 60;
          b.vx = avg - pushDir * 60;
        } else if (a.invulnTimer <= 0 || b.invulnTimer <= 0) {
          bump(a, b, sim, pushDir);
        }
      } else {
        const upper = a.y + a.h / 2 < b.y + b.h / 2 ? a : b;
        const lower = upper === a ? b : a;
        const half = overlapY / 2 + 0.5;
        upper.y -= half;
        lower.y += half;
        upper.vy = Math.min(upper.vy, -260);
        upper.jumpsUsed = Math.min(upper.jumpsUsed, 1);
      }
    }
  }
}

export function eliminateCharacter(char: CharacterEntity, sim: SimulationState) {
  char.alive = false;
  char.quakeDiving = false;
  char.deaths += 1;
  sim.trauma = Math.min(1, sim.trauma + 0.5);

  let killerSlot: number | undefined;
  if (char.lastHitBy !== null && char.lastHitBy !== char.slotIndex) {
    const killer = sim.players.find((p) => p.slotIndex === char.lastHitBy);
    if (killer) {
      killer.kills += 1;
      killer.score += PHYSICS.KO_POINTS;
      killerSlot = killer.slotIndex;
    }
  }

  sim.pendingEvents.push({
    type: 'ko',
    x: Math.max(40, Math.min(ARENA_WIDTH - 40, char.x + char.w / 2)),
    y: Math.min(ARENA_HEIGHT - 20, char.y),
    slotIndex: char.slotIndex,
    victimSlot: killerSlot,
    color: CHARACTER_COLORS[char.costume.colorId].primary,
    points: killerSlot !== undefined ? PHYSICS.KO_POINTS : undefined,
  });

  if (usesLives(sim.mode)) {
    char.lives -= 1;
    if (char.lives <= 0) {
      char.eliminated = true;
      return;
    }
  }
  char.respawnTimer = PHYSICS.RESPAWN_DELAY;
}
