import { BotDirector } from '../../ai/brain';
import { soundEngine } from '../../audio/sound';
import { InputHub } from '../../input/input';
import { OnlineClient } from '../../net/client';
import { CastleRenderer } from '../../render/renderer';
import { FixedStepper, buildHudSnapshot, buildRoundResult, stepSimulation } from '../../sim';
import { GameEvent, GameSettings, HudSnapshot, PlayerInputState, RoundResult, SimulationState } from '../../sim/types';

export type SessionKind = 'local' | 'online' | 'attract';

export interface SessionOptions {
  kind: SessionKind;
  sim: SimulationState;
  settings: GameSettings;
  input: InputHub;
  /** Online only: the slot controlled by this client. */
  localSlot?: number;
  online?: OnlineClient;
  onHud?: (hud: HudSnapshot, sim: SimulationState) => void;
  onFinished?: (result: RoundResult) => void;
}

interface Latch {
  jump: boolean;
  ability: boolean;
}

export function playEventSounds(events: GameEvent[]) {
  for (const ev of events) {
    if (ev.type === 'jump') soundEngine.playJump(false);
    else if (ev.type === 'double_jump' || ev.type === 'ability') soundEngine.playJump(true);
    else if (ev.type === 'stomp' || ev.type === 'quake_land') soundEngine.playStomp();
    else if (ev.type === 'bump' || ev.type === 'shield_block') soundEngine.playBump();
    else if (ev.type === 'ko') soundEngine.playKO();
    else if (ev.type === 'cannon') soundEngine.playCannon();
  }
}

/**
 * Owns the frame loop for one match. Simulation advances in fixed 60 Hz ticks regardless of the
 * display refresh rate; rendering interpolates between the last two ticks.
 */
export class GameSession {
  readonly sim: SimulationState;
  private renderer = new CastleRenderer();
  private director: BotDirector;
  private stepper = new FixedStepper();
  private raf = 0;
  private last = 0;
  private time = 0;
  private hudAcc = 0;
  private paused = false;
  private finishedReported = false;
  private latches = new Map<number, Latch>();
  private prevPos = new Map<number, { x: number; y: number }>();
  private canvas: HTMLCanvasElement | null = null;

  constructor(private opts: SessionOptions) {
    this.sim = opts.sim;
    this.director = new BotDirector(opts.sim.rngState);
  }

  updateSettings(settings: GameSettings) {
    this.opts.settings = settings;
  }

  setPaused(paused: boolean) {
    if (this.opts.kind === 'online') return;
    this.paused = paused;
    this.opts.input.clearAll();
    this.latches.clear();
  }

  get isPaused() {
    return this.paused;
  }

  start(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer.resetParticles();
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private humanSlots(): number[] {
    return this.sim.players.filter((p) => !p.isBot).map((p) => p.slotIndex);
  }

  private readInputs(): Record<number, PlayerInputState> {
    const humans = this.humanSlots();
    const single = humans.length === 1;
    const out: Record<number, PlayerInputState> = {};
    for (const slot of humans) {
      const raw = this.opts.input.readPlayerInput(slot, single, this.opts.settings.controls);
      const latch = this.latches.get(slot) ?? { jump: false, ability: false };
      latch.jump = latch.jump || !!raw.jumpPressed;
      latch.ability = latch.ability || !!raw.abilityPressed;
      this.latches.set(slot, latch);
      out[slot] = raw;
    }
    this.opts.input.endFrame();
    return out;
  }

  private frame(now: number) {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const sim = this.sim;
    let events: GameEvent[] = [];

    if (this.opts.kind === 'online' && this.opts.online) {
      const raw = this.opts.input.readPlayerInput(0, true, this.opts.settings.controls);
      this.opts.input.endFrame();
      this.opts.online.sendInput(raw);
      sim.pendingEvents = [];
      this.opts.online.sampleInto(sim);
      events = sim.pendingEvents;
      this.prevPos.clear();
    } else if (!this.paused) {
      const held = this.opts.kind === 'attract' ? {} : this.readInputs();
      const steps = this.stepper.advance(dt);
      for (let i = 0; i < steps && !sim.finished; i++) {
        for (const p of sim.players) this.prevPos.set(p.slotIndex, { x: p.x, y: p.y });
        const inputs: Record<number, PlayerInputState> = {};
        for (const [slot, input] of Object.entries(held)) {
          const latch = this.latches.get(Number(slot));
          inputs[Number(slot)] = { ...input, jumpPressed: !!latch?.jump, abilityPressed: !!latch?.ability };
          if (latch) latch.jump = latch.ability = false;
        }
        this.director.computeInputs(sim, inputs);
        stepSimulation(sim, inputs);
        events.push(...sim.pendingEvents);
        sim.pendingEvents = [];
      }
      if (this.opts.kind === 'attract' && sim.finished) {
        this.prevPos.clear();
      }
    }

    if (this.opts.kind !== 'attract') playEventSounds(events);
    this.renderer.consumeEvents(events);
    this.renderer.updateParticles(dt);
    this.draw();

    this.hudAcc += dt;
    if (this.hudAcc >= 0.1 || sim.finished) {
      this.hudAcc = 0;
      this.opts.onHud?.(buildHudSnapshot(sim), sim);
    }
    if (sim.finished && !this.finishedReported && this.opts.kind === 'local') {
      this.finishedReported = true;
      this.opts.onFinished?.(buildRoundResult(sim));
    }
  }

  private draw() {
    const canvas = this.canvas;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const alpha = this.stepper.alpha;
    const saved: { x: number; y: number }[] = [];
    for (const p of this.sim.players) {
      saved.push({ x: p.x, y: p.y });
      const prev = this.prevPos.get(p.slotIndex);
      if (prev && Math.hypot(prev.x - p.x, prev.y - p.y) < 80) {
        p.x = prev.x + (p.x - prev.x) * alpha;
        p.y = prev.y + (p.y - prev.y) * alpha;
      }
    }
    const shake = this.opts.settings.accessibility?.screenShake ?? 1;
    const trauma = this.sim.trauma;
    this.sim.trauma = trauma * shake;
    this.renderer.render(ctx, w, h, this.sim, this.time, this.opts.kind === 'attract');
    this.sim.trauma = trauma;
    this.sim.players.forEach((p, i) => {
      p.x = saved[i].x;
      p.y = saved[i].y;
    });
  }
}
