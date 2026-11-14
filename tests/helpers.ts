import { DEFAULT_SLOTS } from '../src/content/constants';
import { createSimulation } from '../src/sim';
import { HeroId, PlayerInputState, PlayerSlotConfig } from '../src/sim/types';
import { MatchConfig } from '../src/sim/world';

export const idle: PlayerInputState = { left: false, right: false, upHeld: false, jumpPressed: false, down: false, abilityPressed: false };

export function slots(heroes: HeroId[], kinds: PlayerSlotConfig['kind'][] = ['human', 'bot', 'bot', 'bot']): PlayerSlotConfig[] {
  return DEFAULT_SLOTS.map((s, i) => ({ ...s, heroId: heroes[i] ?? s.heroId, kind: kinds[i] ?? 'off', costume: { ...s.costume } }));
}

export function sim(config: Partial<MatchConfig> = {}, s = slots(['pofi', 'tiknaz', 'zeynep', 'leyla'])) {
  return createSimulation(
    { mode: 'ffa', mapId: 'classic', lives: 3, roundDurationSec: 120, botsEnabled: true, countdownSec: 0, seed: 42, ...config },
    s
  );
}
