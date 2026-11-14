import { getHeroDef } from './characters';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  CHARACTER_COLORS,
  PHYSICS,
} from './constants';
import { createInitialPlatforms, getMapLayout } from './maps';
import {
  CharacterEntity,
  GameSettings,
  HazardPhase,
  HudSnapshot,
  PlayerInputState,
  PlayerSlotConfig,
  RoundResult,
  SimulationState,
  StoryMatchRule,
  TeamId,
} from './types';

const HAZARD_SEQUENCE: HazardPhase[] = [
  'calm',
  'wind_left',
  'cannon',
  'wind_right',
  'slippery',
];

export function createSimulation(
  settings: GameSettings,
  slots: PlayerSlotConfig[],
  storyRule: StoryMatchRule | null = null
): SimulationState {
  const layout = getMapLayout(settings.mapId);
  const platforms = createInitialPlatforms(settings.mapId);

  const activeSlots = slots.filter((slot) => {
    if (slot.kind === 'off') return false;
    if (slot.kind === 'bot' && !settings.botsEnabled) return false;
    return true;
  });

  const finalSlots = activeSlots.length > 0 ? activeSlots : [slots[0]];

  const players: CharacterEntity[] = finalSlots.map((slot, idx) => {
    const spawn = layout.spawnPoints[idx % layout.spawnPoints.length];
    const hero = getHeroDef(slot.heroId);
    const maxLives =
      settings.mode === 'ffa' ||
      settings.mode === 'team' ||
      settings.mode === 'story' ||
      settings.mode === 'saga'
        ? settings.lives
        : 99;
    return {
      slotIndex: slot.slotIndex,
      heroId: hero.id,
      name:
        slot.kind === 'bot'
          ? !slot.name ||
            slot.name === 'Tıknaz Ali' ||
            slot.name === 'Murat' ||
            slot.name === 'Hayri' ||
            slot.name.startsWith('Bot')
            ? `Bot ${slot.slotIndex}`
            : slot.name
          : slot.name,
      isBot: slot.kind === 'bot',
      aiPersonality: slot.aiPersonality,
      team: slot.team,
      costume: { ...slot.costume },
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      w: PHYSICS.CHAR_WIDTH,
      h: PHYSICS.CHAR_HEIGHT,
      facing: spawn.x > ARENA_WIDTH / 2 ? -1 : 1,
      grounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpsUsed: 0,
      maxJumps: hero.stats.maxJumps,
      stunTimer: 0,
      pancakeTimer: 0,
      invulnTimer: 1.0,
      shieldTimer: 0,
      abilityCooldown: 0,
      abilityMaxCooldown: hero.abilityCooldown,
      flashTimer: 0,
      squashX: 1,
      squashY: 1,
      jiggleAmp: 0,
      jigglePhase: idx * 1.4,
      airTilt: 0,
      blinkTimer: 1.8 + idx * 0.65,
      walkCycle: 0,
      tasselAngle: 0,
      tasselVel: 0,
      alive: true,
      eliminated: false,
      respawnTimer: 0,
      lives: maxLives,
      maxLives,
      score: 0,
      kills: 0,
      deaths: 0,
      stomps: 0,
      jumpsMade: 0,
      lastHitBy: null,
      lastHitTimer: 0,
      aiDecisionTimer: 0,
      aiTargetSlot: null,
      aiWanderDir: idx % 2 === 0 ? 1 : -1,
    };
  });

  const initialHazard: HazardPhase = storyRule?.defaultHazard ?? 'calm';

  return {
    mode: settings.mode,
    mapId: settings.mapId,
    elapsedSec: 0,
    timeRemainingSec:
      settings.mode === 'time'
        ? settings.roundDurationSec
        : storyRule?.surviveSeconds ?? 0,
    hitstopTimer: 0,
    trauma: 0,
    hazardPhase: initialHazard,
    hazardTimer: 6.5,
    windForce:
      initialHazard === 'wind_left'
        ? -165
        : initialHazard === 'wind_right'
        ? 165
        : 0,
    frictionFactor: initialHazard === 'slippery' ? 0.25 : 1,
    cannons: [],
    nextCannonId: 1,
    platforms,
    players,
    finished: false,
    winnerSlot: null,
    winnerTeam: null,
    winReason: '',
    pendingEvents: [],
    storyRule,
  };
}

function respawnCharacter(char: CharacterEntity, sim: SimulationState) {
  const layout = getMapLayout(sim.mapId);
  const spawn = layout.spawnPoints[char.slotIndex % layout.spawnPoints.length];
  char.x = spawn.x;
  char.y = Math.max(40, spawn.y - 30);
  char.vx = 0;
  char.vy = 0;
  char.grounded = false;
  char.jumpsUsed = 0;
  char.stunTimer = 0;
  char.pancakeTimer = 0;
  char.invulnTimer = PHYSICS.SPAWN_INVULN;
  char.shieldTimer = 0;
  char.flashTimer = 0;
  char.squashX = 0.78;
  char.squashY = 1.28;
  char.jiggleAmp = 0.16;
  char.airTilt = 0;
  char.alive = true;
  char.lastHitBy = null;
  char.lastHitTimer = 0;
}

