import type { Match } from "../services/matches";

export type TeamStats = {
  team: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
  strength: number;
};

export function getTeams(matches: Match[]): string[] {
  const teams = new Set<string>();

  matches.forEach((match) => {
    teams.add(match.homeTeam);
    teams.add(match.awayTeam);
  });

  return Array.from(teams).sort();
}

export function calculateTeamStats(
  team: string,
  matches: Match[]
): TeamStats {
  const teamMatches = matches.filter(
    (match) => match.homeTeam === team || match.awayTeam === team
  );

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const match of teamMatches) {
    const isHome = match.homeTeam === team;

    const teamGoals = isHome ? match.homeScore : match.awayScore;
    const rivalGoals = isHome ? match.awayScore : match.homeScore;

    goalsFor += teamGoals;
    goalsAgainst += rivalGoals;

    if (teamGoals > rivalGoals) {
      wins++;
    } else if (teamGoals === rivalGoals) {
      draws++;
    } else {
      losses++;
    }
  }

  const total = teamMatches.length;
  const avgGoalsFor = total > 0 ? goalsFor / total : 0;
  const avgGoalsAgainst = total > 0 ? goalsAgainst / total : 0;
  const winRate = total > 0 ? wins / total : 0;

  const strength =
    2 * winRate + avgGoalsFor - avgGoalsAgainst;

  return {
    team,
    matches: total,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    winRate,
    strength,
  };
}