import { randomBytes } from 'crypto';
import { WebSocket } from 'ws';
import { BotDirector } from '../src/ai/brain';
import { DEFAULT_SLOTS } from '../src/content/constants';
import { FixedStepper, buildRoundResult, createSimulation, stepSimulation } from '../src/sim';
import { hashSeed } from '../src/sim/rng';
import { GameEvent, OnlineRoomState, PlayerInputState, PlayerSlotConfig, SimulationState } from '../src/sim/types';
import { MatchConfig } from '../src/sim/world';
import { Profile, RoomSettings, ServerMessage, SNAPSHOT_HZ, decodeInput } from '../src/net/protocol';
import { serializeSnapshot } from '../src/net/snapshot';

export const MAX_PEERS = 4;
export const ROOM_IDLE_TTL_MS = 30 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface Peer {
  id: string;
  ws: WebSocket;
  profile: Profile | null;
  room: Room | null;
  slotIndex: number;
  inputBits: number;
  inputSeq: number;
  latchedJump: boolean;
  latchedAbility: boolean;
}

export function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

export function makeRoomCode(exists: (code: string) => boolean): string {
  for (;;) {
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    if (!exists(code)) return code;
  }
}

class Match {
  readonly sim: SimulationState;
  private director: BotDirector;
  private stepper = new FixedStepper(10);
  private timer: ReturnType<typeof setInterval>;
  private last = performance.now();
  private events: GameEvent[] = [];
  private ended = false;

  constructor(private room: Room, config: MatchConfig, readonly slots: PlayerSlotConfig[]) {
    this.sim = createSimulation(config, slots);
    this.director = new BotDirector(config.seed ?? 1);
    this.timer = setInterval(() => this.pump(), 1000 / 60);
  }

  private pump() {
    const now = performance.now();
    const steps = this.stepper.advance((now - this.last) / 1000);
    this.last = now;
    const ticksPerSnap = Math.round(60 / SNAPSHOT_HZ);
    for (let i = 0; i < steps; i++) {
      const inputs: Record<number, PlayerInputState> = {};
      for (const peer of this.room.peers.values()) {
        const ch = this.sim.players.find((p) => p.slotIndex === peer.slotIndex);
        if (!ch || ch.isBot) continue;
        const input = decodeInput(peer.inputBits);
        input.jumpPressed = peer.latchedJump;
        input.abilityPressed = peer.latchedAbility;
        peer.latchedJump = false;
        peer.latchedAbility = false;
        inputs[peer.slotIndex] = input;
      }
      this.director.computeInputs(this.sim, inputs);
      stepSimulation(this.sim, inputs);
      this.events.push(...this.sim.pendingEvents);
      this.sim.pendingEvents.length = 0;
      if (this.sim.tick % ticksPerSnap === 0 || this.sim.finished) this.broadcastSnapshot();
      if (this.sim.finished && !this.ended) {
        this.ended = true;
        const result = buildRoundResult(this.sim);
        setTimeout(() => this.room.endMatch(result), 1200);
      }
    }
  }

  private broadcastSnapshot() {
    this.sim.pendingEvents = this.events;
    for (const peer of this.room.peers.values()) {
      send(peer.ws, { t: 'snap', s: serializeSnapshot(this.sim, peer.inputSeq) });
    }
    this.sim.pendingEvents = [];
    this.events = [];
  }

  /** A human left mid-match: a bot takes over their character so the match stays fair for others. */
  handOverToBot(slotIndex: number) {
    const ch = this.sim.players.find((p) => p.slotIndex === slotIndex);
    if (ch) ch.isBot = true;
  }

  stop() {
    clearInterval(this.timer);
  }
}

export class Room {
  readonly peers = new Map<string, Peer>();
  hostPeerId: string;
  match: Match | null = null;
  lastActivity = Date.now();

  constructor(readonly code: string, host: Peer, public settings: RoomSettings) {
    this.hostPeerId = host.id;
    this.add(host);
  }

  get full() {
    return this.peers.size >= MAX_PEERS;
  }

  add(peer: Peer): boolean {
    if (this.full) return false;
    const used = new Set([...this.peers.values()].map((p) => p.slotIndex));
    let slot = 0;
    while (used.has(slot)) slot++;
    peer.slotIndex = slot;
    peer.room = this;
    peer.inputBits = 0;
    this.peers.set(peer.id, peer);
    this.touch();
    this.broadcastState();
    return true;
  }

  remove(peer: Peer) {
    if (!this.peers.delete(peer.id)) return;
    peer.room = null;
    this.match?.handOverToBot(peer.slotIndex);
    if (this.hostPeerId === peer.id) {
      const next = this.peers.values().next().value as Peer | undefined;
      if (next) this.hostPeerId = next.id;
    }
    if (this.peers.size === 0) this.dispose();
    else this.broadcastState();
  }

  touch() {
    this.lastActivity = Date.now();
  }

  toState(): OnlineRoomState {
    return {
      code: this.code,
      hostPeerId: this.hostPeerId,
      ...this.settings,
      inGame: !!this.match,
      peers: [...this.peers.values()].map((p) => ({
        peerId: p.id,
        slotIndex: p.slotIndex,
        name: p.profile?.name ?? 'Oyuncu',
        heroId: p.profile?.heroId ?? 'pofi',
        costume: p.profile?.costume ?? DEFAULT_SLOTS[p.slotIndex].costume,
        isHost: p.id === this.hostPeerId,
      })),
    };
  }

  broadcast(msg: ServerMessage) {
    for (const p of this.peers.values()) send(p.ws, msg);
  }

  broadcastState() {
    this.broadcast({ t: 'room', room: this.toState() });
  }

  buildSlots(): PlayerSlotConfig[] {
    return [0, 1, 2, 3].map((slotIndex) => {
      const fallback = DEFAULT_SLOTS[slotIndex];
      const team = slotIndex % 2 === 0 ? 'A' : 'B';
      const peer = [...this.peers.values()].find((p) => p.slotIndex === slotIndex);
      if (peer?.profile) {
        return {
          ...fallback,
          slotIndex,
          kind: 'human',
          team,
          name: peer.profile.name,
          heroId: peer.profile.heroId,
          costume: { ...peer.profile.costume },
        };
      }
      return {
        ...fallback,
        team,
        kind: this.settings.botsEnabled ? 'bot' : 'off',
        aiDifficulty: this.settings.botDifficulty,
      };
    });
  }

  start(): string | null {
    if (this.match) return 'Maç zaten sürüyor';
    const humans = this.peers.size;
    if (humans < 2 && !this.settings.botsEnabled) return 'En az 2 oyuncu veya botlar gerekli';
    const slots = this.buildSlots();
    const config: MatchConfig = {
      ...this.settings,
      jumpCutEnabled: true,
      countdownSec: 3,
      seed: hashSeed(`${this.code}:${Date.now()}`),
    };
    this.match = new Match(this, config, slots);
    for (const p of this.peers.values()) {
      send(p.ws, { t: 'match_start', match: { config, slots, yourSlot: p.slotIndex } });
    }
    this.broadcastState();
    return null;
  }

  endMatch(result: ReturnType<typeof buildRoundResult>) {
    if (!this.match) return;
    this.match.stop();
    this.match = null;
    this.broadcast({ t: 'match_end', result });
    this.broadcastState();
  }

  dispose() {
    this.match?.stop();
    this.match = null;
    this.onDispose?.(this);
  }

  onDispose?: (room: Room) => void;
}
