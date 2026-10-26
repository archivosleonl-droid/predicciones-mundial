import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  loadWorldCupMatches,
  type Match,
} from "../src/services/matches";
import {
  calculateTeamStats,
  getTeams,
  type TeamStats,
} from "../src/utils/stats";
import {
  predictMatch,
  type Prediction,
} from "../src/utils/predictions";
import { setRoundOf16Winners } from "../src/services/bracketStore";
import {
  colors,
  radius,
  spacing,
} from "../src/utils/theme";
import {
  EmptyState,
  PredictionCard,
  PrimaryButton,
  ScreenHeader,
  ScreenLink,
  SectionTitle,
  TeamChips,
} from "../src/components/ui";

const TEAMS_FOR_ROUND_OF_16 = 16;

export default function Octavos() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await loadWorldCupMatches();
        setMatches(data);
      } catch {
        setError("No se pudieron cargar los partidos del Mundial.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const statsByTeam = useMemo(() => {
    const map = new Map<string, TeamStats>();

    getTeams(matches).forEach((team) => {
      map.set(team, calculateTeamStats(team, matches));
    });

    return map;
  }, [matches]);

  const rankedTeams = useMemo(() => {
    return Array.from(statsByTeam.values()).sort(
      (a, b) => b.winRate - a.winRate
    );
  }, [statsByTeam]);

  function selectTeamsRandomly() {
    setError("");
    setPredictions([]);

    if (rankedTeams.length < TEAMS_FOR_ROUND_OF_16) {
      setError("No hay suficientes selecciones con historial mundialista.");
      return;
    }

    const pool = [...rankedTeams];
    const selected: TeamStats[] = [];

    while (selected.length < TEAMS_FOR_ROUND_OF_16 && pool.length > 0) {
      const totalWeight = pool.reduce(
        (sum, team) => sum + Math.max(team.winRate, 0.01),
        0
      );

      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let index = 0; index < pool.length; index++) {
        random -= Math.max(pool[index].winRate, 0.01);

        if (random <= 0) {
          selectedIndex = index;
          break;
        }
      }

      selected.push(pool[selectedIndex]);
      pool.splice(selectedIndex, 1);
    }

    setSelectedTeams(selected.map((team) => team.team));

    const pairs: Prediction[] = [];

    for (let index = 0; index < selected.length; index += 2) {
      pairs.push(predictMatch(selected[index], selected[index + 1]));
    }

    const winners = pairs.map(
      (prediction) => prediction.predictedWinner
    );

    setRoundOf16Winners(winners);
    setPredictions(pairs);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader
        title="Octavos de final"
        subtitle="El sistema selecciona 16 selecciones al azar. Las selecciones con mayor tasa de victoria tienen más probabilidad de aparecer."
      />

      <PrimaryButton
        label="Generar octavos al azar"
        onPress={selectTeamsRandomly}
      />

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      {selectedTeams.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Selecciones clasificadas</SectionTitle>
          <TeamChips teams={selectedTeams} />
        </View>
      )}

      {predictions.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Cruces y predicciones</SectionTitle>

          {predictions.map((prediction, index) => (
            <PredictionCard
              key={`${prediction.homeTeam}-${prediction.awayTeam}`}
              prediction={prediction}
              roundLabel={`Octavos ${index + 1}`}
            />
          ))}

          <ScreenLink
            href="/cuartos"
            label="Continuar a cuartos de final"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: "center",
  },
});