import { useEffect, useMemo, useState } from "react";
import { Redirect } from "expo-router";
import { signOut } from "firebase/auth";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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

  const stats = useMemo(() => {
    const teams = getTeams(matches);

    return teams
      .map((team) => calculateTeamStats(team, matches))
      .filter((team) =>
        team.team.toLowerCase().includes(search.trim().toLowerCase())
      )
      .sort((a, b) => b.winRate - a.winRate);
  }, [matches, search]);

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
        <ActivityIndicator size="large" color="#22C55E" />
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
    <View style={styles.container}>
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
            {busy ? "Saliendo..." : "Cerrar sesión"}
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar selección..."
        placeholderTextColor="#94A3B8"
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
        <Text style={styles.headerCell}>% Victorias</Text>
      </View>

      <FlatList
        data={stats}
        keyExtractor={(item) => item.team}
        renderItem={({ item }) => <TeamRow team={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No se encontró esa selección.</Text>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
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
    backgroundColor: "#0B1120",
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#0B1120",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#CBD5E1",
    marginTop: 12,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94A3B8",
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutText: {
    color: "#FCA5A5",
    fontWeight: "700",
  },
  search: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  headerCell: {
    color: "#94A3B8",
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
    backgroundColor: "#111827",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    alignItems: "center",
  },
  teamName: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cell: {
    color: "#E2E8F0",
    fontSize: 12,
    textAlign: "center",
    flex: 1,
  },
  win: {
    color: "#4ADE80",
    fontWeight: "700",
  },
  loss: {
    color: "#F87171",
    fontWeight: "700",
  },
  empty: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 24,
  },
  error: {
    color: "#FCA5A5",
    textAlign: "center",
  },
});