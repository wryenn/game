import { getHeroDef } from '../content/heroes';
import { createInitialPlatforms, getMapLayout } from '../content/maps';
import { ARENA_WIDTH, PHYSICS } from './constants';
import { hashSeed } from './rng';
import {
  AiDifficulty,
  CharacterEntity,
  GameModeId,
  HazardPhase,
  MapId,
  PlayerSlotConfig,
  SimulationState,
  StoryMatchRule,
} from './types';

export interface MatchConfig {
  mode: GameModeId;
  mapId: MapId;
  lives: number;
  roundDurationSec: number;
  botsEnabled: boolean;
  botDifficulty?: AiDifficulty;
  jumpCutEnabled?: boolean;
  countdownSec?: number;
  seed?: number;
}

export function usesLives(mode: GameModeId): boolean {
  return mode === 'ffa' || mode === 'team' || mode === 'story' || mode === 'saga';
}

export function isTeamBased(mode: GameModeId): boolean {
  return mode === 'team' || mode === 'story' || mode === 'saga';
}

export function createCharacter(
  slot: PlayerSlotConfig,
  idx: number,
  config: MatchConfig
): CharacterEntity {
  const layout = getMapLayout(config.mapId);
  const spawn = layout.spawnPoints[idx % layout.spawnPoints.length];
  const hero = getHeroDef(slot.heroId);
  const maxLives = usesLives(config.mode) ? config.lives : 99;
  return {
    slotIndex: slot.slotIndex,
    heroId: hero.id,
    name: slot.name,
    isBot: slot.kind === 'bot',
    aiPersonality: slot.aiPersonality,
    aiDifficulty: slot.aiDifficulty ?? config.botDifficulty ?? 'normal',
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
    quakeDiving: false,
    empoweredTimer: 0,
  };
}

export function createSimulation(
  config: MatchConfig,
  slots: PlayerSlotConfig[],
  storyRule: StoryMatchRule | null = null
): SimulationState {
  const activeSlots = slots.filter((slot) => {
    if (slot.kind === 'off') return false;
    if (slot.kind === 'bot' && !config.botsEnabled) return false;
    return true;
  });
  const finalSlots = activeSlots.length > 0 ? activeSlots : [slots[0]];
  const players = finalSlots.map((slot, idx) => createCharacter(slot, idx, config));
  const initialHazard: HazardPhase = storyRule?.defaultHazard ?? 'calm';

  return {
    tick: 0,
    rngState: config.seed ?? hashSeed(`${config.mapId}:${config.mode}:${players.length}`),
    mode: config.mode,
    mapId: config.mapId,
    elapsedSec: 0,
    timeRemainingSec:
      config.mode === 'time' ? config.roundDurationSec : storyRule?.surviveSeconds ?? 0,
    hitstopTimer: 0,
    trauma: 0,
    hazardPhase: initialHazard,
    hazardTimer: 6.5,
    windForce: initialHazard === 'wind_left' ? -165 : initialHazard === 'wind_right' ? 165 : 0,
    frictionFactor: initialHazard === 'slippery' ? 0.25 : 1,
    cannons: [],
    nextCannonId: 1,
    platforms: createInitialPlatforms(config.mapId),
    players,
    finished: false,
    winnerSlot: null,
    winnerTeam: null,
    winReason: '',
    pendingEvents: [],
    storyRule,
    jumpCutEnabled: config.jumpCutEnabled ?? true,
    countdownSec: config.countdownSec ?? 0,
  };
}

export function respawnCharacter(char: CharacterEntity, sim: SimulationState) {
  const layout = getMapLayout(sim.mapId);
  // Respawn at the spawn point furthest from living enemies to avoid spawn camping.
  let best = layout.spawnPoints[char.slotIndex % layout.spawnPoints.length];
  let bestScore = -Infinity;
  for (const sp of layout.spawnPoints) {
    let minDist = Infinity;
    for (const o of sim.players) {
      if (o === char || !o.alive) continue;
      minDist = Math.min(minDist, Math.hypot(o.x - sp.x, o.y - sp.y));
    }
    if (minDist > bestScore) {
      bestScore = minDist;
      best = sp;
    }
  }
  char.x = best.x;
  char.y = Math.max(40, best.y - 30);
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
  char.quakeDiving = false;
  char.empoweredTimer = 0;
}
