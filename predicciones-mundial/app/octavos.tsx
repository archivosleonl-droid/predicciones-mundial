import { useEffect, useMemo, useState } from "react";
import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../src/context/AuthContext";
import { saveBracket } from "../src/services/bracketStore";
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
import { colors, spacing } from "../src/utils/theme";
import {
  PredictionCard,
  PrimaryButton,
  ScreenHeader,
  ScreenLink,
  SectionTitle,
  TeamChips,
} from "../src/components/ui";

const TEAMS_FOR_ROUND_OF_16 = 16;

export default function Octavos() {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await loadWorldCupMatches();

        if (active) {
          setMatches(data);
        }
      } catch {
        if (active) {
          setError("No se pudieron cargar los partidos del Mundial.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
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

  async function selectTeamsRandomly() {
    if (saving || !user) {
      return;
    }

    setError("");
    setSuccess("");

    if (rankedTeams.length < TEAMS_FOR_ROUND_OF_16) {
      setError(
        "No hay suficientes selecciones con historial mundialista."
      );
      return;
    }

    const pool = [...rankedTeams];
    const selected: TeamStats[] = [];

    while (
      selected.length < TEAMS_FOR_ROUND_OF_16 &&
      pool.length > 0
    ) {
      const totalWeight = pool.reduce(
        (sum, team) => sum + Math.max(team.winRate, 0.01),
        0
      );

      let random = Math.random() * totalWeight;
      let selectedIndex = pool.length - 1;

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

    const pairs: Prediction[] = [];

    for (let index = 0; index < selected.length; index += 2) {
      pairs.push(
        predictMatch(selected[index], selected[index + 1])
      );
    }

    const winners = pairs.map(
      (prediction) => prediction.predictedWinner
    );

    setSelectedTeams(selected.map((team) => team.team));
    setPredictions(pairs);
    setSaving(true);

    try {
      await saveBracket(user.uid, {
      roundOf16: pairs,
      roundOf16Winners: winners,
      quarterFinals: [],
      semiFinals: [],
      final: null,
      champion: null,
    });

      setSuccess("Ganadores de octavos guardados correctamente.");
    } catch (err: unknown) {
      console.error("Error al guardar los octavos:", err);

      setError(
        "Los octavos se calcularon, pero no se pudieron guardar en Firebase. Revisa la conexión y los permisos de Firestore."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Cargando estadísticas...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator
    >
      <ScreenHeader
        title="Octavos de final"
        subtitle="El sistema selecciona 16 selecciones al azar. Las selecciones con mayor tasa de victoria tienen más probabilidad de aparecer."
      />

      <PrimaryButton
        label={
          saving
            ? "Guardando octavos..."
            : "Generar octavos al azar"
        }
        onPress={selectTeamsRandomly}
        disabled={saving || rankedTeams.length < TEAMS_FOR_ROUND_OF_16}
      />

      {error !== "" && (
        <Text
          accessibilityRole="alert"
          style={styles.error}
        >
          {error}
        </Text>
      )}

      {success !== "" && (
        <Text style={styles.success}>
          {success}
        </Text>
      )}

      {selectedTeams.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Selecciones participantes</SectionTitle>

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

          {!saving && (
            <ScreenLink
              href="/cuartos"
              label="Continuar a cuartos de final"
            />
          )}
        </View>
      )}

      <ScreenLink
        href="/dashboard"
        label="Volver al dashboard"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 56,
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
    textAlign: "center",
  },
  section: {
    marginTop: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: "center",
  },
  success: {
    color: colors.primary,
    marginTop: spacing.md,
    textAlign: "center",
  },
});