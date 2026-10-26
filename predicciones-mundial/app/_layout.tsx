import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function Navigation() {
  const { loading, sessionError } = useAuth();

  if (loading || sessionError) {
    return (
      <View style={styles.center}>
        {sessionError ? (
          <Text style={styles.error}>{sessionError}</Text>
        ) : (
          <>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.text}>Cargando sesión...</Text>
          </>
        )}
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0B1120",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    color: "#FFFFFF",
    marginTop: 12,
  },
  error: {
    color: "#FCA5A5",
    textAlign: "center",
  },
});