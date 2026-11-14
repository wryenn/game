import { CHARACTER_COLORS } from '../content/constants';
import { getHeroDef } from '../content/heroes';
import { ARENA_WIDTH, PHYSICS } from './constants';
import { isTeamBased } from './world';
import { CharacterEntity, SimulationState } from './types';

export function areAllies(sim: SimulationState, a: CharacterEntity, b: CharacterEntity): boolean {
  return isTeamBased(sim.mode) && a.team === b.team;
}

function radialBlast(
  char: CharacterEntity,
  sim: SimulationState,
  radius: number,
  impulseX: number,
  impulseY: number,
  stun: number
) {
  const cx = char.x + char.w / 2;
  const cy = char.y + char.h / 2;
  for (const other of sim.players) {
    if (other === char || !other.alive || other.invulnTimer > 0 || areAllies(sim, char, other)) continue;
    const dx = other.x + other.w / 2 - cx;
    const dy = other.y + other.h / 2 - cy;
    const dist = Math.hypot(dx, dy);
    if (dist >= radius) continue;
    const w = getHeroDef(other.heroId).stats.weightMult;
    const falloff = 0.65 + 0.35 * (1 - dist / radius);
    const nx = dist > 1 ? dx / dist : char.facing;
    other.vx += (nx * impulseX * falloff) / w;
    other.vy = (impulseY * falloff) / w;
    other.grounded = false;
    if (stun > 0) other.stunTimer = Math.max(other.stunTimer, stun);
    other.lastHitBy = char.slotIndex;
    other.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
  }
}

/** Releases the gold quake shockwave; called when a quake dive lands (or instantly on ground). */
export function releaseQuake(char: CharacterEntity, sim: SimulationState) {
  char.quakeDiving = false;
  sim.trauma = Math.min(1, sim.trauma + 0.55);
  radialBlast(char, sim, 210, 540, -470, 0.45);
  sim.pendingEvents.push({
    type: 'quake_land',
    x: char.x + char.w / 2,
    y: char.y + char.h,
    slotIndex: char.slotIndex,
    color: CHARACTER_COLORS[char.costume.colorId].primary,
  });
}

/** Shadow warp: blink forward, but never into a solid wall. */
function shadowWarp(char: CharacterEntity, sim: SimulationState) {
  const distance = 165;
  const step = 5;
  let x = char.x;
  for (let travelled = 0; travelled < distance; travelled += step) {
    const nx = x + char.facing * step;
    if (nx < 30 || nx + char.w > ARENA_WIDTH - 30) break;
    const blocked = sim.platforms.some(
      (p) =>
        !p.oneWay &&
        p.crumbleState !== 'fallen' &&
        nx < p.x + p.w &&
        nx + char.w > p.x &&
        char.y + 4 < p.y + p.h &&
        char.y + char.h - 4 > p.y
    );
    if (blocked) break;
    x = nx;
  }
  char.x = x;
  char.vy = Math.min(char.vy, -240);
  char.invulnTimer = Math.max(char.invulnTimer, 0.25);
  char.empoweredTimer = 1.0;
  char.squashX = 0.72;
  char.squashY = 1.3;
}

export function triggerHeroAbility(char: CharacterEntity, sim: SimulationState) {
  const hero = getHeroDef(char.heroId);
  char.abilityCooldown = hero.abilityCooldown;
  const cx = char.x + char.w / 2;
  const cy = char.y + char.h / 2;

  switch (hero.abilityKind) {
    case 'high_spring':
      char.vy = -800 * hero.stats.jumpMult;
      char.grounded = false;
      char.jumpsUsed = Math.min(char.maxJumps - 1, 1);
      char.squashX = 0.66;
      char.squashY = 1.44;
      char.jiggleAmp = 0.3;
      radialBlast(char, sim, 135, 330, -360, 0.2);
      break;

    case 'belly_dash':
      char.vx = char.facing * 760;
      char.vy = Math.min(char.vy, -130);
      char.shieldTimer = Math.max(char.shieldTimer, 0.45);
      char.squashX = 1.38;
      char.squashY = 0.72;
      char.jiggleAmp = 0.32;
      break;

    case 'wind_blink':
      char.vx = char.facing * 680;
      char.vy = -230;
      char.jumpsUsed = Math.max(0, char.jumpsUsed - 1);
      char.squashX = 1.34;
      char.squashY = 0.74;
      char.jiggleAmp = 0.25;
      // Gust pushes anyone right in front of Zeynep.
      for (const other of sim.players) {
        if (other === char || !other.alive || other.invulnTimer > 0 || areAllies(sim, char, other)) continue;
        const dx = other.x + other.w / 2 - cx;
        const dy = other.y + other.h / 2 - cy;
        if (Math.sign(dx) === char.facing && Math.abs(dx) < 150 && Math.abs(dy) < 60) {
          other.vx += (char.facing * 540) / getHeroDef(other.heroId).stats.weightMult;
          other.vy = Math.min(other.vy, -200);
          other.lastHitBy = char.slotIndex;
          other.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
        }
      }
      break;

    case 'flame_burst':
      char.squashX = 1.35;
      char.squashY = 1.35;
      char.jiggleAmp = 0.35;
      sim.trauma = Math.min(1, sim.trauma + 0.32);
      radialBlast(char, sim, 185, 520, -440, 0.38);
      break;

    case 'frost_shield':
      char.shieldTimer = 1.5;
      char.squashX = 1.18;
      char.squashY = 1.18;
      char.jiggleAmp = 0.22;
      break;

    case 'sky_hook': {
      const centerPull = ARENA_WIDTH / 2 - cx;
      char.vx = Math.sign(centerPull) * Math.min(380, Math.abs(centerPull) * 0.9);
      char.vy = -785;
      char.grounded = false;
      char.jumpsUsed = 0;
      char.squashX = 0.7;
      char.squashY = 1.38;
      char.jiggleAmp = 0.26;
      break;
    }

    case 'shadow_warp':
      shadowWarp(char, sim);
      break;

    case 'gold_quake':
      char.shieldTimer = Math.max(char.shieldTimer, 0.5);
      if (char.grounded) {
        releaseQuake(char, sim);
        char.vy = -220;
        char.grounded = false;
      } else {
        char.quakeDiving = true;
        char.vy = 900;
        char.vx *= 0.3;
      }
      break;
  }

  sim.pendingEvents.push({
    type: 'ability',
    x: cx,
    y: cy,
    slotIndex: char.slotIndex,
    color: CHARACTER_COLORS[char.costume.colorId].primary,
  });
}
