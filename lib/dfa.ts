// ============================================================
// lib/dfa.ts
// Simulator DFA (Deterministic Finite Automata)
// ============================================================
//
// KONSEP:
// DFA adalah 5-tuple (Q, Sigma, delta, q0, F) di mana delta adalah
// fungsi TOTAL: untuk setiap state dan setiap simbol, ada TEPAT SATU
// state tujuan. Karena itu simulasi DFA selalu deterministik: hanya
// ada SATU jalur eksekusi untuk setiap string input.
//
// PSEUDOCODE:
//   function simulateDFA(dfa, input):
//       current = dfa.q0
//       trace = [ (current, null, null) ]
//       for symbol in input:
//           if symbol not in dfa.alphabet: return REJECT (error)
//           if delta[current][symbol] tidak terdefinisi: return REJECT (no transition)
//           next = delta[current][symbol]
//           trace.append( (current, symbol, next) )
//           current = next
//       return (current in dfa.F), trace

import { DFA, DFASimulationResult, DFATraceStep } from "@/types/automata";

export function validateDFA(dfa: DFA): string | null {
  if (!dfa.states.includes(dfa.startState)) {
    return `Start state "${dfa.startState}" tidak ada di himpunan states.`;
  }
  for (const f of dfa.acceptStates) {
    if (!dfa.states.includes(f)) return `Accept state "${f}" tidak ada di himpunan states.`;
  }
  for (const s of dfa.states) {
    for (const a of dfa.alphabet) {
      const target = dfa.transitions?.[s]?.[a];
      if (target === undefined) {
        return `Transisi tidak lengkap: delta(${s}, ${a}) tidak terdefinisi (DFA harus total).`;
      }
      if (!dfa.states.includes(target)) {
        return `Transisi delta(${s}, ${a}) = "${target}" bukan state yang valid.`;
      }
    }
  }
  return null;
}

export function simulateDFA(dfa: DFA, input: string): DFASimulationResult {
  const err = validateDFA(dfa);
  if (err) return { accepted: false, trace: [], error: err };

  const trace: DFATraceStep[] = [
    { step: 0, currentState: dfa.startState, inputSymbol: null, nextState: null },
  ];

  let current = dfa.startState;

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    if (!dfa.alphabet.includes(symbol)) {
      return {
        accepted: false,
        trace,
        error: `Simbol "${symbol}" pada posisi ${i} tidak ada di alfabet Σ = {${dfa.alphabet.join(", ")}}.`,
      };
    }
    const next = dfa.transitions[current]?.[symbol];
    if (next === undefined) {
      return {
        accepted: false,
        trace,
        error: `Tidak ada transisi δ(${current}, ${symbol}). String ditolak (stuck).`,
      };
    }
    trace.push({ step: i + 1, currentState: current, inputSymbol: symbol, nextState: next });
    current = next;
  }

  return { accepted: dfa.acceptStates.includes(current), trace };
}

// ---------- Contoh & 5 Test Case ----------
// Bahasa: string biner berakhiran "01"
export const exampleDFA_endsWith01: DFA = {
  states: ["q0", "q1", "q2"],
  alphabet: ["0", "1"],
  startState: "q0",
  acceptStates: ["q2"],
  transitions: {
    q0: { "0": "q1", "1": "q0" },
    q1: { "0": "q1", "1": "q2" },
    q2: { "0": "q1", "1": "q0" },
  },
};

export const dfaTestCases: { input: string; expected: boolean }[] = [
  { input: "01", expected: true },
  { input: "001", expected: true },
  { input: "1101", expected: true },
  { input: "10", expected: false },
  { input: "", expected: false },
];

export function runDfaTests() {
  return dfaTestCases.map((tc) => {
    const result = simulateDFA(exampleDFA_endsWith01, tc.input);
    return { ...tc, actual: result.accepted, pass: result.accepted === tc.expected };
  });
}