function updatePlatforms(sim: SimulationState, dt: number) {
  for (const plat of sim.platforms) {
    const prevX = plat.x;
    const prevY = plat.y;

    if (plat.type === 'moving' && plat.moveRange && plat.moveSpeed) {
      const phase = (plat.movePhase ?? 0) + sim.elapsedSec * plat.moveSpeed;
      const offset = Math.sin(phase) * plat.moveRange;
      if (plat.moveAxis === 'x') {
        plat.x = plat.baseX + offset;
      } else if (plat.moveAxis === 'y') {
        plat.y = plat.baseY + offset;
      }
    }

    plat.vx = dt > 0 ? (plat.x - prevX) / dt : 0;
    plat.vy = dt > 0 ? (plat.y - prevY) / dt : 0;

    if (plat.type === 'crumbling') {
      if (plat.crumbleState === 'shaking') {
        plat.crumbleTimer -= dt;
        if (plat.crumbleTimer <= 0) {
          plat.crumbleState = 'fallen';
          plat.crumbleTimer = 3.2;
          sim.pendingEvents.push({
            type: 'crumble',
            x: plat.x + plat.w / 2,
            y: plat.y + plat.h / 2,
          });
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

function updateHazards(sim: SimulationState, dt: number) {
  const isFullHazard = sim.mapId === 'hazard';
  const isCrimsonOrGolden =
    sim.mapId === 'story_crimson' || sim.mapId === 'story_golden';
  const isFrost = sim.mapId === 'story_frost';
  const isShadow = sim.mapId === 'story_shadow';

  if (!isFullHazard && !isCrimsonOrGolden && !isFrost && !isShadow) {
    sim.windForce = 0;
    sim.frictionFactor = 1;
    return;
  }

  sim.hazardTimer -= dt;
  if (sim.hazardTimer <= 0) {
    if (isFullHazard) {
      const currentIdx = HAZARD_SEQUENCE.indexOf(sim.hazardPhase);
      const nextPhase = HAZARD_SEQUENCE[(currentIdx + 1) % HAZARD_SEQUENCE.length];
      sim.hazardPhase = nextPhase;
      sim.hazardTimer = nextPhase === 'calm' ? 5.5 : 9.0;
      if (nextPhase === 'cannon') spawnCannonSalvo(sim);
    } else if (isCrimsonOrGolden) {
      const nextPhase: HazardPhase =
        sim.hazardPhase === 'cannon' ? 'calm' : 'cannon';
      sim.hazardPhase = nextPhase;
      sim.hazardTimer = nextPhase === 'cannon' ? 8.0 : 5.0;
      if (nextPhase === 'cannon') spawnCannonSalvo(sim);
    } else if (isFrost) {
      const nextPhase: HazardPhase =
        sim.hazardPhase === 'slippery' ? 'wind_left' : 'slippery';
      sim.hazardPhase = nextPhase;
      sim.hazardTimer = nextPhase === 'slippery' ? 9.0 : 6.0;
    } else if (isShadow) {
      const nextPhase: HazardPhase =
        sim.hazardPhase === 'wind_left'
          ? 'wind_right'
          : sim.hazardPhase === 'wind_right'
          ? 'calm'
          : 'wind_left';
      sim.hazardPhase = nextPhase;
      sim.hazardTimer = 7.0;
    }
  }

  if (sim.hazardPhase === 'wind_left') {
    sim.windForce = -175;
    sim.frictionFactor = isFrost ? 0.45 : 1;
  } else if (sim.hazardPhase === 'wind_right') {
    sim.windForce = 175;
    sim.frictionFactor = 1;
  } else if (sim.hazardPhase === 'slippery') {
    sim.windForce = 0;
    sim.frictionFactor = 0.22;
  } else {
    sim.windForce = 0;
    sim.frictionFactor = 1;
  }

  if (sim.hazardPhase === 'cannon') {
    if (sim.cannons.length < 2 && Math.floor(sim.hazardTimer * 10) % 28 === 0) {
      spawnCannonSalvo(sim);
    }
  }

  for (let i = sim.cannons.length - 1; i >= 0; i--) {
    const c = sim.cannons[i];
    if (!c.exploded) {
      c.telegraphTimer -= dt;
      if (c.telegraphTimer <= 0) {
        c.exploded = true;
        c.blastTimer = 0.35;
        sim.trauma = Math.min(1, sim.trauma + 0.45);
        sim.pendingEvents.push({ type: 'cannon', x: c.x, y: c.y });

        for (const p of sim.players) {
          if (!p.alive || p.invulnTimer > 0) continue;
          const cx = p.x + p.w / 2;
          const cy = p.y + p.h / 2;
          const dx = cx - c.x;
          const dy = cy - c.y;
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
      }
    } else {
      c.blastTimer -= dt;
      if (c.blastTimer <= 0) {
        sim.cannons.splice(i, 1);
      }
    }
  }
}

function spawnCannonSalvo(sim: SimulationState) {
  const targets = [340, 640, 940];
  const pick = targets[sim.nextCannonId % targets.length];
  sim.cannons.push({
    id: sim.nextCannonId++,
    x: pick + ((sim.nextCannonId * 53) % 120) - 60,
    y: 545,
    radius: 72,
    telegraphTimer: 0.95,
    blastTimer: 0,
    exploded: false,
  });
}

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

function triggerHeroAbility(char: CharacterEntity, sim: SimulationState) {
  const hero = getHeroDef(char.heroId);
  char.abilityCooldown = hero.abilityCooldown;
  const cx = char.x + char.w / 2;
  const cy = char.y + char.h / 2;
  const color = CHARACTER_COLORS[char.costume.colorId].primary;

  const isSameTeam = (a: CharacterEntity, b: CharacterEntity) =>
    (sim.mode === 'team' || sim.mode === 'story' || sim.mode === 'saga') &&
    a.team === b.team;

  switch (hero.abilityKind) {
    case 'high_spring': {
      char.vy = -780 * hero.stats.jumpMult;
      char.grounded = false;
      char.jumpsUsed = Math.min(char.maxJumps - 1, 1);
      char.squashX = 0.66;
      char.squashY = 1.44;
      char.jiggleAmp = 0.3;
      for (const other of sim.players) {
        if (other.slotIndex === char.slotIndex || !other.alive || isSameTeam(char, other)) continue;
        const dx = other.x + other.w / 2 - cx;
        const dy = other.y + other.h / 2 - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          const nx = dist > 1 ? dx / dist : char.facing;
          other.vx += nx * 360;
          other.vy = -360;
          other.lastHitBy = char.slotIndex;
          other.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
        }
      }
      break;
    }

    case 'belly_dash': {
      char.vx = char.facing * 720;
      char.vy = Math.min(char.vy, -130);
      char.shieldTimer = Math.max(char.shieldTimer, 0.45);
      char.squashX = 1.38;
      char.squashY = 0.72;
      char.jiggleAmp = 0.32;
      break;
    }

    case 'wind_blink': {
      char.vx = char.facing * 650;
      char.vy = -210;
      char.jumpsUsed = Math.max(0, char.jumpsUsed - 1);
      char.squashX = 1.34;
      char.squashY = 0.74;
      char.jiggleAmp = 0.25;
      break;
    }

    case 'flame_burst': {
      char.squashX = 1.35;
      char.squashY = 1.35;
      char.jiggleAmp = 0.35;
      sim.trauma = Math.min(1, sim.trauma + 0.32);
      for (const other of sim.players) {
        if (other.slotIndex === char.slotIndex || !other.alive || isSameTeam(char, other)) continue;
        const dx = other.x + other.w / 2 - cx;
        const dy = other.y + other.h / 2 - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 185 && other.invulnTimer <= 0) {
          const otherWeight = getHeroDef(other.heroId).stats.weightMult;
          const nx = dist > 1 ? dx / dist : char.facing;
          other.vx += (nx * 520) / otherWeight;
          other.vy = -440 / otherWeight;
          other.grounded = false;
          other.stunTimer = Math.max(other.stunTimer, 0.38);
          other.lastHitBy = char.slotIndex;
          other.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
        }
      }
      break;
    }

    case 'frost_shield': {
      char.shieldTimer = 2.2;
      char.squashX = 1.18;
      char.squashY = 1.18;
      char.jiggleAmp = 0.22;
      break;
    }

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

    case 'shadow_warp': {
      const targetX = Math.max(
        60,
        Math.min(ARENA_WIDTH - 60 - char.w, char.x + char.facing * 155)
      );
      char.x = targetX;
      char.vy = -240;
      char.invulnTimer = Math.max(char.invulnTimer, 0.25);
      char.squashX = 0.72;
      char.squashY = 1.3;
      break;
    }

    case 'gold_quake': {
      sim.trauma = Math.min(1, sim.trauma + 0.55);
      if (!char.grounded) {
        char.vy = 820;
      } else {
        char.vy = -220;
      }
      char.shieldTimer = Math.max(char.shieldTimer, 0.5);
      for (const other of sim.players) {
        if (other.slotIndex === char.slotIndex || !other.alive || isSameTeam(char, other)) continue;
        const dx = other.x + other.w / 2 - cx;
        const dy = other.y + other.h / 2 - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 220 && other.invulnTimer <= 0) {
          const otherWeight = getHeroDef(other.heroId).stats.weightMult;
          const nx = dist > 1 ? dx / dist : char.facing;
          other.vx += (nx * 560) / otherWeight;
          other.vy = -480 / otherWeight;
          other.grounded = false;
          other.stunTimer = Math.max(other.stunTimer, 0.5);
          other.lastHitBy = char.slotIndex;
          other.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
        }
      }
      break;
    }
  }

  sim.pendingEvents.push({
    type: 'ability',
    x: cx,
    y: cy,
    slotIndex: char.slotIndex,
    color,
  });
}

function updateCharacterPhysics(
  char: CharacterEntity,
  input: PlayerInputState,
  sim: SimulationState,
  dt: number,
  jumpCutEnabled: boolean
) {
  if (char.eliminated) return;

  if (!char.alive) {
    char.respawnTimer -= dt;
    if (char.respawnTimer <= 0) {
      respawnCharacter(char, sim);
    }
    return;
  }

  const hero = getHeroDef(char.heroId);

  // Decay timers & dramatic doughy squash-stretch recovery
  if (char.stunTimer > 0) char.stunTimer = Math.max(0, char.stunTimer - dt);
  if (char.pancakeTimer > 0) char.pancakeTimer = Math.max(0, char.pancakeTimer - dt);
  if (char.invulnTimer > 0) char.invulnTimer = Math.max(0, char.invulnTimer - dt);
  if (char.shieldTimer > 0) char.shieldTimer = Math.max(0, char.shieldTimer - dt);
  if (char.abilityCooldown > 0) char.abilityCooldown = Math.max(0, char.abilityCooldown - dt);
  if (char.flashTimer > 0) char.flashTimer = Math.max(0, char.flashTimer - dt);
  if (char.lastHitTimer > 0) {
    char.lastHitTimer = Math.max(0, char.lastHitTimer - dt);
    if (char.lastHitTimer === 0) char.lastHitBy = null;
  }

  if (input.abilityPressed && char.abilityCooldown <= 0 && char.stunTimer <= 0) {
    triggerHeroAbility(char, sim);
  }

  if (char.pancakeTimer > 0.36) {
    // Hold flat squished doughy pancake pose during impact peak
    const holdRate = Math.min(1, dt * 16);
    char.squashX += (1.92 - char.squashX) * holdRate;
    char.squashY += (0.34 - char.squashY) * holdRate;
  } else {
    // Elastic rebound back to normal clay silhouette
    const recoverSpeed = char.pancakeTimer > 0 ? 7.5 : 12.5;
    const squashRecover = Math.min(1, dt * recoverSpeed);
    char.squashX += (1 - char.squashX) * squashRecover;
    char.squashY += (1 - char.squashY) * squashRecover;
  }

  // Damped gelatin wobble & blink cycle
  char.jigglePhase += dt * 21;
  char.jiggleAmp = Math.max(0, char.jiggleAmp - dt * 0.42);
  char.blinkTimer -= dt;
  if (char.blinkTimer < -0.11) {
    char.blinkTimer = 2.2 + ((char.slotIndex * 0.53) % 1.4);
  }

  // Mid-air subtle tilt / tumble
  const targetTilt = char.grounded
    ? 0
    : char.stunTimer > 0
    ? char.airTilt + char.facing * dt * 8.5
    : Math.max(-0.32, Math.min(0.32, char.vx * 0.0007));
  if (char.stunTimer > 0 && !char.grounded) {
    char.airTilt = targetTilt;
  } else {
    char.airTilt += (targetTilt - char.airTilt) * Math.min(1, dt * 10);
  }

  // Tassel spring physics
  const targetTassel = -char.vx * 0.0022;
  const accelTassel = (targetTassel - char.tasselAngle) * 65 - char.tasselVel * 8;
  char.tasselVel += accelTassel * dt;
  char.tasselAngle += char.tasselVel * dt;

  // Input buffering & coyote time
  if (char.grounded) {
    char.coyoteTimer = PHYSICS.COYOTE_TIME;
    char.jumpsUsed = 0;
  } else {
    char.coyoteTimer = Math.max(0, char.coyoteTimer - dt);
  }

  if (input.jumpPressed && char.stunTimer <= 0) {
    char.jumpBufferTimer = PHYSICS.JUMP_BUFFER;
  } else {
    char.jumpBufferTimer = Math.max(0, char.jumpBufferTimer - dt);
  }

  // Horizontal steering
  let dir = 0;
  if (char.stunTimer <= 0) {
    if (input.left) dir -= 1;
    if (input.right) dir += 1;
  }

  if (dir !== 0) {
    char.facing = dir > 0 ? 1 : -1;
  }

  const targetVx = dir * PHYSICS.MOVE_SPEED * hero.stats.speedMult;
  const accelBase = char.grounded ? PHYSICS.GROUND_ACCEL : PHYSICS.AIR_ACCEL;
  const decelBase = char.grounded ? PHYSICS.GROUND_DECEL : PHYSICS.AIR_DECEL;
  const effectiveFriction = hero.stats.iceImmune ? 1 : sim.frictionFactor;
  const rate =
    (dir !== 0 ? accelBase : decelBase) * (char.grounded ? effectiveFriction : 1);

  if (char.stunTimer <= 0) {
    char.vx = moveTowards(char.vx, targetVx, rate * dt);
  } else {
    char.vx = moveTowards(char.vx, 0, 420 * dt);
  }

  if (sim.windForce !== 0) {
    const windMult = (char.grounded ? 0.55 : 1.1) / hero.stats.weightMult;
    char.vx += sim.windForce * windMult * dt;
  }

  // Jump execution (ground/coyote or double/triple jump)
  if (char.jumpBufferTimer > 0 && char.stunTimer <= 0) {
    if (char.coyoteTimer > 0) {
      char.vy = PHYSICS.JUMP_VELOCITY * hero.stats.jumpMult;
      char.grounded = false;
      char.coyoteTimer = 0;
      char.jumpBufferTimer = 0;
      char.jumpsUsed = 1;
      char.jumpsMade += 1;
      char.squashX = 0.74;
      char.squashY = 1.32;
      char.jiggleAmp = Math.max(char.jiggleAmp, 0.14);
      sim.pendingEvents.push({
        type: 'jump',
        x: char.x + char.w / 2,
        y: char.y + char.h,
        slotIndex: char.slotIndex,
      });
    } else if (char.jumpsUsed < char.maxJumps) {
      char.vy = PHYSICS.DOUBLE_JUMP_VELOCITY * hero.stats.jumpMult;
      char.jumpsUsed += 1;
      char.jumpsMade += 1;
      char.jumpBufferTimer = 0;
      char.squashX = 0.75;
      char.squashY = 1.28;
      char.jiggleAmp = Math.max(char.jiggleAmp, 0.16);
      sim.pendingEvents.push({
        type: 'double_jump',
        x: char.x + char.w / 2,
        y: char.y + char.h,
        slotIndex: char.slotIndex,
      });
    }
  }

  if (jumpCutEnabled && !input.upHeld && char.vy < -180 && char.stunTimer <= 0) {
    char.vy *= Math.pow(PHYSICS.JUMP_CUT_MULTIPLIER, dt * 12);
  }

  if (input.down && !char.grounded && char.stunTimer <= 0) {
    char.vy = Math.min(PHYSICS.FAST_FALL_MAX, char.vy + PHYSICS.FAST_FALL_ACCEL * dt);
  } else {
    char.vy = Math.min(PHYSICS.MAX_FALL_SPEED, char.vy + PHYSICS.GRAVITY * dt);
  }

  const prevX = char.x;
  const prevY = char.y;
  const prevBottom = prevY + char.h;

  char.x += char.vx * dt;
  for (const plat of sim.platforms) {
    if (plat.oneWay || plat.crumbleState === 'fallen') continue;
    if (
      char.x < plat.x + plat.w &&
      char.x + char.w > plat.x &&
      char.y + 4 < plat.y + plat.h &&
      char.y + char.h - 4 > plat.y
    ) {
      if (prevX + char.w <= plat.x + 6) {
        char.x = plat.x - char.w;
        char.vx = -Math.abs(char.vx) * PHYSICS.WALL_BOUNCE_RESTITUTION;
      } else if (prevX >= plat.x + plat.w - 6) {
        char.x = plat.x + plat.w;
        char.vx = Math.abs(char.vx) * PHYSICS.WALL_BOUNCE_RESTITUTION;
      }
    }
  }

  const wasGrounded = char.grounded;
  let landedPlatform = null as (typeof sim.platforms)[number] | null;
  char.grounded = false;
  char.y += char.vy * dt;

  for (const plat of sim.platforms) {
    if (plat.crumbleState === 'fallen') continue;
    const overlapX = char.x + 4 < plat.x + plat.w && char.x + char.w - 4 > plat.x;
    if (!overlapX) continue;

    const dropThrough = plat.oneWay && input.down && char.stunTimer <= 0;
    if (
      !dropThrough &&
      char.vy >= 0 &&
      prevBottom <= plat.y + 12 + Math.max(0, plat.vy * dt) &&
      char.y + char.h >= plat.y
    ) {
      char.y = plat.y - char.h;
      if (!wasGrounded && char.vy > 160) {
        char.squashX = 1.36;
        char.squashY = 0.65;
        char.jiggleAmp = Math.max(char.jiggleAmp, 0.2);
        sim.pendingEvents.push({
          type: 'land',
          x: char.x + char.w / 2,
          y: plat.y,
          slotIndex: char.slotIndex,
        });
      }
      char.vy = 0;
      char.grounded = true;
      landedPlatform = plat;
      break;
    }

    if (
      !plat.oneWay &&
      char.vy < 0 &&
      prevY >= plat.y + plat.h - 10 &&
      char.y <= plat.y + plat.h
    ) {
      char.y = plat.y + plat.h;
      char.vy = Math.abs(char.vy) * 0.35;
    }
  }

  if (landedPlatform) {
    if (landedPlatform.type === 'moving') {
      char.x += landedPlatform.vx * dt;
      char.y += landedPlatform.vy * dt;
    }
    if (
      landedPlatform.type === 'crumbling' &&
      landedPlatform.crumbleState === 'solid'
    ) {
      landedPlatform.crumbleState = 'shaking';
      landedPlatform.crumbleTimer = 0.65;
    }
  }

  if (char.grounded && Math.abs(char.vx) > 25) {
    char.walkCycle += Math.abs(char.vx) * dt * 0.085;
  }

  if (
    char.y > ARENA_HEIGHT + 90 ||
    char.x + char.w < -110 ||
    char.x > ARENA_WIDTH + 110
  ) {
    eliminateCharacter(char, sim);
  }
}

function resolveCharacterCollisions(sim: SimulationState) {
  const players = sim.players;
  for (let i = 0; i < players.length; i++) {
    const a = players[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < players.length; j++) {
      const b = players[j];
      if (!b.alive) continue;

      if (
        a.x >= b.x + b.w ||
        a.x + a.w <= b.x ||
        a.y >= b.y + b.h ||
        a.y + a.h <= b.y
      ) {
        continue;
      }

      const sameTeam =
        (sim.mode === 'team' || sim.mode === 'story' || sim.mode === 'saga') &&
        a.team === b.team;

      const aCenterY = a.y + a.h / 2;
      const bCenterY = b.y + b.h / 2;
      const aCenterX = a.x + a.w / 2;
      const bCenterX = b.x + b.w / 2;

      const aAboveB = a.y + a.h <= b.y + b.h * 0.56 && a.vy > 30;
      const bAboveA = b.y + b.h <= a.y + a.h * 0.56 && b.vy > 30;

      if (!sameTeam && aAboveB && b.invulnTimer <= 0) {
        applyHeadStomp(a, b, sim);
        continue;
      }
      if (!sameTeam && bAboveA && a.invulnTimer <= 0) {
        applyHeadStomp(b, a, sim);
        continue;
      }

      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

      if (overlapX < overlapY) {
        const pushDir = aCenterX < bCenterX ? -1 : 1;
        const half = overlapX / 2 + 0.5;
        a.x += pushDir * half;
        b.x -= pushDir * half;

        if (!sameTeam) {
          const aHero = getHeroDef(a.heroId);
          const bHero = getHeroDef(b.heroId);
          const relSpeed = Math.abs(a.vx - b.vx);
          const baseBump = Math.max(PHYSICS.BUMP_MIN_IMPULSE_X, relSpeed * 0.85);
          const aShieldBonus = a.shieldTimer > 0 ? 1.45 : 1;
          const bShieldBonus = b.shieldTimer > 0 ? 1.45 : 1;

          a.vx = pushDir * ((baseBump * bHero.stats.weightMult * bShieldBonus) / aHero.stats.weightMult);
          b.vx = -pushDir * ((baseBump * aHero.stats.weightMult * aShieldBonus) / bHero.stats.weightMult);
          a.vy = Math.min(a.vy, PHYSICS.BUMP_IMPULSE_Y * 0.6);
          b.vy = Math.min(b.vy, PHYSICS.BUMP_IMPULSE_Y * 0.6);
          a.squashX = 0.72;
          a.squashY = 1.28;
          b.squashX = 0.72;
          b.squashY = 1.28;
          a.jiggleAmp = Math.max(a.jiggleAmp, 0.24);
          b.jiggleAmp = Math.max(b.jiggleAmp, 0.24);

          a.lastHitBy = b.slotIndex;
          a.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
          b.lastHitBy = a.slotIndex;
          b.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;

          sim.pendingEvents.push({
            type: 'bump',
            x: (aCenterX + bCenterX) / 2,
            y: (aCenterY + bCenterY) / 2,
          });
        } else {
          const avgVx = (a.vx + b.vx) / 2;
          a.vx = avgVx + pushDir * 60;
          b.vx = avgVx - pushDir * 60;
        }
      } else {
        const pushY = aCenterY < bCenterY ? -1 : 1;
        const half = overlapY / 2 + 0.5;
        a.y += pushY * half;
        b.y -= pushY * half;
        if (pushY < 0) {
          a.vy = Math.min(a.vy, -260);
          a.jumpsUsed = Math.min(a.jumpsUsed, 1);
        } else {
          b.vy = Math.min(b.vy, -260);
          b.jumpsUsed = Math.min(b.jumpsUsed, 1);
        }
      }
    }
  }
}

function applyHeadStomp(
  attacker: CharacterEntity,
  victim: CharacterEntity,
  sim: SimulationState
) {
  const pushDir =
    attacker.x + attacker.w / 2 < victim.x + victim.w / 2 ? 1 : -1;

  // Shielded victims deflect head stomps!
  if (victim.shieldTimer > 0) {
    attacker.y = victim.y - attacker.h - 4;
    attacker.vx = -pushDir * 390;
    attacker.vy = -480;
    attacker.stunTimer = Math.max(attacker.stunTimer, 0.42);
    attacker.squashX = 0.72;
    attacker.squashY = 1.3;
    attacker.lastHitBy = victim.slotIndex;
    attacker.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;
    sim.trauma = Math.min(1, sim.trauma + 0.28);
    sim.pendingEvents.push({
      type: 'bump',
      x: victim.x + victim.w / 2,
      y: victim.y,
    });
    return;
  }

  const attackerHero = getHeroDef(attacker.heroId);
  const victimHero = getHeroDef(victim.heroId);
  const powerRatio = attackerHero.stats.stompPower / victimHero.stats.weightMult;

  attacker.y = victim.y - attacker.h - 2;
  attacker.vy = PHYSICS.STOMP_BOUNCE_VELOCITY;
  attacker.jumpsUsed = 0;
  attacker.squashX = 0.68;
  attacker.squashY = 1.42;
  attacker.jiggleAmp = Math.max(attacker.jiggleAmp, 0.28);
  attacker.stomps += 1;
  attacker.score += 10;

  victim.stunTimer = PHYSICS.STOMP_STUN_DURATION * Math.min(1.3, Math.max(0.8, powerRatio));
  victim.pancakeTimer = PHYSICS.STOMP_PANCAKE_DURATION;
  victim.flashTimer = 0.09;
  victim.squashX = 1.95;
  victim.squashY = 0.32;
  victim.jiggleAmp = 0.45;
  victim.vx = pushDir * PHYSICS.STOMP_KNOCKBACK_X * powerRatio;
  victim.vy = Math.max(victim.vy, 120) + PHYSICS.STOMP_VICTIM_DOWN_IMPULSE * powerRatio;
  victim.lastHitBy = attacker.slotIndex;
  victim.lastHitTimer = PHYSICS.KILL_CREDIT_WINDOW;

  sim.hitstopTimer = 0.055;
  sim.trauma = Math.min(1, sim.trauma + 0.48);

  sim.pendingEvents.push({
    type: 'stomp',
    x: victim.x + victim.w / 2,
    y: victim.y + victim.h * 0.72,
    slotIndex: attacker.slotIndex,
    victimSlot: victim.slotIndex,
    color: CHARACTER_COLORS[victim.costume.colorId].primary,
    points: 10,
  });
}

function eliminateCharacter(char: CharacterEntity, sim: SimulationState) {
  char.alive = false;
  char.deaths += 1;
  sim.trauma = Math.min(1, sim.trauma + 0.5);

  let killerSlot: number | undefined;
  if (char.lastHitBy !== null && char.lastHitBy !== char.slotIndex) {
    const killer = sim.players.find((p) => p.slotIndex === char.lastHitBy);
    if (killer) {
      killer.kills += 1;
      killer.score += 25;
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
    points: killerSlot !== undefined ? 25 : undefined,
  });

  if (
    sim.mode === 'ffa' ||
    sim.mode === 'team' ||
    sim.mode === 'story' ||
    sim.mode === 'saga'
  ) {
    char.lives -= 1;
    if (char.lives <= 0) {
      char.eliminated = true;
    } else {
      char.respawnTimer = PHYSICS.RESPAWN_DELAY;
    }
  } else {
    char.respawnTimer = PHYSICS.RESPAWN_DELAY;
  }
}

function evaluateWinCondition(sim: SimulationState) {
  if (sim.finished) return;

  if ((sim.mode === 'story' || sim.mode === 'saga') && sim.storyRule) {
    const pofi = sim.players[0];
    const enemies = sim.players.filter((p) => p.team !== pofi.team);

    if (pofi.eliminated) {
      sim.finished = true;
      const topRival = enemies[0] ?? null;
      sim.winnerSlot = topRival ? topRival.slotIndex : null;
      sim.winReason = `${pofi.name} surlardan düştü! Bölümü yeniden deneyebilirsin.`;
      return;
    }

    if (sim.storyRule.targetStomps && pofi.stomps >= sim.storyRule.targetStomps) {
      sim.finished = true;
      sim.winnerSlot = pofi.slotIndex;
      sim.winnerTeam = pofi.team;
      sim.winReason = `${pofi.name}, ${sim.storyRule.targetStomps} kafa ezme hedefini tamamlayarak zafere ulaştı!`;
      return;
    }

    if (sim.storyRule.targetScore && pofi.score >= sim.storyRule.targetScore) {
      sim.finished = true;
      sim.winnerSlot = pofi.slotIndex;
      sim.winnerTeam = pofi.team;
      sim.winReason = `${pofi.name}, ${sim.storyRule.targetScore} puana ulaşarak bölümü kazandı!`;
      return;
    }

    if (sim.storyRule.surviveSeconds && sim.timeRemainingSec <= 0) {
      sim.timeRemainingSec = 0;
      sim.finished = true;
      sim.winnerSlot = pofi.slotIndex;
      sim.winnerTeam = pofi.team;
      sim.winReason = `${pofi.name} fırtınaya karşı direndi ve etabı başarıyla tamamladı!`;
      return;
    }

    if (enemies.length > 0 && enemies.every((e) => e.eliminated)) {
      sim.finished = true;
      sim.winnerSlot = pofi.slotIndex;
      sim.winnerTeam = pofi.team;
      sim.winReason = `${pofi.name} tüm rakiplerini alt ederek etabı fethetti!`;
      return;
    }
  } else if (sim.mode === 'ffa') {
    if (sim.players.length <= 1) return;
    const survivors = sim.players.filter((p) => !p.eliminated);
    if (survivors.length <= 1) {
      sim.finished = true;
      const winner = survivors[0] ?? rankPlayers(sim.players)[0] ?? null;
      sim.winnerSlot = winner ? winner.slotIndex : null;
      sim.winReason = winner
        ? `${winner.name} kalede ayakta kalan son fesli oldu!`
        : 'Mücadele berabere bitti!';
    }
  } else if (sim.mode === 'team') {
    const aliveTeams = new Set<TeamId>();
    for (const p of sim.players) {
      if (!p.eliminated) aliveTeams.add(p.team);
    }
    const hadTwoTeams = new Set(sim.players.map((p) => p.team)).size >= 2;
    if (hadTwoTeams && aliveTeams.size <= 1) {
      sim.finished = true;
      const winTeam = Array.from(aliveTeams)[0] ?? null;
      sim.winnerTeam = winTeam;
      const teamPlayers = sim.players.filter((p) => p.team === winTeam);
      const mvp = rankPlayers(teamPlayers)[0] ?? null;
      sim.winnerSlot = mvp ? mvp.slotIndex : null;
      sim.winReason =
        winTeam === 'A'
          ? 'Kırmızı Takım kaleyi fethetti!'
          : winTeam === 'B'
          ? 'Mavi Takım kaleyi fethetti!'
          : 'Takımlar aynı anda düştü!';
    }
  } else if (sim.mode === 'time') {
    if (sim.timeRemainingSec <= 0) {
      sim.timeRemainingSec = 0;
      sim.finished = true;
      const ranked = rankPlayers(sim.players);
      const winner = ranked[0] ?? null;
      sim.winnerSlot = winner ? winner.slotIndex : null;
      sim.winReason = winner
        ? `Süre doldu! ${winner.name} ${winner.score} puan ile zafere ulaştı!`
        : 'Süre doldu!';
    }
  }
}

export function rankPlayers(players: CharacterEntity[]): CharacterEntity[] {
  return [...players].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.kills !== a.kills) return b.kills - a.kills;
    if (a.deaths !== b.deaths) return a.deaths - b.deaths;
    if (b.stomps !== a.stomps) return b.stomps - a.stomps;
    return b.lives - a.lives;
  });
}

