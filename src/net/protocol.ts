import { z } from 'zod';
import type { AiDifficulty, GameEvent, PlayerInputState, PlayerSlotConfig, RoundResult } from '../sim/types';
import type { MatchConfig } from '../sim/world';

export const PROTOCOL_VERSION = 2;
export const MAX_MESSAGE_BYTES = 4096;
export const SNAPSHOT_HZ = 30;

const colorIds = ['crimson', 'cobalt', 'emerald', 'amber', 'plum', 'tangerine', 'turquoise', 'gold_pasha', 'shadow_obsidian'] as const;
const fesIds = ['klasik_fes', 'puskullu_fes', 'yeniceri_bork', 'saray_kavuk', 'sultan_taci', 'denizci_bere', 'altin_migfer'] as const;
const mustacheIds = ['kaytan', 'pala', 'burgu', 'cember', 'sultan_sakal'] as const;
const accessoryIds = ['yok', 'pelerin', 'kalkan', 'gozluk', 'kanat', 'hale'] as const;
export const heroIds = ['pofi', 'tiknaz', 'zeynep', 'kizil_bey', 'karahan', 'leyla', 'karanlik', 'altin_hakan'] as const;
/** Story maps are excluded: online play uses the arena maps & modes only. */
export const onlineMapIds = ['classic', 'towers', 'crumbling', 'hazard'] as const;
export const onlineModeIds = ['ffa', 'team', 'time', 'chaos'] as const;
const difficultyIds = ['easy', 'normal', 'hard', 'master'] as const;

export const costumeSchema = z.object({
  colorId: z.enum(colorIds),
  fesStyle: z.enum(fesIds),
  mustacheStyle: z.enum(mustacheIds),
  accessoryId: z.enum(accessoryIds).optional(),
});

export const nameSchema = z
  .string()
  .transform((s) => s.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16))
  .refine((s) => s.length > 0, 'İsim boş olamaz');

export const profileSchema = z.object({
  name: nameSchema,
  heroId: z.enum(heroIds),
  costume: costumeSchema,
});

export const roomSettingsSchema = z.object({
  mode: z.enum(onlineModeIds),
  mapId: z.enum(onlineMapIds),
  lives: z.number().int().min(1).max(9),
  roundDurationSec: z.number().int().min(30).max(600),
  botsEnabled: z.boolean(),
  botDifficulty: z.enum(difficultyIds),
});

export type RoomSettings = z.infer<typeof roomSettingsSchema>;
export type Profile = z.infer<typeof profileSchema>;

export const clientMessageSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('hello'), v: z.number().int(), profile: profileSchema }),
  z.object({ t: z.literal('create'), settings: roomSettingsSchema }),
  z.object({ t: z.literal('join'), code: z.string().regex(/^[A-Z0-9]{6}$/) }),
  z.object({ t: z.literal('leave') }),
  z.object({ t: z.literal('profile'), profile: profileSchema }),
  z.object({ t: z.literal('settings'), settings: roomSettingsSchema }),
  z.object({ t: z.literal('start') }),
  z.object({ t: z.literal('return_lobby') }),
  z.object({ t: z.literal('input'), seq: z.number().int().nonnegative(), bits: z.number().int().min(0).max(63) }),
  z.object({ t: z.literal('ping'), ts: z.number() }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export interface NetPlayerState {
  slotIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  alive: boolean;
  eliminated: boolean;
  lives: number;
  score: number;
  kills: number;
  deaths: number;
  stomps: number;
  jumpsMade: number;
  stunTimer: number;
  pancakeTimer: number;
  invulnTimer: number;
  shieldTimer: number;
  abilityCooldown: number;
  respawnTimer: number;
  squashX: number;
  squashY: number;
  airTilt: number;
  walkCycle: number;
  tasselAngle: number;
  jiggleAmp: number;
  jigglePhase: number;
  blinkTimer: number;
  flashTimer: number;
  quakeDiving: boolean;
  empoweredTimer: number;
}

export interface NetSnapshot {
  tick: number;
  ack: number;
  elapsedSec: number;
  timeRemainingSec: number;
  countdownSec: number;
  hazardPhase: import('../sim/types').HazardPhase;
  windForce: number;
  frictionFactor: number;
  trauma: number;
  cannons: import('../sim/types').CannonStrike[];
  platforms: { id: string; x: number; y: number; c: 0 | 1 | 2 }[];
  players: NetPlayerState[];
  events: GameEvent[];
}

export interface MatchStartPayload {
  config: MatchConfig;
  slots: PlayerSlotConfig[];
  yourSlot: number;
}

export type ServerMessage =
  | { t: 'welcome'; peerId: string; v: number }
  | { t: 'room'; room: import('../sim/types').OnlineRoomState | null }
  | { t: 'error'; message: string }
  | { t: 'match_start'; match: MatchStartPayload }
  | { t: 'snap'; s: NetSnapshot }
  | { t: 'match_end'; result: RoundResult }
  | { t: 'pong'; ts: number; serverTime: number };

const INPUT_BITS: (keyof PlayerInputState)[] = ['left', 'right', 'upHeld', 'jumpPressed', 'down', 'abilityPressed'];

export function encodeInput(input: PlayerInputState): number {
  let bits = 0;
  INPUT_BITS.forEach((k, i) => {
    if (input[k]) bits |= 1 << i;
  });
  return bits;
}

export function decodeInput(bits: number): PlayerInputState {
  const out = {} as PlayerInputState;
  INPUT_BITS.forEach((k, i) => {
    out[k] = (bits & (1 << i)) !== 0;
  });
  return out;
}

export function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > MAX_MESSAGE_BYTES) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const res = clientMessageSchema.safeParse(data);
  return res.success ? res.data : null;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  mode: 'ffa',
  mapId: 'classic',
  lives: 3,
  roundDurationSec: 120,
  botsEnabled: true,
  botDifficulty: 'normal' satisfies AiDifficulty,
};
