// ============================================================
// lib/mooreMealy.ts
// Simulator Moore Machine & Mealy Machine (bonus fitur FSA)
// ============================================================
//
// KONSEP:
// - Moore Machine: output(state) -> lambda: Q -> Output. Output
//   dihasilkan SETIAP kali mesin berada di suatu state (termasuk state
//   awal, sebelum membaca input apapun). Panjang output = panjang input + 1.
// - Mealy Machine: output(state, symbol) -> lambda: Q x Sigma -> Output.
//   Output dihasilkan PADA SETIAP TRANSISI. Panjang output = panjang input.

import { MealyMachine, MealySimulationResult, MooreMachine, MooreSimulationResult } from "@/types/automata";

export function simulateMoore(m: MooreMachine, input: string): MooreSimulationResult {
  let current = m.startState;
  const states = [current];
  const outputs = [m.stateOutput[current]];

  for (const symbol of input) {
    const next = m.transitions[current]?.[symbol];
    if (next === undefined) {
      return { outputs, states, accepted: false };
    }
    current = next;
    states.push(current);
    outputs.push(m.stateOutput[current]);
  }
  return { outputs, states, accepted: true };
}

export function simulateMealy(m: MealyMachine, input: string): MealySimulationResult {
  let current = m.startState;
  const states = [current];
  const outputs: string[] = [];

  for (const symbol of input) {
    const out = m.output[current]?.[symbol];
    const next = m.transitions[current]?.[symbol];
    if (out === undefined || next === undefined) break;
    outputs.push(out);
    current = next;
    states.push(current);
  }
  return { outputs, states };
}

// ---------- Contoh: Mealy machine "increment biner" & test ----------
// Mealy: mendeteksi setiap kemunculan '1' -> output 'X', selain itu output 'Y'
export const exampleMealy: MealyMachine = {
  states: ["s0"],
  alphabet: ["0", "1"],
  startState: "s0",
  outputAlphabet: ["X", "Y"],
  transitions: { s0: { "0": "s0", "1": "s0" } },
  output: { s0: { "0": "Y", "1": "X" } },
};

export const exampleMoore: MooreMachine = {
  // Moore: menghitung paritas jumlah '1' (genap='E', ganjil='O')
  states: ["even", "odd"],
  alphabet: ["0", "1"],
  startState: "even",
  outputAlphabet: ["E", "O"],
  stateOutput: { even: "E", odd: "O" },
  transitions: {
    even: { "0": "even", "1": "odd" },
    odd: { "0": "odd", "1": "even" },
  },
};

export function runMealyTests() {
  const cases = [
    { input: "101", expected: ["X", "Y", "X"] },
    { input: "000", expected: ["Y", "Y", "Y"] },
    { input: "111", expected: ["X", "X", "X"] },
    { input: "", expected: [] },
    { input: "0101", expected: ["Y", "X", "Y", "X"] },
  ];
  return cases.map((tc) => {
    const result = simulateMealy(exampleMealy, tc.input);
    return { ...tc, actual: result.outputs, pass: JSON.stringify(result.outputs) === JSON.stringify(tc.expected) };
  });
}

export function runMooreTests() {
  const cases = [
    { input: "11", expectedFinal: "E" }, // 2 buah '1' -> genap
    { input: "1", expectedFinal: "O" },
    { input: "111", expectedFinal: "O" },
    { input: "", expectedFinal: "E" },
    { input: "1010", expectedFinal: "E" },
  ];
  return cases.map((tc) => {
    const result = simulateMoore(exampleMoore, tc.input);
    const final = result.outputs[result.outputs.length - 1];
    return { ...tc, actual: final, pass: final === tc.expectedFinal };
  });
}
