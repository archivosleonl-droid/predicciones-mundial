import Papa from "papaparse";
import { translateTeam } from "../utils/teamNames";

export type Match = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  tournament: string;
  city: string;
  country: string;
  neutral: boolean;
};

const CSV_URL =
  "https://raw.githubusercontent.com/martj42/international_results/master/results.csv";

export async function loadWorldCupMatches(): Promise<Match[]> {
  const response = await fetch(CSV_URL);

  if (!response.ok) {
    throw new Error("No se pudo descargar el archivo de partidos.");
  }

  const csvText = await response.text();

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data
    .filter((row) => row.tournament === "FIFA World Cup")
    .map((row) => ({
      date: row.date,
      homeTeam: translateTeam(row.home_team),
      awayTeam: translateTeam(row.away_team),
      homeScore: Number(row.home_score),
      awayScore: Number(row.away_score),
      tournament: row.tournament,
      city: row.city,
      country: row.country,
      neutral: row.neutral === "TRUE",
    }));
}