import { getHeroDef } from '../content/heroes';
import { releaseQuake, triggerHeroAbility } from './abilities';
import { eliminateCharacter } from './combat';
import { KILL_PLANE, PHYSICS } from './constants';
import { respawnCharacter } from './world';
import { CharacterEntity, PlatformState, PlayerInputState, SimulationState } from './types';

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

function decayTimers(char: CharacterEntity, dt: number) {
  char.stunTimer = Math.max(0, char.stunTimer - dt);
  char.pancakeTimer = Math.max(0, char.pancakeTimer - dt);
  char.invulnTimer = Math.max(0, char.invulnTimer - dt);
  char.shieldTimer = Math.max(0, char.shieldTimer - dt);
  char.abilityCooldown = Math.max(0, char.abilityCooldown - dt);
  char.flashTimer = Math.max(0, char.flashTimer - dt);
  char.empoweredTimer = Math.max(0, char.empoweredTimer - dt);
  if (char.lastHitTimer > 0) {
    char.lastHitTimer = Math.max(0, char.lastHitTimer - dt);
    if (char.lastHitTimer === 0) char.lastHitBy = null;
  }
}

/** Purely cosmetic springs (squash, jiggle, tassel, tilt). Deterministic but never affects gameplay. */
function updateCosmetics(char: CharacterEntity, dt: number) {
  if (char.pancakeTimer > 0.36) {
    const hold = Math.min(1, dt * 16);
    char.squashX += (1.92 - char.squashX) * hold;
    char.squashY += (0.34 - char.squashY) * hold;
  } else {
    const r = Math.min(1, dt * (char.pancakeTimer > 0 ? 7.5 : 12.5));
    char.squashX += (1 - char.squashX) * r;
    char.squashY += (1 - char.squashY) * r;
  }
  char.jigglePhase += dt * 21;
  char.jiggleAmp = Math.max(0, char.jiggleAmp - dt * 0.42);
  char.blinkTimer -= dt;
  if (char.blinkTimer < -0.11) char.blinkTimer = 2.2 + ((char.slotIndex * 0.53) % 1.4);

  if (char.stunTimer > 0 && !char.grounded) {
    char.airTilt += char.facing * dt * 8.5;
  } else {
    const target = char.grounded ? 0 : Math.max(-0.32, Math.min(0.32, char.vx * 0.0007));
    char.airTilt += (target - char.airTilt) * Math.min(1, dt * 10);
  }
  const accel = (-char.vx * 0.0022 - char.tasselAngle) * 65 - char.tasselVel * 8;
  char.tasselVel += accel * dt;
  char.tasselAngle += char.tasselVel * dt;
  if (char.grounded && Math.abs(char.vx) > 25) char.walkCycle += Math.abs(char.vx) * dt * 0.085;
}

function tryJump(char: CharacterEntity, sim: SimulationState) {
  const hero = getHeroDef(char.heroId);
  if (char.jumpBufferTimer <= 0 || char.stunTimer > 0) return;
  const cx = char.x + char.w / 2;
  if (char.coyoteTimer > 0) {
    char.vy = PHYSICS.JUMP_VELOCITY * hero.stats.jumpMult;
    char.grounded = false;
    char.coyoteTimer = 0;
    char.jumpsUsed = 1;
    char.squashX = 0.74;
    char.squashY = 1.32;
    char.jiggleAmp = Math.max(char.jiggleAmp, 0.14);
    sim.pendingEvents.push({ type: 'jump', x: cx, y: char.y + char.h, slotIndex: char.slotIndex });
  } else if (char.jumpsUsed < char.maxJumps) {
    char.vy = PHYSICS.DOUBLE_JUMP_VELOCITY * hero.stats.jumpMult;
    char.jumpsUsed += 1;
    char.squashX = 0.75;
    char.squashY = 1.28;
    char.jiggleAmp = Math.max(char.jiggleAmp, 0.16);
    sim.pendingEvents.push({ type: 'double_jump', x: cx, y: char.y + char.h, slotIndex: char.slotIndex });
  } else {
    return;
  }
  char.jumpBufferTimer = 0;
  char.jumpsMade += 1;
}

function solidBlocks(plat: PlatformState): boolean {
  return !plat.oneWay && plat.crumbleState !== 'fallen';
}

function moveHorizontal(char: CharacterEntity, sim: SimulationState, dt: number) {
  const prevX = char.x;
  char.x += char.vx * dt;
  for (const plat of sim.platforms) {
    if (!solidBlocks(plat)) continue;
    const overlaps =
      char.x < plat.x + plat.w &&
      char.x + char.w > plat.x &&
      char.y + 4 < plat.y + plat.h &&
      char.y + char.h - 4 > plat.y;
    if (!overlaps) continue;
    if (prevX + char.w <= plat.x + 6) {
      char.x = plat.x - char.w;
      char.vx = -Math.abs(char.vx) * PHYSICS.WALL_BOUNCE_RESTITUTION;
    } else if (prevX >= plat.x + plat.w - 6) {
      char.x = plat.x + plat.w;
      char.vx = Math.abs(char.vx) * PHYSICS.WALL_BOUNCE_RESTITUTION;
    }
  }
}

