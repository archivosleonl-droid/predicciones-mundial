import { useEffect, useMemo, useState } from "react";
import { Link, Redirect } from "expo-router";
import { signOut } from "firebase/auth";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth } from "../src/services/firebase";
import { useAuth } from "../src/context/AuthContext";
import {
  loadWorldCupMatches,
  type Match,
} from "../src/services/matches";
import {
  calculateTeamStats,
  getTeams,
  type TeamStats,
} from "../src/utils/stats";
import { colors, radius, spacing, typography } from "../src/utils/theme";

export default function Dashboard() {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await loadWorldCupMatches();
        setMatches(data);
      } catch {
        setLoadError(
          "No se pudieron cargar los partidos. Revisa tu conexión a internet."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const allStats = useMemo(() => {
    const teams = getTeams(matches);

    return teams
      .map((team) => calculateTeamStats(team, matches))
      .sort((a, b) => b.winRate - a.winRate);
  }, [matches]);

  const filteredStats = useMemo(() => {
    return allStats.filter((team) =>
      team.team.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [allStats, search]);

  const summary = useMemo(() => {
    const totalMatches = matches.length;
    const totalTeams = allStats.length;
    const bestTeam = allStats[0];

    return {
      totalMatches,
      totalTeams,
      bestTeam: bestTeam ? bestTeam.team : "—",
      bestWinRate: bestTeam ? bestTeam.winRate : 0,
    };
  }, [matches, allStats]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  async function handleLogout() {
    try {
      setLogoutError("");
      setBusy(true);
      await signOut(auth);
    } catch {
      setLogoutError("No se pudo cerrar la sesión.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Cargando historial de partidos del Mundial...
        </Text>
      </View>
    );
  }

  if (loadError !== "") {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Predicciones Mundial</Text>
          <Text style={styles.subtitle}>{user.email}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={busy}
        >
          <Text style={styles.logoutText}>
            {busy ? "Saliendo..." : "Salir"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Partidos"
          value={summary.totalMatches.toString()}
          icon="⚽"
        />

        <SummaryCard
          label="Selecciones"
          value={summary.totalTeams.toString()}
          icon="🌍"
        />

        <SummaryCard
          label="Mejor selección"
          value={summary.bestTeam}
          icon="🏆"
        />

        <SummaryCard
          label="Mejor % victorias"
          value={`${(summary.bestWinRate * 100).toFixed(1)}%`}
          icon="📈"
        />
      </View>

      <View style={styles.actions}>
        <Link href="/octavos" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
        Generar predicciones
            </Text>
          </Pressable>
         </Link>

        <Link href="/bracket" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
        Ver bracket del Mundial
            </Text>
          </Pressable>
        </Link>
    </View>

      <Text style={styles.sectionTitle}>Estadísticas por selección</Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar selección..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        accessibilityLabel="Buscar selección"
      />

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.teamColumn]}>
          Selección
        </Text>
        <Text style={styles.headerCell}>PJ</Text>
        <Text style={styles.headerCell}>G</Text>
        <Text style={styles.headerCell}>E</Text>
        <Text style={styles.headerCell}>P</Text>
        <Text style={styles.headerCell}>%</Text>
      </View>

      <FlatList
        data={filteredStats}
        keyExtractor={(item) => item.team}
        scrollEnabled={false}
        renderItem={({ item }) => <TeamRow team={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No se encontró esa selección.</Text>
        }
      />
    </ScrollView>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function TeamRow({ team }: { team: TeamStats }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.teamName, styles.teamColumn]} numberOfLines={1}>
        {team.team}
      </Text>

      <Text style={styles.cell}>{team.matches}</Text>
      <Text style={[styles.cell, styles.win]}>{team.wins}</Text>
      <Text style={styles.cell}>{team.draws}</Text>
      <Text style={[styles.cell, styles.loss]}>{team.losses}</Text>
      <Text style={styles.cell}>
        {(team.winRate * 100).toFixed(1)}%
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
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.xs,
  },
  logoutButton: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: "700",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryIcon: {
    fontSize: 22,
    marginBottom: spacing.sm,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  actions: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 16,
  },
  sectionTitle: {
    ...typography.section,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.sm,
    padding: 14,
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  headerCell: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  teamColumn: {
    flex: 2,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  teamName: {
    color: colors.text,
    fontWeight: "600",
  },
  cell: {
    color: colors.text,
    fontSize: 12,
    textAlign: "center",
    flex: 1,
  },
  win: {
    color: colors.primary,
    fontWeight: "700",
  },
  loss: {
    color: colors.danger,
    fontWeight: "700",
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
  },

    secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  
    secondaryButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },

});