export function stepSimulation(
  sim: SimulationState,
  inputsBySlot: Record<number, PlayerInputState>,
  rawDt: number,
  jumpCutEnabled = true
) {
  const dt = Math.min(rawDt, 0.05);
  sim.trauma = Math.max(0, sim.trauma - dt * 1.8);

  if (sim.finished) return;

  if (sim.hitstopTimer > 0) {
    sim.hitstopTimer = Math.max(0, sim.hitstopTimer - dt);
    return;
  }

  sim.elapsedSec += dt;
  if (
    sim.mode === 'time' ||
    ((sim.mode === 'story' || sim.mode === 'saga') && sim.storyRule?.surviveSeconds)
  ) {
    sim.timeRemainingSec = Math.max(0, sim.timeRemainingSec - dt);
  }

  updatePlatforms(sim, dt);
  updateHazards(sim, dt);

  for (const player of sim.players) {
    const input = inputsBySlot[player.slotIndex] ?? {
      left: false,
      right: false,
      upHeld: false,
      jumpPressed: false,
      down: false,
      abilityPressed: false,
    };
    updateCharacterPhysics(player, input, sim, dt, jumpCutEnabled);
  }

  resolveCharacterCollisions(sim);
  evaluateWinCondition(sim);
}

export function buildHudSnapshot(sim: SimulationState): HudSnapshot {
  let storyObjective = sim.storyRule?.objectiveLabel;
  if ((sim.mode === 'story' || sim.mode === 'saga') && sim.storyRule) {
    const pofi = sim.players[0];
    if (sim.storyRule.targetStomps) {
      storyObjective = `${sim.storyRule.objectiveLabel} (${pofi.stomps}/${sim.storyRule.targetStomps})`;
    } else if (sim.storyRule.targetScore) {
      storyObjective = `${sim.storyRule.objectiveLabel} (${pofi.score}/${sim.storyRule.targetScore})`;
    } else if (sim.storyRule.surviveSeconds) {
      storyObjective = `${sim.storyRule.objectiveLabel} (${Math.ceil(sim.timeRemainingSec)}s)`;
    }
  }

  return {
    mode: sim.mode,
    mapId: sim.mapId,
    elapsedSec: sim.elapsedSec,
    timeRemainingSec: sim.timeRemainingSec,
    aliveCount: sim.players.filter((p) => !p.eliminated).length,
    hazardPhase: sim.hazardPhase,
    storyObjective,
    players: sim.players.map((p) => ({
      slotIndex: p.slotIndex,
      heroId: p.heroId,
      name: p.name,
      isBot: p.isBot,
      team: p.team,
      colorId: p.costume.colorId,
      costume: p.costume,
      lives: p.lives,
      maxLives: p.maxLives,
      score: p.score,
      kills: p.kills,
      deaths: p.deaths,
      stomps: p.stomps,
      jumpsMade: p.jumpsMade,
      alive: p.alive,
      eliminated: p.eliminated,
      stunned: p.stunTimer > 0,
      shielded: p.shieldTimer > 0,
      abilityCooldown: p.abilityCooldown,
      abilityMaxCooldown: p.abilityMaxCooldown,
    })),
  };
}

