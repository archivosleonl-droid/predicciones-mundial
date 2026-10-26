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
import {
  getRoundOf16Winners,
  setQuarterFinals,
} from "../src/services/bracketStore";
import { colors, spacing } from "../src/utils/theme";
import {
  EmptyState,
  PredictionCard,
  PrimaryButton,
  ScreenHeader,
  ScreenLink,
  SectionTitle,
  TeamChips,
} from "../src/components/ui";

export default function Cuartos() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const roundOf16Winners = getRoundOf16Winners();

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

  function generateQuarterFinals() {
    setError("");
    setPredictions([]);

    if (roundOf16Winners.length !== 8) {
      setError(
        "Primero genera los octavos de final para obtener los 8 ganadores."
      );
      return;
    }

    const pairs: Prediction[] = [];

    for (let index = 0; index < roundOf16Winners.length; index += 2) {
      const home = roundOf16Winners[index];
      const away = roundOf16Winners[index + 1];

      const homeStats = statsByTeam.get(home);
      const awayStats = statsByTeam.get(away);

      if (!homeStats || !awayStats) {
        setError("No se encontraron estadísticas de una selección.");
        return;
      }

      pairs.push(predictMatch(homeStats, awayStats));
    }

    setQuarterFinals(pairs);
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

  if (roundOf16Winners.length !== 8) {
    return (
      <View style={styles.center}>
        <EmptyState
          message="Aún no hay ganadores de octavos."
          linkHref="/octavos"
          linkLabel="Ir a octavos de final"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader
        title="Cuartos de final"
        subtitle="Los 8 ganadores de octavos forman 4 cruces automáticos."
      />

      <SectionTitle>Ganadores de octavos</SectionTitle>
      <TeamChips teams={roundOf16Winners} />

      <PrimaryButton
        label="Calcular cuartos de final"
        onPress={generateQuarterFinals}
      />

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      {predictions.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Cruces y predicciones</SectionTitle>

          {predictions.map((prediction, index) => (
            <PredictionCard
              key={`${prediction.homeTeam}-${prediction.awayTeam}`}
              prediction={prediction}
              roundLabel={`Cuartos ${index + 1}`}
            />
          ))}

          <ScreenLink
            href="/semifinal"
            label="Continuar a semifinales"
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