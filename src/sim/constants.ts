export const ARENA_WIDTH = 1280;
export const ARENA_HEIGHT = 720;

/** Simulation always advances in fixed 60 Hz ticks, independent of display refresh rate. */
export const SIM_HZ = 60;
export const SIM_DT = 1 / SIM_HZ;

export const PHYSICS = {
  GRAVITY: 1580,
  MAX_FALL_SPEED: 880,
  FAST_FALL_ACCEL: 2450,
  FAST_FALL_MAX: 1080,
  MOVE_SPEED: 355,
  GROUND_ACCEL: 2600,
  GROUND_DECEL: 2250,
  AIR_ACCEL: 1750,
  AIR_DECEL: 580,
  JUMP_VELOCITY: -620,
  DOUBLE_JUMP_VELOCITY: -565,
  JUMP_CUT_MULTIPLIER: 0.52,
  COYOTE_TIME: 0.11,
  JUMP_BUFFER: 0.13,
  STOMP_BOUNCE_VELOCITY: -610,
  STOMP_VICTIM_DOWN_IMPULSE: 250,
  STOMP_STUN_DURATION: 0.95,
  STOMP_PANCAKE_DURATION: 0.58,
  STOMP_KNOCKBACK_X: 300,
  BUMP_MIN_IMPULSE_X: 280,
  BUMP_IMPULSE_Y: -220,
  WALL_BOUNCE_RESTITUTION: 0.72,
  RESPAWN_DELAY: 1.5,
  SPAWN_INVULN: 1.5,
  KILL_CREDIT_WINDOW: 4.5,
  CHAR_WIDTH: 40,
  CHAR_HEIGHT: 52,
  STOMP_POINTS: 10,
  KO_POINTS: 25,
} as const;

export const KILL_PLANE = {
  bottom: ARENA_HEIGHT + 90,
  left: -110,
  right: ARENA_WIDTH + 110,
} as const;

export const EMPTY_INPUT = {
  left: false,
  right: false,
  upHeld: false,
  jumpPressed: false,
  down: false,
  abilityPressed: false,
} as const;
