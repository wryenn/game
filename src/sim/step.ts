import { updateCharacter } from './character';
import { resolveCharacterCollisions } from './combat';
import { EMPTY_INPUT, SIM_DT } from './constants';
import { updateHazards, updatePlatforms } from './hazards';
import { evaluateWinCondition } from './rules';
import { PlayerInputState, SimulationState } from './types';

export function hasCountdownClock(sim: SimulationState): boolean {
  return sim.mode === 'time' || !!sim.storyRule?.surviveSeconds;
}

/** Advances the simulation by exactly one fixed tick (1/60 s). Deterministic for identical inputs. */
export function stepSimulation(sim: SimulationState, inputsBySlot: Record<number, PlayerInputState>) {
  const dt = SIM_DT;
  sim.tick += 1;
  sim.trauma = Math.max(0, sim.trauma - dt * 1.8);
  if (sim.finished) return;

  if (sim.countdownSec > 0) {
    sim.countdownSec = Math.max(0, sim.countdownSec - dt);
    return;
  }
  if (sim.hitstopTimer > 0) {
    sim.hitstopTimer = Math.max(0, sim.hitstopTimer - dt);
    return;
  }

  sim.elapsedSec += dt;
  if (hasCountdownClock(sim)) sim.timeRemainingSec = Math.max(0, sim.timeRemainingSec - dt);

  updatePlatforms(sim, dt);
  updateHazards(sim, dt);
  for (const player of sim.players) {
    updateCharacter(player, inputsBySlot[player.slotIndex] ?? EMPTY_INPUT, sim, dt);
  }
  resolveCharacterCollisions(sim);
  evaluateWinCondition(sim);
}

/** Fixed-timestep accumulator used by real-time loops (client & server). */
export class FixedStepper {
  private acc = 0;
  constructor(private readonly maxStepsPerFrame = 8) {}

  /** Returns the number of ticks to run for `elapsedSec` wall-clock time, and leaves the remainder. */
  advance(elapsedSec: number): number {
    this.acc += Math.min(elapsedSec, 0.25);
    let steps = 0;
    while (this.acc >= SIM_DT && steps < this.maxStepsPerFrame) {
      this.acc -= SIM_DT;
      steps++;
    }
    if (steps === this.maxStepsPerFrame) this.acc = 0;
    return steps;
  }

  /** 0..1 interpolation factor between the previous and current tick. */
  get alpha(): number {
    return this.acc / SIM_DT;
  }

  reset() {
    this.acc = 0;
  }
}
