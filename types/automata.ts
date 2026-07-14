// ============================================================
// types/automata.ts
// Definisi tipe untuk DFA, NFA, Moore Machine, Mealy Machine
// ============================================================

export const EPSILON = "ε";

/** DFA: delta adalah fungsi total Q x Sigma -> Q (direpresentasikan sebagai map state->symbol->state) */
export interface DFA {
  states: string[]; // Q
  alphabet: string[]; // Sigma
  transitions: Record<string, Record<string, string>>; // delta[state][symbol] = state
  startState: string; // q0
  acceptStates: string[]; // F
}

/** NFA: delta: Q x (Sigma U {epsilon}) -> P(Q) */
export interface NFA {
  states: string[];
  alphabet: string[]; // tidak termasuk epsilon
  transitions: Record<string, Record<string, string[]>>; // delta[state][symbol|EPSILON] = state[]
  startState: string;
  acceptStates: string[];
}

/** Moore Machine: output bergantung hanya pada state */
export interface MooreMachine {
  states: string[];
  alphabet: string[];
  transitions: Record<string, Record<string, string>>; // delta[state][symbol] = state
  startState: string;
  outputAlphabet: string[];
  stateOutput: Record<string, string>; // lambda: Q -> Output
}

/** Mealy Machine: output bergantung pada state DAN symbol input */
export interface MealyMachine {
  states: string[];
  alphabet: string[];
  transitions: Record<string, Record<string, string>>; // delta[state][symbol] = state
  startState: string;
  outputAlphabet: string[];
  output: Record<string, Record<string, string>>; // lambda[state][symbol] = output
}

// ---------- Hasil simulasi ----------

export interface DFATraceStep {
  step: number;
  currentState: string;
  inputSymbol: string | null; // null untuk step awal
  nextState: string | null;
}

export interface DFASimulationResult {
  accepted: boolean;
  trace: DFATraceStep[];
  error?: string;
}

export interface NFAPathStep {
  state: string;
  via: string | null; // simbol yang dipakai untuk sampai ke state ini (EPSILON mungkin)
}

export interface NFAPath {
  steps: NFAPathStep[];
  accepted: boolean;
}

export interface NFASimulationResult {
  accepted: boolean;
  allPaths: NFAPath[]; // seluruh jalur yang dieksplorasi (untuk visualisasi non-determinisme)
  acceptingPaths: NFAPath[];
  error?: string;
}

export interface SubsetConstructionStep {
  stepNumber: number;
  fromDfaState: string[]; // himpunan NFA states yang mewakili 1 DFA state
  symbol: string;
  toDfaState: string[];
  explanation: string;
}

export interface SubsetConstructionResult {
  dfa: DFA;
  steps: SubsetConstructionStep[];
  stateNameMap: Record<string, string[]>; // nama DFA state -> himpunan NFA states asal
}

export interface MooreSimulationResult {
  outputs: string[]; // output per state yang dilalui (panjang = |input|+1)
  states: string[];
  accepted: boolean; // opsional: berdasarkan acceptStates jika didefinisikan terpisah
}

export interface MealySimulationResult {
  outputs: string[]; // output per transisi (panjang = |input|)
  states: string[];
}
