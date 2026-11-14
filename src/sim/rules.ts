import { CharacterEntity, SimulationState, TeamId } from './types';

export function rankPlayers(players: CharacterEntity[]): CharacterEntity[] {
  return [...players].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.kills !== a.kills) return b.kills - a.kills;
    if (a.deaths !== b.deaths) return a.deaths - b.deaths;
    if (b.stomps !== a.stomps) return b.stomps - a.stomps;
    return b.lives - a.lives;
  });
}

function finish(sim: SimulationState, winner: CharacterEntity | null, reason: string, team: TeamId | null = null) {
  sim.finished = true;
  sim.winnerSlot = winner ? winner.slotIndex : null;
  sim.winnerTeam = team;
  sim.winReason = reason;
}

function evaluateStory(sim: SimulationState) {
  const rule = sim.storyRule!;
  const hero = sim.players[0];
  const enemies = sim.players.filter((p) => p.team !== hero.team);
  if (hero.eliminated) {
    finish(sim, enemies[0] ?? null, `${hero.name} surlardan düştü! Bölümü yeniden deneyebilirsin.`);
  } else if (rule.targetStomps && hero.stomps >= rule.targetStomps) {
    finish(sim, hero, `${hero.name}, ${rule.targetStomps} kafa ezme hedefini tamamladı!`, hero.team);
  } else if (rule.targetScore && hero.score >= rule.targetScore) {
    finish(sim, hero, `${hero.name}, ${rule.targetScore} puana ulaşarak bölümü kazandı!`, hero.team);
  } else if (rule.surviveSeconds && sim.timeRemainingSec <= 0) {
    sim.timeRemainingSec = 0;
    finish(sim, hero, `${hero.name} fırtınaya karşı direndi ve etabı tamamladı!`, hero.team);
  } else if (enemies.length > 0 && enemies.every((e) => e.eliminated)) {
    finish(sim, hero, `${hero.name} tüm rakiplerini alt ederek etabı fethetti!`, hero.team);
  }
}

export function evaluateWinCondition(sim: SimulationState) {
  if (sim.finished) return;
  if ((sim.mode === 'story' || sim.mode === 'saga') && sim.storyRule) {
    evaluateStory(sim);
    return;
  }
  if (sim.mode === 'ffa') {
    if (sim.players.length <= 1) return;
    const survivors = sim.players.filter((p) => !p.eliminated);
    if (survivors.length <= 1) {
      const winner = survivors[0] ?? rankPlayers(sim.players)[0] ?? null;
      finish(sim, winner, winner ? `${winner.name} kalede ayakta kalan son fesli oldu!` : 'Berabere!');
    }
    return;
  }
  if (sim.mode === 'team') {
    const aliveTeams = new Set(sim.players.filter((p) => !p.eliminated).map((p) => p.team));
    const hadTwoTeams = new Set(sim.players.map((p) => p.team)).size >= 2;
    if (!hadTwoTeams || aliveTeams.size > 1) return;
    const winTeam = Array.from(aliveTeams)[0] ?? null;
    const mvp = rankPlayers(sim.players.filter((p) => p.team === winTeam))[0] ?? null;
    finish(
      sim,
      mvp,
      winTeam === 'A' ? 'Kırmızı Takım kaleyi fethetti!' : winTeam === 'B' ? 'Mavi Takım kaleyi fethetti!' : 'Berabere!',
      winTeam
    );
    return;
  }
  // time: highest score when the clock runs out (chaos is endless)
  if (sim.mode === 'time' && sim.timeRemainingSec <= 0) {
    sim.timeRemainingSec = 0;
    const winner = rankPlayers(sim.players)[0] ?? null;
    finish(sim, winner, winner ? `Süre doldu! ${winner.name} ${winner.score} puan ile kazandı!` : 'Süre doldu!');
  }
}
