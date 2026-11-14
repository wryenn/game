import type { OnlineRoomState, PlayerInputState, RoundResult, SimulationState } from '../sim/types';
import {
  MatchStartPayload,
  NetSnapshot,
  PROTOCOL_VERSION,
  Profile,
  RoomSettings,
  SNAPSHOT_HZ,
  ServerMessage,
  encodeInput,
} from './protocol';
import { applySnapshot } from './snapshot';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed';

export interface OnlineCallbacks {
  onStatus?: (status: ConnectionStatus) => void;
  onRoom?: (room: OnlineRoomState | null) => void;
  onError?: (message: string) => void;
  onMatchStart?: (match: MatchStartPayload) => void;
  onMatchEnd?: (result: RoundResult) => void;
  onPing?: (ms: number) => void;
}

interface BufferedSnap {
  s: NetSnapshot;
  recv: number;
}

/** Interpolation delay: two snapshot intervals hides jitter while staying responsive. */
const RENDER_DELAY_MS = (1000 / SNAPSHOT_HZ) * 2;

export class OnlineClient {
  private ws: WebSocket | null = null;
  private seq = 0;
  private lastBits = -1;
  private lastSentAt = 0;
  private snaps: BufferedSnap[] = [];
  private pendingEvents: NetSnapshot['events'] = [];
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  peerId: string | null = null;
  room: OnlineRoomState | null = null;
  status: ConnectionStatus = 'idle';

  constructor(private cb: OnlineCallbacks = {}) {}

  setCallbacks(cb: OnlineCallbacks) {
    this.cb = cb;
  }

  get isHost(): boolean {
    return !!this.room && this.room.hostPeerId === this.peerId;
  }

  private setStatus(s: ConnectionStatus) {
    this.status = s;
    this.cb.onStatus?.(s);
  }

  connect(profile: Profile, url = OnlineClient.defaultUrl()): Promise<void> {
    if (this.ws && this.status === 'connected') {
      this.send({ t: 'profile', profile });
      return Promise.resolve();
    }
    this.setStatus('connecting');
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Sunucuya bağlanılamadı'));
      }, 8000);
      ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION, profile }));
      ws.onmessage = (ev) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (msg.t === 'welcome') {
          clearTimeout(timeout);
          this.peerId = msg.peerId;
          this.setStatus('connected');
          this.startPing();
          resolve();
        }
        this.handle(msg);
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Bağlantı hatası'));
      };
      ws.onclose = () => {
        clearTimeout(timeout);
        this.stopPing();
        this.ws = null;
        this.room = null;
        this.cb.onRoom?.(null);
        this.setStatus('closed');
      };
    });
  }

  static defaultUrl(): string {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => this.send({ t: 'ping', ts: performance.now() }), 2000);
  }

  private stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private handle(msg: ServerMessage) {
    switch (msg.t) {
      case 'room':
        this.room = msg.room;
        this.cb.onRoom?.(msg.room);
        break;
      case 'error':
        this.cb.onError?.(msg.message);
        break;
      case 'match_start':
        this.snaps = [];
        this.pendingEvents = [];
        this.seq = 0;
        this.lastBits = -1;
        this.cb.onMatchStart?.(msg.match);
        break;
      case 'snap':
        this.snaps.push({ s: msg.s, recv: performance.now() });
        this.pendingEvents.push(...msg.s.events);
        if (this.snaps.length > 30) this.snaps.splice(0, this.snaps.length - 30);
        break;
      case 'match_end':
        this.cb.onMatchEnd?.(msg.result);
        break;
      case 'pong':
        this.cb.onPing?.(Math.round(performance.now() - msg.ts));
        break;
    }
  }

  private send(msg: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  createRoom(settings: RoomSettings) {
    this.send({ t: 'create', settings });
  }

  joinRoom(code: string) {
    this.send({ t: 'join', code: code.trim().toUpperCase() });
  }

  leaveRoom() {
    this.send({ t: 'leave' });
    this.room = null;
  }

  updateProfile(profile: Profile) {
    this.send({ t: 'profile', profile });
  }

  updateSettings(settings: RoomSettings) {
    this.send({ t: 'settings', settings });
  }

  startMatch() {
    this.send({ t: 'start' });
  }

  /** Sends local input when it changes, on presses, and as a 4 Hz keep-alive. */
  sendInput(input: PlayerInputState) {
    const bits = encodeInput(input);
    const now = performance.now();
    const pressed = input.jumpPressed || input.abilityPressed;
    if (bits === this.lastBits && !pressed && now - this.lastSentAt < 250) return;
    this.lastBits = bits;
    this.lastSentAt = now;
    this.send({ t: 'input', seq: ++this.seq, bits });
  }

  /** Writes the interpolated server state into the local render sim. Returns false until data arrives. */
  sampleInto(sim: SimulationState, now = performance.now()): boolean {
    if (this.snaps.length === 0) return false;
    const target = now - RENDER_DELAY_MS;
    let a: BufferedSnap | null = null;
    let b: BufferedSnap = this.snaps[this.snaps.length - 1];
    for (let i = this.snaps.length - 1; i > 0; i--) {
      if (this.snaps[i - 1].recv <= target) {
        a = this.snaps[i - 1];
        b = this.snaps[i];
        break;
      }
    }
    const t = a ? Math.max(0, Math.min(1, (target - a.recv) / Math.max(1, b.recv - a.recv))) : 1;
    applySnapshot(sim, a?.s ?? null, b.s, t);
    if (this.pendingEvents.length > 0) {
      sim.pendingEvents.push(...this.pendingEvents);
      this.pendingEvents = [];
    }
    return true;
  }

  disconnect() {
    this.stopPing();
    this.ws?.close();
    this.ws = null;
  }
}
