import { useState } from "react";
import { Redirect } from "expo-router";
import { signOut } from "firebase/auth";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { auth } from "../src/services/firebase";
import { useAuth } from "../src/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) {
    return <Redirect href="/login" />;
  }

  async function handleLogout() {
    try {
      setError("");
      setBusy(true);
      await signOut(auth);
    } catch {
      setError("No se pudo cerrar la sesión. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.text}>Sesión iniciada como: {user.email}</Text>

      <Text style={styles.text}>
        Aquí mostraremos las estadísticas y predicciones del Mundial.
      </Text>

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={handleLogout}
        disabled={busy}
      >
        <Text style={styles.buttonText}>
          {busy ? "Cerrando sesión..." : "Cerrar sesión"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1120",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#22C55E",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
  },
  text: {
    color: "#CBD5E1",
    textAlign: "center",
    marginBottom: 16,
  },
  error: {
    color: "#FCA5A5",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FCA5A5",
    fontWeight: "700",
  },
});