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
  getSemiFinals,
  setFinal,
  setChampion,
} from "../src/services/bracketStore";
import { colors, radius, spacing } from "../src/utils/theme";
import {
  EmptyState,
  PredictionCard,
  PrimaryButton,
  ScreenHeader,
  ScreenLink,
  SectionTitle,
  TeamChips,
} from "../src/components/ui";

export default function Final() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const semiFinals = getSemiFinals();

  const finalists = useMemo(() => {
    return semiFinals.map(
      (semiFinal) => semiFinal.predictedWinner
    );
  }, [semiFinals]);

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

  function generateFinal() {
    setError("");
    setPrediction(null);

    if (finalists.length !== 2) {
      setError(
        "Primero calcula las semifinales para obtener los 2 finalistas."
      );
      return;
    }

    const home = finalists[0];
    const away = finalists[1];

    const homeStats = statsByTeam.get(home);
    const awayStats = statsByTeam.get(away);

    if (!homeStats || !awayStats) {
      setError("No se encontraron estadísticas de una selección.");
      return;
    }

    const finalPrediction = predictMatch(homeStats, awayStats);

    setFinal(finalPrediction);
    setChampion(finalPrediction.predictedWinner);
    setPrediction(finalPrediction);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (finalists.length !== 2) {
    return (
      <View style={styles.center}>
        <EmptyState
          message="Aún no hay ganadores de semifinales."
          linkHref="/semifinal"
          linkLabel="Ir a semifinales"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader
        title="Final del Mundial"
        subtitle="Los 2 ganadores de semifinales disputan la final."
      />

      <SectionTitle>Finalistas</SectionTitle>
      <TeamChips teams={finalists} />

      <PrimaryButton label="Calcular final" onPress={generateFinal} />

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      {prediction && (
        <View style={styles.section}>
          <SectionTitle>Partido final</SectionTitle>

          <PredictionCard
            prediction={prediction}
            roundLabel="Gran final"
          />

          <View style={styles.championCard}>
            <Text style={styles.championLabel}>
              Campeón previsto del Mundial
            </Text>

            <Text style={styles.championName}>
              {prediction.predictedWinner}
            </Text>
          </View>

          <ScreenLink href="/dashboard" label="Volver al dashboard" />
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
  championCard: {
    backgroundColor: "#14532D",
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  championLabel: {
    color: "#DCFCE7",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  championName: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
});