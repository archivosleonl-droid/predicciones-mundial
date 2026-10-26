import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Prediction } from "../utils/predictions";

export type BracketData = {
  roundOf16: Prediction[];
  roundOf16Winners: string[];
  quarterFinals: Prediction[];
  semiFinals: Prediction[];
  final: Prediction | null;
  champion: string | null;
  updatedAt: string;
};

function createEmptyBracket(): BracketData {
  return {
    roundOf16: [],
    roundOf16Winners: [],
    quarterFinals: [],
    semiFinals: [],
    final: null,
    champion: null,
    updatedAt: new Date().toISOString(),
  };
}

let currentBracket = createEmptyBracket();
let currentUserId: string | null = null;

function requireUser(userId: string) {
  if (auth.currentUser?.uid !== userId) {
    throw new Error("Debes iniciar sesión para acceder al bracket.");
  }

  if (currentUserId !== userId) {
    currentBracket = createEmptyBracket();
    currentUserId = userId;
  }
}

function readBracket(): BracketData {
  const userId = auth.currentUser?.uid ?? null;

  if (currentUserId !== userId) {
    currentBracket = createEmptyBracket();
    currentUserId = userId;
  }

  return currentBracket;
}

function updateLocalBracket(patch: Partial<BracketData>) {
  const previous = readBracket();

  currentBracket = {
    ...previous,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function getCurrentBracket(): BracketData {
  return readBracket();
}

export async function loadBracket(
  userId: string
): Promise<BracketData> {
  requireUser(userId);

  const snapshot = await getDoc(doc(db, "brackets", userId));

  // Evita cargar datos si el usuario cambió durante la consulta.
  if (auth.currentUser?.uid !== userId) {
    throw new Error("La sesión cambió durante la carga.");
  }

  const data = snapshot.exists()
    ? (snapshot.data() as Partial<BracketData>)
    : {};

  currentUserId = userId;
  currentBracket = {
    ...createEmptyBracket(),
    ...data,
    roundOf16: data.roundOf16 ?? [],
    roundOf16Winners: data.roundOf16Winners ?? [],
    quarterFinals: data.quarterFinals ?? [],
    semiFinals: data.semiFinals ?? [],
    final: data.final ?? null,
    champion: data.champion ?? null,
  };

  return currentBracket;
}

export async function saveBracket(
  userId: string,
  patch: Partial<BracketData>
): Promise<void> {
  requireUser(userId);
  updateLocalBracket(patch);

  const snapshot: BracketData = {
    ...currentBracket,
  };

  await setDoc(doc(db, "brackets", userId), snapshot);
}

export async function resetBracket(
  userId: string
): Promise<void> {
  requireUser(userId);
  currentBracket = createEmptyBracket();

  await setDoc(doc(db, "brackets", userId), currentBracket);
}

// Funciones compatibles con las pantallas existentes.

export function getRoundOf16(): Prediction[] {
  return readBracket().roundOf16;
}

export function getRoundOf16Winners(): string[] {
  return readBracket().roundOf16Winners;
}

export function setRoundOf16Winners(winners: string[]) {
  updateLocalBracket({
    roundOf16: [],
    roundOf16Winners: winners,
    quarterFinals: [],
    semiFinals: [],
    final: null,
    champion: null,
  });
}

export function getQuarterFinals(): Prediction[] {
  return readBracket().quarterFinals;
}

export function setQuarterFinals(predictions: Prediction[]) {
  updateLocalBracket({
    quarterFinals: predictions,
    semiFinals: [],
    final: null,
    champion: null,
  });
}

export function getSemiFinals(): Prediction[] {
  return readBracket().semiFinals;
}

export function setSemiFinals(predictions: Prediction[]) {
  updateLocalBracket({
    semiFinals: predictions,
    final: null,
    champion: null,
  });
}

export function getFinal(): Prediction | null {
  return readBracket().final;
}

export function setFinal(prediction: Prediction) {
  updateLocalBracket({
    final: prediction,
    champion: null,
  });
}

export function getChampion(): string | null {
  return readBracket().champion;
}

export function setChampion(team: string) {
  updateLocalBracket({
    champion: team,
  });
}