import { getHeroDef } from '../content/heroes';
import { areAllies } from '../sim/abilities';
import { PHYSICS } from '../sim/constants';
import { nextRandom } from '../sim/rng';
import { AiDifficulty, AiPersonality, CharacterEntity, PlatformState, PlayerInputState, SimulationState } from '../sim/types';
import {
  centerX,
  currentPlatform,
  distanceToDeadlyEdge,
  homePlatform,
  nearestSafePlatform,
  platformBelow,
  predictLanding,
} from './navigation';

export interface DifficultyProfile {
  /** Input latency in ticks (60 Hz). */
  reactionTicks: number;
  /** Ticks between strategic re-evaluations (target choice, wander point). */
  decisionTicks: number;
  /** 0..1 – how eagerly & correctly abilities are used. */
  abilitySkill: number;
  /** 0..1 – chance a recovery is executed without fumbling. */
  recoverySkill: number;
  /** Horizontal aim error in pixels. */
  aimError: number;
}

export const DIFFICULTY_PROFILES: Record<AiDifficulty, DifficultyProfile> = {
  easy: { reactionTicks: 18, decisionTicks: 36, abilitySkill: 0.25, recoverySkill: 0.55, aimError: 46 },
  normal: { reactionTicks: 10, decisionTicks: 22, abilitySkill: 0.55, recoverySkill: 0.85, aimError: 22 },
  hard: { reactionTicks: 5, decisionTicks: 12, abilitySkill: 0.85, recoverySkill: 0.96, aimError: 9 },
  master: { reactionTicks: 2, decisionTicks: 6, abilitySkill: 1, recoverySkill: 1, aimError: 3 },
};

interface PersonalityProfile {
  engageRange: number;
  edgeCaution: number;
  stunBias: number;
  edgeBias: number;
  chaos: number;
}

export const PERSONALITY_PROFILES: Record<AiPersonality, PersonalityProfile> = {
  aggressive: { engageRange: Infinity, edgeCaution: 25, stunBias: 1, edgeBias: 0.5, chaos: 0 },
  defensive: { engageRange: 320, edgeCaution: 90, stunBias: 1.5, edgeBias: 0.5, chaos: 0 },
  balanced: { engageRange: 720, edgeCaution: 55, stunBias: 1, edgeBias: 1, chaos: 0 },
  chaotic: { engageRange: Infinity, edgeCaution: 20, stunBias: 0.5, edgeBias: 0.5, chaos: 0.035 },
  opportunist: { engageRange: 640, edgeCaution: 55, stunBias: 3, edgeBias: 2.5, chaos: 0 },
};

type Dir = -1 | 0 | 1;

const emptyInput = (): PlayerInputState => ({
  left: false,
  right: false,
  upHeld: false,
  jumpPressed: false,
  down: false,
  abilityPressed: false,
});

function setDir(input: PlayerInputState, dir: number) {
  input.left = dir < 0;
  input.right = dir > 0;
}

function dirOf(input: PlayerInputState): Dir {
  return input.left === input.right ? 0 : input.left ? -1 : 1;
}

