import { useMemo, useState } from "react";
import { Link } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
  loadWorldCupMatches,
  type Match,
} from "../src/services/matches";
import { useEffect } from "react";

export default function Octavos() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
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

  const teams = useMemo(() => {
    const allTeams = getTeams(matches);

    return allTeams
      .map((team) => calculateTeamStats(team, matches))
      .filter((team) =>
        team.team.toLowerCase().includes(search.trim().toLowerCase())
      )
      .sort((a, b) => b.winRate - a.winRate);
  }, [matches, search]);

  const statsByTeam = useMemo(() => {
    const map = new Map<string, TeamStats>();

    getTeams(matches).forEach((team) => {
      map.set(team, calculateTeamStats(team, matches));
    });

    return map;
  }, [matches]);

  function toggleTeam(team: string) {
    setSelectedTeams((current) => {
      if (current.includes(team)) {
        return current.filter((item) => item !== team);
      }

      if (current.length >= 16) {
        return current;
      }

      return [...current, team];
    });
  }

  function generatePredictions() {
    if (selectedTeams.length !== 16) {
      setError("Selecciona exactamente 16 selecciones.");
      return;
    }

    setError("");

    const pairs: Prediction[] = [];

    for (let index = 0; index < selectedTeams.length; index += 2) {
      const home = selectedTeams[index];
      const away = selectedTeams[index + 1];

      const homeStats = statsByTeam.get(home);
      const awayStats = statsByTeam.get(away);

      if (!homeStats || !awayStats) {
        setError("No se encontraron estadísticas de una selección.");
        return;
      }

      pairs.push(predictMatch(homeStats, awayStats));
    }

    setPredictions(pairs);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Octavos de final</Text>
      <Text style={styles.subtitle}>
        Selecciona 16 selecciones. Se formarán 8 cruces en el orden en que las
        elijas.
      </Text>

      <Text style={styles.counter}>
        Seleccionadas: {selectedTeams.length}/16
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar selección..."
        placeholderTextColor="#94A3B8"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={teams}
        keyExtractor={(item) => item.team}
        renderItem={({ item }) => {
          const isSelected = selectedTeams.includes(item.team);

          return (
            <Pressable
              style={[styles.teamButton, isSelected && styles.selected]}
              onPress={() => toggleTeam(item.team)}
            >
              <Text style={styles.teamName}>{item.team}</Text>
              <Text style={styles.teamInfo}>
                {(item.winRate * 100).toFixed(1)}% victorias
              </Text>
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={styles.button}
        onPress={generatePredictions}
      >
        <Text style={styles.buttonText}>Calcular octavos</Text>
      </Pressable>

      {predictions.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Resultados</Text>

          {predictions.map((prediction, index) => (
            <View key={`${prediction.homeTeam}-${prediction.awayTeam}`} style={styles.matchCard}>
              <Text style={styles.matchTitle}>
                Octavos {index + 1}
              </Text>

              <Text style={styles.matchTeams}>
                {prediction.homeTeam} vs {prediction.awayTeam}
              </Text>

              <Text style={styles.probability}>
                {prediction.homeTeam}:{" "}
                {(prediction.homeWinProbability * 100).toFixed(1)}%
              </Text>

              <Text style={styles.probability}>
                Empate: {(prediction.drawProbability * 100).toFixed(1)}%
              </Text>

              <Text style={styles.probability}>
                {prediction.awayTeam}:{" "}
                {(prediction.awayWinProbability * 100).toFixed(1)}%
              </Text>

              <Text style={styles.winner}>
                Ganador previsto: {prediction.predictedWinner}
              </Text>
            </View>
          ))}

          <Link href="/cuartos" style={styles.nextLink}>
            Continuar a cuartos de final
          </Link>
        </View>
      )}
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
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94A3B8",
    marginTop: 6,
    marginBottom: 16,
  },
  counter: {
    color: "#22C55E",
    fontWeight: "700",
    marginBottom: 12,
  },
  search: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  teamButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selected: {
    backgroundColor: "#14532D",
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  teamName: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  teamInfo: {
    color: "#94A3B8",
    fontSize: 12,
  },
  error: {
    color: "#FCA5A5",
    marginTop: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#22C55E",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#052E16",
    fontWeight: "800",
  },
  results: {
    marginTop: 24,
  },
  resultsTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  matchCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  matchTitle: {
    color: "#22C55E",
    fontWeight: "700",
    marginBottom: 6,
  },
  matchTeams: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 8,
  },
  probability: {
    color: "#CBD5E1",
    fontSize: 13,
  },
  winner: {
    color: "#4ADE80",
    fontWeight: "700",
    marginTop: 8,
  },
  nextLink: {
    color: "#93C5FD",
    textAlign: "center",
    marginTop: 16,
  },
  text: {
    color: "#FFFFFF",
  },
});