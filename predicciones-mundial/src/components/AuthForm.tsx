import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, Redirect } from "expo-router";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

type Props = {
  mode: "login" | "register";
};

function getErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Ocurrió un error inesperado. Intenta nuevamente.";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/email-already-in-use":
      return "Este correo ya está registrado. Inicia sesión.";
    case "auth/weak-password":
      return "La contraseña no cumple la política de seguridad del proyecto.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Correo o contraseña incorrectos.";
    case "auth/network-request-failed":
      return "No se pudo conectar. Revisa tu conexión a internet.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento.";
    case "auth/operation-not-allowed":
      return "Activa Email/Password en Firebase Authentication.";
    default:
      return `No se pudo completar la operación (${error.code}).`;
  }
}

export default function AuthForm({ mode }: Props) {
  const { user } = useAuth();
  const isRegister = mode === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  async function handleSubmit() {
    if (busy) return;

    setError("");

    if (!email.trim() || !password) {
      setError("Completa el correo y la contraseña.");
      return;
    }

    if (isRegister && password.length < 6) {
      setError("Usa una contraseña de al menos 6 caracteres.");
      return;
    }

    if (isRegister && password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setBusy(true);

      if (isRegister) {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Predicciones Mundial</Text>

        <Text style={styles.title}>
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </Text>

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!busy}
          accessibilityLabel="Correo electrónico"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu contraseña"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
          accessibilityLabel="Contraseña"
        />

        {isRegister && (
          <>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={confirmation}
              onChangeText={setConfirmation}
              editable={!busy}
              accessibilityLabel="Confirmar contraseña"
            />
          </>
        )}

        {error !== "" && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={handleSubmit}
          style={[styles.button, busy && styles.disabled]}
        >
          <Text style={styles.buttonText}>
            {busy
              ? "Procesando..."
              : isRegister
                ? "Registrarme"
                : "Ingresar"}
          </Text>
        </Pressable>

        <Link
          href={isRegister ? "/login" : "/registro"}
          style={styles.link}
        >
          {isRegister
            ? "¿Ya tienes cuenta? Inicia sesión"
            : "¿No tienes cuenta? Regístrate"}
        </Link>
      </View>
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
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#111827",
    padding: 28,
    borderRadius: 20,
  },
  brand: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },
  label: {
    color: "#CBD5E1",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  error: {
    color: "#FCA5A5",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#22C55E",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#052E16",
    fontWeight: "800",
  },
  link: {
    color: "#93C5FD",
    textAlign: "center",
    marginTop: 20,
  },
});