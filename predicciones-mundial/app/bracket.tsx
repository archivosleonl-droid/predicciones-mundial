import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  getChampion,
  getFinal,
  getQuarterFinals,
  getRoundOf16Winners,
  getSemiFinals,
} from "../src/services/bracketStore";
import { colors, radius, spacing } from "../src/utils/theme";
import {
  EmptyState,
  ScreenHeader,
  ScreenLink,
  SectionTitle,
} from "../src/components/ui";

export default function Bracket() {
  const roundOf16Winners = getRoundOf16Winners();
  const quarterFinals = getQuarterFinals();
  const semiFinals = getSemiFinals();
  const finalMatch = getFinal();
  const champion = getChampion();

  const hasOctavos = roundOf16Winners.length === 16;

  if (!hasOctavos) {
    return (
      <View style={styles.center}>
        <EmptyState
          message="Primero genera los octavos de final para ver el bracket."
          linkHref="/octavos"
          linkLabel="Ir a octavos de final"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader
        title="Bracket del Mundial"
        subtitle="Visualiza el camino de las selecciones desde octavos hasta la final."
      />

      <View style={styles.bracket}>
        <View style={styles.column}>
          <SectionTitle>Octavos</SectionTitle>

          <View style={styles.matches}>
            {Array.from({ length: 8 }).map((_, index) => {
              const home = roundOf16Winners[index * 2];
              const away = roundOf16Winners[index * 2 + 1];

              return (
                <View key={`octavos-${index}`} style={styles.matchCard}>
                  <Text style={styles.team}>{home}</Text>
                  <Text style={styles.vs}>vs</Text>
                  <Text style={styles.team}>{away}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.column}>
          <SectionTitle>Cuartos</SectionTitle>

          <View style={styles.matches}>
            {quarterFinals.length === 0 ? (
              <EmptyState message="Calcula los cuartos de final." />
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

        <View style={styles.column}>
          <SectionTitle>Semifinales</SectionTitle>

          <View style={styles.matches}>
            {semiFinals.length === 0 ? (
              <EmptyState message="Calcula las semifinales." />
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

        <View style={styles.column}>
          <SectionTitle>Final</SectionTitle>

          <View style={styles.matches}>
            {!finalMatch ? (
              <EmptyState message="Calcula la final." />
            ) : (
              <MatchResultCard
                home={finalMatch.homeTeam}
                away={finalMatch.awayTeam}
                winner={finalMatch.predictedWinner}
                label="Gran final"
              />
            )}
          </View>
        </View>

        <View style={styles.column}>
          <SectionTitle>Campeón</SectionTitle>

          <View style={styles.championColumn}>
            {champion ? (
              <View style={styles.championCard}>
                <Text style={styles.trophy}>🏆</Text>
                <Text style={styles.championName}>{champion}</Text>
              </View>
            ) : (
              <EmptyState message="Aún no hay campeón previsto." />
            )}
          </View>
        </View>
      </View>

      <ScreenLink href="/dashboard" label="Volver al dashboard" />
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

      <Text
        style={[
          styles.team,
          home === winner && styles.winnerTeam,
        ]}
      >
        {home}
      </Text>

      <Text style={styles.vs}>vs</Text>

      <Text
        style={[
          styles.team,
          away === winner && styles.winnerTeam,
        ]}
      >
        {away}
      </Text>
    </View>
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
  bracket: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    minWidth: 190,
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
    fontSize: 11,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  team: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  winnerTeam: {
    color: colors.primary,
    fontWeight: "800",
  },
  vs: {
    color: colors.textMuted,
    fontSize: 11,
    marginVertical: 2,
  },
  championColumn: {
    alignItems: "center",
  },
  championCard: {
    backgroundColor: "#14532D",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  trophy: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  championName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
});