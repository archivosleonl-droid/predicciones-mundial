import { useCallback, useState } from "react";
import { Redirect, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../src/context/AuthContext";
import {
  loadBracket,
  type BracketData,
} from "../src/services/bracketStore";

import {
  colors,
  radius,
  spacing,
} from "../src/utils/theme";

import {
  EmptyState,
  PrimaryButton,
  ScreenHeader,
  ScreenLink,
  SectionTitle,
} from "../src/components/ui";

export default function Bracket() {
  const { user, loading: authLoading } = useAuth();

  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setBracket(null);
      setLoadError("");
      setLoading(true);

      if (authLoading || !user) {
        return () => {
          active = false;
        };
      }

      const userId = user.uid;

      async function load() {
        try {
          const data = await loadBracket(userId);

          if (active) {
            setBracket(data);
          }
        } catch (error: unknown) {
          console.error("Error al cargar el bracket:", error);

          if (active) {
            setLoadError(
              "No se pudo cargar tu bracket. Revisa tu conexión y los permisos de Firestore."
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
    }, [user?.uid, authLoading, retryCount])
  );

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
          Cargando tu bracket guardado...
        </Text>
      </View>
    );
  }

  if (loadError !== "") {
    return (
      <View style={styles.center}>
        <Text
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {loadError}
        </Text>

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

  const roundOf16 = bracket?.roundOf16 ?? [];
  const quarterFinals = bracket?.quarterFinals ?? [];
  const semiFinals = bracket?.semiFinals ?? [];
  const finalMatch = bracket?.final ?? null;
  const champion = bracket?.champion ?? null;

  const hasOctavos = roundOf16.length === 8;

  if (!hasOctavos) {
    return (
      <View style={styles.center}>
        <EmptyState
          message="Primero genera unos octavos de final para ver los 8 partidos del bracket."
          linkHref="/octavos"
          linkLabel="Ir a octavos de final"
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
        title="Bracket del Mundial"
        subtitle="Visualiza el camino de las selecciones desde octavos hasta la final. Los ganadores previstos aparecen en verde."
      />

      <Text style={styles.scrollHint}>
        Desliza horizontalmente para ver todas las rondas.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.bracket}
      >
        {/* OCTAVOS */}
        <View style={styles.column}>
          <SectionTitle>Octavos</SectionTitle>

          <Text style={styles.roundInfo}>16 selecciones · 8 partidos</Text>

          <View style={styles.matches}>
            {roundOf16.map((prediction, index) => (
              <MatchResultCard
                key={`octavos-${index}`}
                home={prediction.homeTeam}
                away={prediction.awayTeam}
                winner={prediction.predictedWinner}
                label={`Octavos ${index + 1}`}
              />
            ))}
          </View>
        </View>

        {/* CUARTOS */}
        <View style={styles.column}>
          <SectionTitle>Cuartos</SectionTitle>

          <Text style={styles.roundInfo}>8 selecciones · 4 partidos</Text>

          <View style={styles.matches}>
            {quarterFinals.length === 0 ? (
              <EmptyState
                message="Todavía no se han calculado los cuartos."
                linkHref="/cuartos"
                linkLabel="Ir a cuartos"
              />
            ) : (
              quarterFinals.map((prediction, index) => (
                <MatchResultCard
                  key={`cuartos-${index}`}
                  home={prediction.homeTeam}
                  away={prediction.awayTeam}
                  winner={prediction.predictedWinner}
                  label={`Cuartos ${index + 1}`}
                />
              ))
            )}
          </View>
        </View>

        {/* SEMIFINALES */}
        <View style={styles.column}>
          <SectionTitle>Semifinales</SectionTitle>

          <Text style={styles.roundInfo}>4 selecciones · 2 partidos</Text>

          <View style={styles.matches}>
            {semiFinals.length === 0 ? (
              <EmptyState
                message="Todavía no se han calculado las semifinales."
                linkHref="/semifinal"
                linkLabel="Ir a semifinales"
              />
            ) : (
              semiFinals.map((prediction, index) => (
                <MatchResultCard
                  key={`semifinal-${index}`}
                  home={prediction.homeTeam}
                  away={prediction.awayTeam}
                  winner={prediction.predictedWinner}
                  label={`Semifinal ${index + 1}`}
                />
              ))
            )}
          </View>
        </View>

        {/* FINAL */}
        <View style={styles.column}>
          <SectionTitle>Final</SectionTitle>

          <Text style={styles.roundInfo}>2 selecciones · 1 partido</Text>

          <View style={styles.matches}>
            {finalMatch ? (
              <MatchResultCard
                home={finalMatch.homeTeam}
                away={finalMatch.awayTeam}
                winner={finalMatch.predictedWinner}
                label="Gran final"
              />
            ) : (
              <EmptyState
                message="Todavía no se ha calculado la final."
                linkHref="/final"
                linkLabel="Ir a la final"
              />
            )}
          </View>
        </View>

        {/* CAMPEÓN */}
        <View style={styles.column}>
          <SectionTitle>Campeón</SectionTitle>

          <Text style={styles.roundInfo}>
            Resultado previsto de la simulación
          </Text>

          {champion ? (
            <View style={styles.championCard}>
              <Text style={styles.trophy}>🏆</Text>

              <Text style={styles.championLabel}>
                Campeón previsto
              </Text>

              <Text style={styles.championName}>
                {champion}
              </Text>
            </View>
          ) : (
            <EmptyState message="Aún no hay un campeón previsto." />
          )}
        </View>
      </ScrollView>

      <ScreenLink
        href="/dashboard"
        label="Volver al dashboard"
      />
    </ScrollView>
  );
}

function MatchResultCard({
  home,
  away,
  winner,
  label,
}: {
  home: string;
  away: string;
  winner: string;
  label: string;
}) {
  return (
    <View style={styles.matchCard}>
      <Text style={styles.roundLabel}>{label}</Text>

      <View
        style={[
          styles.teamRow,
          home === winner && styles.winnerRow,
        ]}
      >
        <Text
          style={[
            styles.team,
            home === winner && styles.winnerTeam,
          ]}
        >
          {home}
        </Text>

        {home === winner && (
          <Text style={styles.winnerMark}>✓</Text>
        )}
      </View>

      <Text style={styles.vs}>vs</Text>

      <View
        style={[
          styles.teamRow,
          away === winner && styles.winnerRow,
        ]}
      >
        <Text
          style={[
            styles.team,
            away === winner && styles.winnerTeam,
          ]}
        >
          {away}
        </Text>

        {away === winner && (
          <Text style={styles.winnerMark}>✓</Text>
        )}
      </View>
    </View>
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
  scrollHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  bracket: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  column: {
    width: 230,
  },
  roundInfo: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
    minHeight: 32,
  },
  matches: {
    gap: spacing.md,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  roundLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  winnerRow: {
    backgroundColor: "#14532D",
  },
  team: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  winnerTeam: {
    color: "#DCFCE7",
    fontWeight: "800",
  },
  winnerMark: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  vs: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginVertical: 4,
  },
  championCard: {
    backgroundColor: "#14532D",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  trophy: {
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  championLabel: {
    color: "#BBF7D0",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  championName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  statusText: {
  color: colors.textMuted,
  marginTop: spacing.md,
  textAlign: "center",
  },
  errorText: {
  color: colors.danger,
  textAlign: "center",
  marginBottom: spacing.lg,
  },

});