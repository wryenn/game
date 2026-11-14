/**
 * Headless balance & AI report.
 *   bun run balance [--matches 400] [--difficulty normal] [--personality balanced] [--map all]
 */
import { BotDirector } from '../src/ai/brain';
import { DEFAULT_SLOTS } from '../src/content/constants';
import { HEROES } from '../src/content/heroes';
import { createSimulation, stepSimulation } from '../src/sim';
import { hashSeed } from '../src/sim/rng';
import { AiDifficulty, AiPersonality, HeroId, MapId, PlayerSlotConfig } from '../src/sim/types';

export interface BalanceOptions {
  matches: number;
  difficulty: AiDifficulty;
  personality: AiPersonality | 'mixed';
  maps: MapId[];
  maxSeconds: number;
}

export interface HeroStats {
  games: number;
  wins: number;
  kos: number;
  deaths: number;
  selfKos: number;
}

export interface BalanceReport {
  heroes: Record<string, HeroStats>;
  maps: Record<string, { games: number; deaths: number; selfKos: number; airTicks: number; aliveTicks: number; timeouts: number }>;
}

const PERSONALITIES: AiPersonality[] = ['aggressive', 'defensive', 'balanced', 'chaotic', 'opportunist'];
export const ARENA_MAPS: MapId[] = ['classic', 'towers', 'crumbling', 'hazard'];

export function runBalance(opts: BalanceOptions): BalanceReport {
  const heroIds = HEROES.map((h) => h.id);
  const report: BalanceReport = { heroes: {}, maps: {} };
  for (const id of heroIds) report.heroes[id] = { games: 0, wins: 0, kos: 0, deaths: 0, selfKos: 0 };

  for (let m = 0; m < opts.matches; m++) {
    const seed = hashSeed(`balance-${m}`);
    const mapId = opts.maps[m % opts.maps.length];
    // Rotate heroes so each appears equally often against varied opponents.
    const picks: HeroId[] = [];
    for (let i = 0; i < 4; i++) picks.push(heroIds[(m * 3 + i * (1 + (m % 7))) % heroIds.length]);
    const unique = Array.from(new Set(picks));
    while (unique.length < 4) unique.push(heroIds.find((h) => !unique.includes(h))!);

    const slots: PlayerSlotConfig[] = unique.map((heroId, i) => ({
      ...DEFAULT_SLOTS[i],
      kind: 'bot',
      heroId,
      aiDifficulty: opts.difficulty,
      aiPersonality: opts.personality === 'mixed' ? PERSONALITIES[(m + i) % PERSONALITIES.length] : opts.personality,
    }));
    const sim = createSimulation(
      { mode: 'ffa', mapId, lives: 3, roundDurationSec: 120, botsEnabled: true, seed },
      slots
    );
    const director = new BotDirector(seed);
    const mapStats = (report.maps[mapId] ??= { games: 0, deaths: 0, selfKos: 0, airTicks: 0, aliveTicks: 0, timeouts: 0 });
    mapStats.games++;
    const maxTicks = opts.maxSeconds * 60;
    while (!sim.finished && sim.tick < maxTicks) {
      stepSimulation(sim, director.computeInputs(sim));
      for (const p of sim.players) {
        if (!p.alive) continue;
        mapStats.aliveTicks++;
        if (!p.grounded) mapStats.airTicks++;
      }
      for (const ev of sim.pendingEvents) {
        if (ev.type !== 'ko' || ev.slotIndex === undefined) continue;
        const victim = sim.players.find((p) => p.slotIndex === ev.slotIndex)!;
        mapStats.deaths++;
        if (ev.victimSlot === undefined) {
          mapStats.selfKos++;
          report.heroes[victim.heroId].selfKos++;
        }
      }
      sim.pendingEvents.length = 0;
    }
    if (!sim.finished) mapStats.timeouts++;
    const winner = sim.finished ? sim.winnerSlot : null;
    for (const p of sim.players) {
      const h = report.heroes[p.heroId];
      h.games++;
      h.kos += p.kills;
      h.deaths += p.deaths;
      if (p.slotIndex === winner) h.wins++;
    }
  }
  return report;
}

function pct(n: number, d: number) {
  return d === 0 ? '  -  ' : `${((100 * n) / d).toFixed(1).padStart(5)}%`;
}

export function formatReport(r: BalanceReport): string {
  const lines = ['Hero            games   win%   K/D   self-KO%'];
  const rows = Object.entries(r.heroes).sort((a, b) => b[1].wins / b[1].games - a[1].wins / a[1].games);
  for (const [id, h] of rows) {
    lines.push(
      `${id.padEnd(14)} ${String(h.games).padStart(6)} ${pct(h.wins, h.games)} ${(h.kos / Math.max(1, h.deaths)).toFixed(2).padStart(5)} ${pct(h.selfKos, h.deaths)}`
    );
  }
  lines.push('', 'Map            games  self-KO%   air%  timeouts');
  for (const [id, m] of Object.entries(r.maps)) {
    lines.push(
      `${id.padEnd(14)} ${String(m.games).padStart(5)}  ${pct(m.selfKos, m.deaths)}  ${pct(m.airTicks, m.aliveTicks)}  ${m.timeouts}`
    );
  }
  return lines.join('\n');
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const arg = (name: string, def: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
  };
  const mapArg = arg('map', 'all');
  const opts: BalanceOptions = {
    matches: Number(arg('matches', '400')),
    difficulty: arg('difficulty', 'normal') as AiDifficulty,
    personality: arg('personality', 'balanced') as AiPersonality | 'mixed',
    maps: mapArg === 'all' ? ARENA_MAPS : (mapArg.split(',') as MapId[]),
    maxSeconds: Number(arg('seconds', '180')),
  };
  const t0 = performance.now();
  console.log(formatReport(runBalance(opts)));
  console.log(`\n${opts.matches} matches in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
}