export function buildRoundResult(sim: SimulationState): RoundResult {
  const ranked = rankPlayers(sim.players);
  const winnerSlot =
    sim.winnerSlot ?? (ranked[0] ? ranked[0].slotIndex : null);
  const storyWon =
    sim.mode === 'story' &&
    sim.players[0] &&
    winnerSlot === sim.players[0].slotIndex;
  const sagaWon =
    sim.mode === 'saga' &&
    sim.players[0] &&
    winnerSlot === sim.players[0].slotIndex;

  return {
    mode: sim.mode,
    mapId: sim.mapId,
    durationSec: sim.elapsedSec,
    winnerSlot,
    winnerTeam: sim.winnerTeam,
    winReason:
      sim.winReason ||
      (ranked[0]
        ? `${ranked[0].name} ${ranked[0].score} puan ile zirvede!`
        : 'Mücadele tamamlandı!'),
    standings: ranked.map((p) => ({
      slotIndex: p.slotIndex,
      heroId: p.heroId,
      name: p.name,
      isBot: p.isBot,
      team: p.team,
      colorId: p.costume.colorId,
      costume: p.costume,
      lives: p.lives,
      maxLives: p.maxLives,
      score: p.score,
      kills: p.kills,
      deaths: p.deaths,
      stomps: p.stomps,
      jumpsMade: p.jumpsMade,
      alive: p.alive,
      eliminated: p.eliminated,
      stunned: false,
      shielded: false,
      abilityCooldown: p.abilityCooldown,
      abilityMaxCooldown: p.abilityMaxCooldown,
    })),
    storyChapterId: sim.mode === 'story' ? sim.storyRule?.chapterId : undefined,
    storyWon,
    sagaLevelId:
      sim.mode === 'saga' && sim.storyRule
        ? sim.storyRule.chapterId - 100
        : undefined,
    sagaWon,
  };
}
