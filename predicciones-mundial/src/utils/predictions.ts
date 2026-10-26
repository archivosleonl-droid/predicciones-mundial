import type { TeamStats } from "./stats";

export type Prediction = {
  homeTeam: string;
  awayTeam: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedWinner: string;
};

export function predictMatch(
  home: TeamStats,
  away: TeamStats
): Prediction {
  const homeStrength = Math.max(home.strength, 0.1);
  const awayStrength = Math.max(away.strength, 0.1);

  const homeShare = homeStrength / (homeStrength + awayStrength);
  const awayShare = 1 - homeShare;

  const drawProbability = 0.22;
  const winProbability = 1 - drawProbability;

  const homeWinProbability = homeShare * winProbability;
  const awayWinProbability = awayShare * winProbability;

  const predictedWinner =
    homeWinProbability >= awayWinProbability
      ? home.team
      : away.team;

  return {
    homeTeam: home.team,
    awayTeam: away.team,
    homeWinProbability,
    drawProbability,
    awayWinProbability,
    predictedWinner,
  };
}