function sign(v: number): Dir {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

/** One bot's decision maker. Holds private state (target, latency queue, RNG) outside the simulation. */
export class BotBrain {
  private rng: { rngState: number };
  private queue: PlayerInputState[] = [];
  private targetSlot: number | null = null;
  private decisionCountdown = 0;
  private jumpLock = 0;
  private abilityLock = 0;
  private aimOffset = 0;
  private wanderX = 640;
  private fumbleTicks = 0;
  private wasRecovering = false;

  constructor(readonly slotIndex: number, seed: number) {
    this.rng = { rngState: (seed ^ Math.imul(slotIndex + 1, 0x9e3779b1)) >>> 0 };
  }

  private rand(): number {
    return nextRandom(this.rng);
  }

  think(bot: CharacterEntity, sim: SimulationState): PlayerInputState {
    const desired = this.decide(bot, sim);
    const delay = DIFFICULTY_PROFILES[bot.aiDifficulty].reactionTicks;
    this.queue.push(desired);
    if (this.queue.length <= delay) return emptyInput();
    return this.queue.shift()!;
  }

  private decide(bot: CharacterEntity, sim: SimulationState): PlayerInputState {
    const input = emptyInput();
    if (!bot.alive || bot.eliminated || sim.countdownSec > 0) {
      this.queue.length = 0;
      return input;
    }
    this.jumpLock = Math.max(0, this.jumpLock - 1);
    this.abilityLock = Math.max(0, this.abilityLock - 1);
    const diff = DIFFICULTY_PROFILES[bot.aiDifficulty];
    const pers = PERSONALITY_PROFILES[bot.aiPersonality];
    const plat = currentPlatform(bot, sim);

    if (!bot.grounded && this.recover(bot, sim, input, diff)) return input;
    this.wasRecovering = false;

    if (--this.decisionCountdown <= 0) {
      this.decisionCountdown = diff.decisionTicks;
      this.targetSlot = this.chooseTarget(bot, sim, pers);
      this.aimOffset = (this.rand() * 2 - 1) * diff.aimError;
      const home = homePlatform(sim);
      if (home) this.wanderX = home.x + 60 + this.rand() * Math.max(0, home.w - 120);
    }

    if (!this.evade(bot, sim, input, plat, diff)) {
      const target = sim.players.find((p) => p.slotIndex === this.targetSlot && p.alive) ?? null;
      const dist = target ? Math.hypot(centerX(target) - centerX(bot), target.y - bot.y) : Infinity;
      const engage = target && (dist < pers.engageRange || target.stunTimer > 0);
      if (target && engage) {
        this.engage(bot, sim, target, input, plat);
        this.heroTactics(bot, sim, target, input, diff);
      } else {
        this.reposition(bot, sim, input, plat, pers);
      }
      if (pers.chaos > 0 && bot.grounded && this.rand() < pers.chaos) this.pressJump(input);
    }

    this.applySafety(bot, sim, input, plat, pers);
    if (input.jumpPressed) this.jumpLock = 9;
    if (input.abilityPressed) this.abilityLock = 24;
    return input;
  }

  // ---------------------------------------------------------------- targeting

  private chooseTarget(bot: CharacterEntity, sim: SimulationState, pers: PersonalityProfile): number | null {
    let best: number | null = null;
    let bestScore = -Infinity;
    for (const o of sim.players) {
      if (o === bot || !o.alive || areAllies(sim, bot, o)) continue;
      const dist = Math.hypot(centerX(o) - centerX(bot), o.y - bot.y);
      let score = -dist / 140;
      if (o.stunTimer > 0) score += pers.stunBias;
      const oPlat = currentPlatform(o, sim);
      if (oPlat) {
        const edge = distanceToDeadlyEdge(o, sim, oPlat);
        if (Math.min(edge.left, edge.right) < 90) score += pers.edgeBias;
      } else if (!platformBelow(sim, centerX(o), o.y + o.h)) {
        score += pers.edgeBias * 1.5;
      }
      if (o.invulnTimer > 0.3) score -= 2;
      if (o.lives === 1 && o.maxLives > 1) score += 0.4;
      if (!o.isBot) score += 0.25;
      if (o.slotIndex === this.targetSlot) score += 0.8;
      if (score > bestScore) {
        bestScore = score;
        best = o.slotIndex;
      }
    }
    return best;
  }

  // ---------------------------------------------------------------- recovery

  private safeAirDirs(bot: CharacterEntity, sim: SimulationState): Dir[] {
    return ([0, -1, 1] as Dir[]).filter((d) => predictLanding(bot, sim, d) !== null);
  }

  private recover(bot: CharacterEntity, sim: SimulationState, input: PlayerInputState, diff: DifficultyProfile): boolean {
    if (this.safeAirDirs(bot, sim).length > 0) return false;

    if (!this.wasRecovering) {
      this.wasRecovering = true;
      this.fumbleTicks = this.rand() > diff.recoverySkill ? 14 + Math.floor(this.rand() * 16) : 0;
    }
    const cx = centerX(bot);
    const feet = bot.y + bot.h;
    const home = nearestSafePlatform(sim, cx, feet) ?? homePlatform(sim);
    const homeX = home ? Math.max(home.x + 30, Math.min(home.x + home.w - 30, cx)) : 640;
    const toward = sign(homeX - cx) || 1;
    setDir(input, toward);
    input.upHeld = true;
    if (this.fumbleTicks > 0) {
      this.fumbleTicks--;
      return true;
    }

    const hero = getHeroDef(bot.heroId);
    const jumpsLeft = bot.jumpsUsed < bot.maxJumps || bot.coyoteTimer > 0;
    if (jumpsLeft && this.jumpLock <= 0 && bot.vy > -120) {
      const jumpVy = PHYSICS.DOUBLE_JUMP_VELOCITY * hero.stats.jumpMult;
      const works = ([toward, 0, -toward] as Dir[]).find((d) => predictLanding(bot, sim, d, { vy: jumpVy }) !== null);
      const belowHome = home ? feet > home.y - 10 : true;
      // Save the last jump until falling, unless it already gets us home.
      if (works !== undefined || (belowHome && bot.vy > 120)) {
        if (works !== undefined) setDir(input, works);
        this.pressJump(input);
        return true;
      }
    }

    if (bot.abilityCooldown <= 0 && this.abilityLock <= 0 && bot.stunTimer <= 0) {
      const facingHome = bot.facing === toward;
      switch (hero.abilityKind) {
        case 'sky_hook':
        case 'high_spring':
          input.abilityPressed = bot.vy > -200;
          break;
        case 'wind_blink':
        case 'belly_dash':
        case 'shadow_warp':
          input.abilityPressed = facingHome;
          break;
        default:
          break;
      }
    }
    return true;
  }

  // ---------------------------------------------------------------- evasion

  private evade(
    bot: CharacterEntity,
    sim: SimulationState,
    input: PlayerInputState,
    plat: PlatformState | null,
    diff: DifficultyProfile
  ): boolean {
    const cx = centerX(bot);
    const hero = getHeroDef(bot.heroId);
    const abilityReady = bot.abilityCooldown <= 0 && this.abilityLock <= 0;

    for (const c of sim.cannons) {
      if (c.exploded || c.telegraphTimer > 0.95) continue;
      if (Math.abs(c.x - cx) < c.radius + 50 && Math.abs(c.y - (bot.y + bot.h)) < 150) {
        if (abilityReady && hero.abilityKind === 'frost_shield' && c.telegraphTimer < 0.3) {
          input.abilityPressed = this.rand() < diff.abilitySkill;
        }
        setDir(input, sign(cx - c.x) || (cx < 640 ? 1 : -1));
        return true;
      }
    }

    for (const o of sim.players) {
      if (o === bot || !o.alive || areAllies(sim, bot, o)) continue;
      const above = bot.y - (o.y + o.h);
      if (o.vy > 60 && above > -10 && above < 170 && Math.abs(centerX(o) - cx) < 56) {
        if (abilityReady && (hero.abilityKind === 'frost_shield' || hero.abilityKind === 'gold_quake')) {
          input.abilityPressed = this.rand() < diff.abilitySkill;
        }
        setDir(input, sign(cx - centerX(o)) || bot.facing);
        return true;
      }
    }

    if (plat && plat.crumbleState === 'shaking') {
      const next = nearestSafePlatform(sim, cx, bot.y + bot.h, plat);
      if (next) {
        const tx = Math.max(next.x + 30, Math.min(next.x + next.w - 30, cx));
        setDir(input, sign(tx - cx));
        if (next.y < plat.y - 20 || Math.abs(tx - cx) > 60) this.pressJump(input);
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------- offense

  private engage(
    bot: CharacterEntity,
    sim: SimulationState,
    target: CharacterEntity,
    input: PlayerInputState,
    plat: PlatformState | null
  ) {
    const cx = centerX(bot);
    const tx = centerX(target) + this.aimOffset;
    const dx = tx - cx;
    const feet = bot.y + bot.h;
    const tFeet = target.y + target.h;
    const dy = tFeet - feet;

    if (bot.grounded) {
      if (dy < -50) {
        // Target is higher: get under its platform's edge and jump.
        const tPlat = currentPlatform(target, sim) ?? platformBelow(sim, centerX(target), tFeet - 4, 40);
        let goal = tx;
        if (tPlat && !tPlat.oneWay && cx > tPlat.x - 10 && cx < tPlat.x + tPlat.w + 10) {
          goal = cx - tPlat.x < tPlat.x + tPlat.w - cx ? tPlat.x - 30 : tPlat.x + tPlat.w + 30;
        }
        setDir(input, sign(goal - cx));
        if (Math.abs(goal - cx) < 200) {
          this.pressJump(input);
          input.upHeld = true;
        }
      } else if (dy > 50) {
        if (plat?.oneWay && Math.abs(dx) < 160) input.down = true;
        else setDir(input, sign(dx));
      } else {
        setDir(input, Math.abs(dx) > 8 ? sign(dx) : 0);
        if (Math.abs(dx) < 140 && Math.abs(dx) > 26 && target.grounded) {
          this.pressJump(input);
          input.upHeld = Math.abs(dx) > 80;
        }
      }
      return;
    }

    setDir(input, Math.abs(dx) > 10 ? sign(dx) : 0);
    input.upHeld = bot.vy < 0 && dy < 0;
    if (feet < target.y + 8 && Math.abs(dx) < 34 && bot.vy > -60) input.down = true;
    const jumpsLeft = bot.jumpsUsed < bot.maxJumps;
    if (dy < -30 && bot.vy > -80 && jumpsLeft && Math.abs(dx) < 240) {
      this.pressJump(input);
      input.upHeld = true;
    }
  }

  private heroTactics(
    bot: CharacterEntity,
    sim: SimulationState,
    target: CharacterEntity,
    input: PlayerInputState,
    diff: DifficultyProfile
  ) {
    if (bot.abilityCooldown > 0 || this.abilityLock > 0 || bot.stunTimer > 0) return;
    if (this.rand() > diff.abilitySkill * 0.35) return;
    const hero = getHeroDef(bot.heroId);
    const cx = centerX(bot);
    const dx = centerX(target) - cx;
    const dy = target.y + target.h - (bot.y + bot.h);
    const facingTarget = sign(dx) === bot.facing;
    const near = (r: number) =>
      sim.players.filter(
        (o) => o !== bot && o.alive && o.invulnTimer <= 0 && !areAllies(sim, bot, o) && Math.hypot(centerX(o) - cx, o.y - bot.y) < r
      ).length;
    const safeDash = (vx: number, vy: number) => predictLanding(bot, sim, bot.facing, { vx, vy }) !== null;

    let fire = false;
    switch (hero.abilityKind) {
      case 'high_spring':
        fire = bot.grounded && near(140) >= 1;
        break;
      case 'belly_dash':
        fire = Math.abs(dy) < 40 && Math.abs(dx) < 230 && facingTarget && safeDash(bot.facing * 760, -130);
        break;
      case 'wind_blink':
        fire = Math.abs(dy) < 60 && Math.abs(dx) < 175 && facingTarget && safeDash(bot.facing * 680, -230);
        break;
      case 'flame_burst':
        fire = near(165) >= 1;
        break;
      case 'frost_shield':
        fire = near(70) >= 1 && target.vy > 0 && dy < -10;
        break;
      case 'sky_hook':
        fire = false;
        break;
      case 'shadow_warp': {
        const landing = platformBelow(sim, cx + bot.facing * 165, bot.y + bot.h - 4, 260);
        fire = facingTarget && Math.abs(dx) > 90 && Math.abs(dx) < 240 && Math.abs(dy) < 80 && !!landing;
        break;
      }
      case 'gold_quake': {
        const below = platformBelow(sim, cx, bot.y + bot.h, 600);
        fire = bot.grounded
          ? near(130) >= 2
          : !!below && dy > 20 && Math.abs(dx) < 150 && below.crumbleState === 'solid';
        break;
      }
    }
    if (fire) input.abilityPressed = true;
  }

  // ---------------------------------------------------------------- idle / safety

  private reposition(
    bot: CharacterEntity,
    sim: SimulationState,
    input: PlayerInputState,
    plat: PlatformState | null,
    pers: PersonalityProfile
  ) {
    const home = homePlatform(sim);
    const cx = centerX(bot);
    if (!home) return;
    const onHome = plat === home;
    const goal = this.wanderX;
    if (Math.abs(goal - cx) > 40) setDir(input, sign(goal - cx));
    if (!onHome && bot.grounded && home.y < bot.y + bot.h - 30 && Math.abs(goal - cx) < 240) this.pressJump(input);
    if (!onHome && plat?.oneWay && home.y > plat.y + 20 && Math.abs(goal - cx) < 200) input.down = true;
    if (pers.chaos > 0 && this.rand() < 0.02) setDir(input, -dirOf(input) || 1);
  }

  private pressJump(input: PlayerInputState) {
    if (this.jumpLock > 0) return;
    input.jumpPressed = true;
    input.upHeld = true;
  }

  /** Last line of defence: never walk, drop, dive or dash into the abyss. */
  private applySafety(
    bot: CharacterEntity,
    sim: SimulationState,
    input: PlayerInputState,
    plat: PlatformState | null,
    pers: PersonalityProfile
  ) {
    const hero = getHeroDef(bot.heroId);
    const speed = PHYSICS.MOVE_SPEED * hero.stats.speedMult;
    let dir = dirOf(input);

    if (bot.grounded && plat) {
      if (input.down && plat.oneWay && !platformBelow(sim, centerX(bot), plat.y + plat.h + 4)) input.down = false;

      if (input.jumpPressed) {
        const jumpVy = PHYSICS.JUMP_VELOCITY * hero.stats.jumpMult;
        if (!predictLanding(bot, sim, dir, { vy: jumpVy, vx: dir * speed })) {
          if (predictLanding(bot, sim, 0, { vy: jumpVy, vx: 0 })) dir = 0;
          else input.jumpPressed = false;
        }
      }

      if (dir !== 0 && !input.jumpPressed) {
        const edge = distanceToDeadlyEdge(bot, sim, plat);
        const distToEdge = dir > 0 ? edge.right : edge.left;
        const brake = Math.abs(bot.vx) * 0.14 + pers.edgeCaution * 0.4 + bot.w / 2;
        if (distToEdge < brake) {
          const edgeX = dir > 0 ? plat.x + plat.w : plat.x - bot.w;
          const walkOff = predictLanding(bot, sim, dir, { vx: dir * speed, vy: 0, x: edgeX, y: bot.y });
          if (!walkOff) dir = 0;
        }
      }
      if (dir === 0 && bot.grounded && plat) {
        const edge = distanceToDeadlyEdge(bot, sim, plat);
        if (edge.left < bot.w / 2 + 6) dir = 1;
        else if (edge.right < bot.w / 2 + 6) dir = -1;
      }
    } else if (!bot.grounded) {
      const safe = this.safeAirDirs(bot, sim);
      if (safe.length > 0 && !safe.includes(dir)) dir = safe.includes(0) ? 0 : safe[0];
      if (input.down && !predictLanding(bot, sim, dir, { fastFall: true })) input.down = false;
    }

    if (input.abilityPressed && (hero.abilityKind === 'belly_dash' || hero.abilityKind === 'wind_blink')) {
      const vx = bot.facing * (hero.abilityKind === 'belly_dash' ? 760 : 680);
      if (!predictLanding(bot, sim, bot.facing, { vx, vy: -200 })) input.abilityPressed = false;
    }
    setDir(input, dir);
  }
}

/** Owns one brain per bot slot and produces their inputs each tick. */
export class BotDirector {
  private brains = new Map<number, BotBrain>();

  constructor(private readonly seed = 1) {}

  computeInputs(sim: SimulationState, into: Record<number, PlayerInputState> = {}) {
    for (const p of sim.players) {
      if (!p.isBot) continue;
      let brain = this.brains.get(p.slotIndex);
      if (!brain) {
        brain = new BotBrain(p.slotIndex, this.seed);
        this.brains.set(p.slotIndex, brain);
      }
      into[p.slotIndex] = brain.think(p, sim);
    }
    return into;
  }

  reset() {
    this.brains.clear();
  }
}
