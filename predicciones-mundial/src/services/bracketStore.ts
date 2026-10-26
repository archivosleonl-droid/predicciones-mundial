import type { Prediction } from "../utils/predictions";

type BracketState = {
  roundOf16Winners: string[];
  quarterFinals: Prediction[];
  semiFinals: Prediction[];
  final: Prediction | null;
  champion: string | null;
};

let bracket: BracketState = {
  roundOf16Winners: [],
  quarterFinals: [],
  semiFinals: [],
  final: null,
  champion: null,
};

export function setRoundOf16Winners(winners: string[]) {
  bracket = {
    ...bracket,
    roundOf16Winners: winners,
    quarterFinals: [],
    semiFinals: [],
    final: null,
    champion: null,
  };
}

export function getRoundOf16Winners(): string[] {
  return bracket.roundOf16Winners;
}

export function setQuarterFinals(predictions: Prediction[]) {
  bracket = {
    ...bracket,
    quarterFinals: predictions,
  };
}

export function getQuarterFinals(): Prediction[] {
  return bracket.quarterFinals;
}

export function setSemiFinals(predictions: Prediction[]) {
  bracket = {
    ...bracket,
    semiFinals: predictions,
  };
}

export function getSemiFinals(): Prediction[] {
  return bracket.semiFinals;
}

export function setFinal(prediction: Prediction) {
  bracket = {
    ...bracket,
    final: prediction,
  };
}

export function getFinal(): Prediction | null {
  return bracket.final;
}

export function setChampion(team: string) {
  bracket = {
    ...bracket,
    champion: team,
  };
}

export function getChampion(): string | null {
  return bracket.champion;
}