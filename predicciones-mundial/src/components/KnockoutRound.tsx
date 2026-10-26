import { useCallback, useMemo, useState } from "react";
import { Redirect, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import {
  loadBracket,
  saveBracket,
  type BracketData,
} from "../services/bracketStore";
import {
  loadWorldCupMatches,
  type Match,
} from "../services/matches";
import {
  calculateTeamStats,
  type TeamStats,
} from "../utils/stats";
import {
  predictMatch,
  type Prediction,
} from "../utils/predictions";
import { colors, radius, spacing } from "../utils/theme";
import {
  EmptyState,
  PredictionCard,
  PrimaryButton,
  ScreenHeader,
  ScreenLink,
  SectionTitle,
  TeamChips,
} from "./ui";

type Round = "quarterFinals" | "semiFinals" | "final";

type Props = {
  round: Round;
};

const roundConfig = {
  quarterFinals: {
    title: "Cuartos de final",
    subtitle: "Los 8 ganadores de octavos forman 4 cruces.",
    teamsTitle: "Ganadores de octavos",
    expectedTeams: 8,
    buttonLabel: "Calcular cuartos de final",
    cardLabel: "Cuartos",
    previousHref: "/octavos",
    previousLabel: "Ir a octavos",
    emptyMessage:
      "Primero genera los octavos para obtener sus 8 ganadores.",
    nextHref: "/semifinal",
    nextLabel: "Continuar a semifinales",
  },
  semiFinals: {
    title: "Semifinales",
    subtitle: "Los 4 ganadores de cuartos forman 2 cruces.",
    teamsTitle: "Ganadores de cuartos",
    expectedTeams: 4,
    buttonLabel: "Calcular semifinales",
    cardLabel: "Semifinal",
    previousHref: "/cuartos",
    previousLabel: "Ir a cuartos",
    emptyMessage:
      "Primero calcula los cuartos para obtener sus 4 ganadores.",
    nextHref: "/final",
    nextLabel: "Continuar a la final",
  },
  final: {
    title: "Final del Mundial",
    subtitle: "Los 2 ganadores de semifinales disputan la final.",
    teamsTitle: "Finalistas",
    expectedTeams: 2,
    buttonLabel: "Calcular final",
    cardLabel: "Gran final",
    previousHref: "/semifinal",
    previousLabel: "Ir a semifinales",
    emptyMessage:
      "Primero calcula las semifinales para obtener los 2 finalistas.",
    nextHref: "/bracket",
    nextLabel: "Ver bracket completo",
  },
};

function getParticipants(
  round: Round,
  bracket: BracketData
): string[] {
  if (round === "quarterFinals") {
    return bracket.roundOf16Winners;
  }

  if (round === "semiFinals") {
    return bracket.quarterFinals.map(
      (prediction) => prediction.predictedWinner
    );
  }

  return bracket.semiFinals.map(
    (prediction) => prediction.predictedWinner
  );
}

function getSavedPredictions(
  round: Round,
  bracket: BracketData
): Prediction[] {
  if (round === "quarterFinals") {
    return bracket.quarterFinals;
  }

  if (round === "semiFinals") {
    return bracket.semiFinals;
  }

  return bracket.final ? [bracket.final] : [];
}

function getRoundPatch(
  round: Round,
  predictions: Prediction[]
): Partial<BracketData> {
  if (round === "quarterFinals") {
    return {
      quarterFinals: predictions,
      semiFinals: [],
      final: null,
      champion: null,
    };
  }

  if (round === "semiFinals") {
    return {
      semiFinals: predictions,
      final: null,
      champion: null,
    };
  }

  return {
    final: predictions[0],
    champion: predictions[0].predictedWinner,
  };
}

export default function KnockoutRound({ round }: Props) {
  const { user, loading: authLoading } = useAuth();
  const config = roundConfig[round];

  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      setLoadError("");
      setSaveError("");
      setSuccess("");
      setParticipants([]);
      setPredictions([]);

      if (authLoading || !user) {
        return () => {
          active = false;
        };
      }

      const userId = user.uid;

      async function load() {
        try {
          const [loadedMatches, savedBracket] = await Promise.all([
            loadWorldCupMatches(),
            loadBracket(userId),
          ]);

          if (!active) {
            return;
          }

          setMatches(loadedMatches);
          setParticipants(getParticipants(round, savedBracket));
          setPredictions(getSavedPredictions(round, savedBracket));
        } catch (error: unknown) {
          console.error("Error al cargar la ronda:", error);

          if (active) {
            setLoadError(
              "No se pudieron cargar los datos. Revisa tu conexión y los permisos de Firestore."
            );
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
    }, [user?.uid, authLoading, round, retryCount])
  );

  const statsByTeam = useMemo(() => {
    const map = new Map<string, TeamStats>();

    participants.forEach((team) => {
      map.set(team, calculateTeamStats(team, matches));
    });

    return map;
  }, [matches, participants]);

  async function calculateAndSave() {
    if (!user || saving) {
      return;
    }

    setSaveError("");
    setSuccess("");

    if (
      participants.length !== config.expectedTeams ||
      new Set(participants).size !== participants.length
    ) {
      setSaveError(
        "Los participantes no son válidos. Calcula nuevamente la ronda anterior."
      );
      return;
    }

    const pairs: Prediction[] = [];

    for (let index = 0; index < participants.length; index += 2) {
      const homeStats = statsByTeam.get(participants[index]);
      const awayStats = statsByTeam.get(participants[index + 1]);

      if (
        !homeStats ||
        !awayStats ||
        homeStats.matches === 0 ||
        awayStats.matches === 0
      ) {
        setSaveError(
          "No se encontraron estadísticas de una de las selecciones."
        );
        return;
      }

      pairs.push(predictMatch(homeStats, awayStats));
    }

    setSaving(true);

    try {
      await saveBracket(
        user.uid,
        getRoundPatch(round, pairs)
      );

      setPredictions(pairs);
      setSuccess("Resultados guardados correctamente.");
    } catch (error: unknown) {
      console.error("Error al guardar la ronda:", error);

      setSaveError(
        "No se pudo confirmar el guardado en Firebase. Pulsa el botón para intentarlo nuevamente."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
        <Text style={styles.statusText}>
          Comprobando sesión...
        </Text>
      </View>
    );
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
        <Text style={styles.statusText}>
          Cargando estadísticas y resultados guardados...
        </Text>
      </View>
    );
  }

  if (loadError !== "") {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{loadError}</Text>

        <PrimaryButton
          label="Intentar nuevamente"
          onPress={() => setRetryCount((current) => current + 1)}
        />

        <ScreenLink
          href="/dashboard"
          label="Volver al dashboard"
        />
      </View>
    );
  }

  if (participants.length !== config.expectedTeams) {
    return (
      <View style={styles.center}>
        <EmptyState
          message={config.emptyMessage}
          linkHref={config.previousHref}
          linkLabel={config.previousLabel}
        />

        <ScreenLink
          href="/dashboard"
          label="Volver al dashboard"
        />
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
        title={config.title}
        subtitle={config.subtitle}
      />

      <SectionTitle>{config.teamsTitle}</SectionTitle>
      <TeamChips teams={participants} />

      {predictions.length > 0 && (
        <Text style={styles.notice}>
          Ya tienes resultados guardados para esta ronda.
          Si vuelves a calcularla, se reiniciarán las rondas posteriores.
        </Text>
      )}

      <PrimaryButton
        label={
          saving
            ? "Guardando resultados..."
            : config.buttonLabel
        }
        onPress={calculateAndSave}
        disabled={saving}
      />

      {saveError !== "" && (
        <Text
          accessibilityRole="alert"
          style={styles.error}
        >
          {saveError}
        </Text>
      )}

      {success !== "" && (
        <Text style={styles.success}>{success}</Text>
      )}

      {predictions.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Cruces y predicciones</SectionTitle>

          {predictions.map((prediction, index) => (
            <PredictionCard
              key={`${prediction.homeTeam}-${prediction.awayTeam}`}
              prediction={prediction}
              roundLabel={
                round === "final"
                  ? config.cardLabel
                  : `${config.cardLabel} ${index + 1}`
              }
            />
          ))}

          {round === "final" && (
            <View style={styles.championCard}>
              <Text style={styles.trophy}>🏆</Text>

              <Text style={styles.championLabel}>
                Campeón previsto del Mundial
              </Text>

              <Text style={styles.championName}>
                {predictions[0].predictedWinner}
              </Text>
            </View>
          )}

          {!saving && saveError === "" && (
            <ScreenLink
              href={config.nextHref}
              label={config.nextLabel}
            />
          )}
        </View>
      )}

      {!saving && (
        <ScreenLink
          href="/dashboard"
          label="Volver al dashboard"
        />
      )}
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
  statusText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: "center",
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  success: {
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  championCard: {
    backgroundColor: "#14532D",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  trophy: {
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  championLabel: {
    color: "#DCFCE7",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  championName: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
});