function moveVertical(char: CharacterEntity, input: PlayerInputState, sim: SimulationState, dt: number) {
  const prevY = char.y;
  const prevBottom = prevY + char.h;
  const wasGrounded = char.grounded;
  const impactVy = char.vy;
  let landed: PlatformState | null = null;
  char.grounded = false;
  char.y += char.vy * dt;

  for (const plat of sim.platforms) {
    if (plat.crumbleState === 'fallen') continue;
    if (!(char.x + 4 < plat.x + plat.w && char.x + char.w - 4 > plat.x)) continue;
    const dropThrough = plat.oneWay && input.down && char.stunTimer <= 0 && !char.quakeDiving;
    if (
      !dropThrough &&
      char.vy >= 0 &&
      prevBottom <= plat.y + 12 + Math.max(0, plat.vy * dt) &&
      char.y + char.h >= plat.y
    ) {
      char.y = plat.y - char.h;
      char.vy = 0;
      char.grounded = true;
      landed = plat;
      break;
    }
    if (!plat.oneWay && char.vy < 0 && prevY >= plat.y + plat.h - 10 && char.y <= plat.y + plat.h) {
      char.y = plat.y + plat.h;
      char.vy = Math.abs(char.vy) * 0.35;
    }
  }

  if (!landed) return;
  if (!wasGrounded && impactVy > 160) {
    char.squashX = 1.36;
    char.squashY = 0.65;
    char.jiggleAmp = Math.max(char.jiggleAmp, 0.2);
    sim.pendingEvents.push({ type: 'land', x: char.x + char.w / 2, y: landed.y, slotIndex: char.slotIndex });
  }
  if (char.quakeDiving) releaseQuake(char, sim);
  if (landed.type === 'moving') {
    char.x += landed.vx * dt;
    char.y += landed.vy * dt;
  }
  if (landed.type === 'crumbling' && landed.crumbleState === 'solid') {
    landed.crumbleState = 'shaking';
    landed.crumbleTimer = 0.65;
  }
}

export function updateCharacter(
  char: CharacterEntity,
  input: PlayerInputState,
  sim: SimulationState,
  dt: number
) {
  if (char.eliminated) return;
  if (!char.alive) {
    char.respawnTimer -= dt;
    if (char.respawnTimer <= 0) respawnCharacter(char, sim);
    return;
  }

  const hero = getHeroDef(char.heroId);
  decayTimers(char, dt);

  if (input.abilityPressed && char.abilityCooldown <= 0 && char.stunTimer <= 0) {
    triggerHeroAbility(char, sim);
  }

  if (char.grounded) {
    char.coyoteTimer = PHYSICS.COYOTE_TIME;
    char.jumpsUsed = 0;
  } else {
    char.coyoteTimer = Math.max(0, char.coyoteTimer - dt);
  }
  char.jumpBufferTimer =
    input.jumpPressed && char.stunTimer <= 0 ? PHYSICS.JUMP_BUFFER : Math.max(0, char.jumpBufferTimer - dt);

  let dir = 0;
  if (char.stunTimer <= 0 && !char.quakeDiving) {
    if (input.left) dir -= 1;
    if (input.right) dir += 1;
  }
  if (dir !== 0) char.facing = dir > 0 ? 1 : -1;

  const targetVx = dir * PHYSICS.MOVE_SPEED * hero.stats.speedMult;
  const accel = char.grounded ? PHYSICS.GROUND_ACCEL : PHYSICS.AIR_ACCEL;
  const decel = char.grounded ? PHYSICS.GROUND_DECEL : PHYSICS.AIR_DECEL;
  const friction = hero.stats.iceImmune ? 1 : sim.frictionFactor;
  const rate = (dir !== 0 ? accel : decel) * (char.grounded ? friction : 1);
  char.vx = char.stunTimer <= 0 ? moveTowards(char.vx, targetVx, rate * dt) : moveTowards(char.vx, 0, 420 * dt);

  if (sim.windForce !== 0) {
    char.vx += (sim.windForce * (char.grounded ? 0.55 : 1.1) * dt) / hero.stats.weightMult;
  }

  tryJump(char, sim);

  if (sim.jumpCutEnabled && !input.upHeld && char.vy < -180 && char.stunTimer <= 0) {
    char.vy *= Math.pow(PHYSICS.JUMP_CUT_MULTIPLIER, dt * 12);
  }

  if (char.quakeDiving) {
    char.vy = Math.max(char.vy, 900);
  } else if (input.down && !char.grounded && char.stunTimer <= 0) {
    char.vy = Math.min(PHYSICS.FAST_FALL_MAX, char.vy + PHYSICS.FAST_FALL_ACCEL * dt);
  } else {
    char.vy = Math.min(PHYSICS.MAX_FALL_SPEED, char.vy + PHYSICS.GRAVITY * dt);
  }

  moveHorizontal(char, sim, dt);
  moveVertical(char, input, sim, dt);
  updateCosmetics(char, dt);

  if (char.y > KILL_PLANE.bottom || char.x + char.w < KILL_PLANE.left || char.x > KILL_PLANE.right) {
    eliminateCharacter(char, sim);
  }
}
