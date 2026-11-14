import { rankPlayers } from './rules';
import { CharacterEntity, HudPlayerSummary, HudSnapshot, RoundResult, SimulationState } from './types';

function summarize(p: CharacterEntity): HudPlayerSummary {
  return {
    slotIndex: p.slotIndex,
    heroId: p.heroId,
    name: p.name,
    isBot: p.isBot,
    team: p.team,
    colorId: p.costume.colorId,
    costume: p.costume,
    lives: p.lives,
    maxLives: p.maxLives,
    score: p.score,
    kills: p.kills,
    deaths: p.deaths,
    stomps: p.stomps,
    jumpsMade: p.jumpsMade,
    alive: p.alive,
    eliminated: p.eliminated,
    stunned: p.stunTimer > 0,
    shielded: p.shieldTimer > 0,
    abilityCooldown: p.abilityCooldown,
    abilityMaxCooldown: p.abilityMaxCooldown,
  };
}

export function storyObjectiveText(sim: SimulationState): string | undefined {
  const rule = sim.storyRule;
  if (!rule) return undefined;
  const hero = sim.players[0];
  if (rule.targetStomps) return `${rule.objectiveLabel} (${hero.stomps}/${rule.targetStomps})`;
  if (rule.targetScore) return `${rule.objectiveLabel} (${hero.score}/${rule.targetScore})`;
  if (rule.surviveSeconds) return `${rule.objectiveLabel} (${Math.ceil(sim.timeRemainingSec)}s)`;
  return rule.objectiveLabel;
}

export function buildHudSnapshot(sim: SimulationState): HudSnapshot {
  return {
    countdownSec: sim.countdownSec,
    mode: sim.mode,
    mapId: sim.mapId,
    elapsedSec: sim.elapsedSec,
    timeRemainingSec: sim.timeRemainingSec,
    aliveCount: sim.players.filter((p) => !p.eliminated).length,
    hazardPhase: sim.hazardPhase,
    storyObjective: storyObjectiveText(sim),
    players: sim.players.map(summarize),
  };
}

export function buildRoundResult(sim: SimulationState): RoundResult {
  const ranked = rankPlayers(sim.players);
  const winnerSlot = sim.winnerSlot ?? ranked[0]?.slotIndex ?? null;
  const heroWon = !!sim.players[0] && winnerSlot === sim.players[0].slotIndex;
  return {
    mode: sim.mode,
    mapId: sim.mapId,
    durationSec: sim.elapsedSec,
    winnerSlot,
    winnerTeam: sim.winnerTeam,
    winReason: sim.winReason || (ranked[0] ? `${ranked[0].name} ${ranked[0].score} puan ile zirvede!` : 'Bitti!'),
    standings: ranked.map((p) => ({ ...summarize(p), stunned: false, shielded: false })),
    storyChapterId: sim.mode === 'story' ? sim.storyRule?.chapterId : undefined,
    storyWon: sim.mode === 'story' && heroWon,
    sagaLevelId: sim.mode === 'saga' && sim.storyRule ? sim.storyRule.chapterId - 100 : undefined,
    sagaWon: sim.mode === 'saga' && heroWon,
  };
}
