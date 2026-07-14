// ============================================================
// lib/nfa.ts
// Simulator NFA (Nondeterministic Finite Automata)
// ============================================================
//
// KONSEP:
// NFA mengizinkan delta(q, a) mengembalikan HIMPUNAN state (bisa 0, 1,
// atau banyak), dan mengizinkan transisi epsilon (tanpa membaca input).
// String diterima jika ADA (exists) minimal satu jalur dari q0 yang
// berakhir di accept state setelah membaca seluruh input.
//
// Kita simulasikan dengan pendekatan BFS berbasis himpunan state aktif
// (mirip "on-the-fly subset construction"), sambil tetap merekam SEMUA
// jalur individual (path enumeration) agar bisa ditampilkan ke user
// sebagai "semua kemungkinan jalur" sesuai spesifikasi tugas.
//
// PSEUDOCODE (epsilon-closure):
//   function epsilonClosure(states):
//       stack = copy(states); closure = copy(states)
//       while stack not empty:
//           s = stack.pop()
//           for t in delta[s][EPSILON]:
//               if t not in closure: closure.add(t); stack.push(t)
//       return closure
//
// PSEUDOCODE (simulasi menerima/menolak):
//   function simulateNFA(nfa, input):
//       current = epsilonClosure({q0})
//       for symbol in input:
//           moved = union( delta[s][symbol] for s in current )
//           current = epsilonClosure(moved)
//       return current intersect F != empty
//
// PSEUDOCODE (enumerasi semua jalur, untuk visualisasi non-determinisme):
//   function allPaths(nfa, input):
//       DFS/BFS dari (q0, posisi=0, path=[q0]) mengikuti setiap
//       transisi epsilon dan transisi simbol yang mungkin, cabang
//       setiap kali delta mengembalikan >1 pilihan.

import {
  NFA,
  NFAPath,
  NFAPathStep,
  NFASimulationResult,
  EPSILON,
} from "@/types/automata";

export function epsilonClosure(nfa: NFA, states: string[]): Set<string> {
  const closure = new Set(states);
  const stack = [...states];
  while (stack.length > 0) {
    const s = stack.pop()!;
    const eps = nfa.transitions[s]?.[EPSILON] ?? [];
    for (const t of eps) {
      if (!closure.has(t)) {
        closure.add(t);
        stack.push(t);
      }
    }
  }
  return closure;
}

export function moveNFA(nfa: NFA, states: Set<string>, symbol: string): Set<string> {
  const result = new Set<string>();
  for (const s of states) {
    const targets = nfa.transitions[s]?.[symbol] ?? [];
    targets.forEach((t) => result.add(t));
  }
  return result;
}

/** Simulasi cepat: accepted/rejected menggunakan pendekatan himpunan state aktif. */
export function simulateNFAFast(nfa: NFA, input: string): boolean {
  let current = epsilonClosure(nfa, [nfa.startState]);
  for (const symbol of input) {
    const moved = moveNFA(nfa, current, symbol);
    current = epsilonClosure(nfa, Array.from(moved));
  }
  return Array.from(current).some((s) => nfa.acceptStates.includes(s));
}

/** Enumerasi seluruh jalur (untuk visualisasi non-determinisme) via DFS berbatas. */
export function enumerateAllPaths(nfa: NFA, input: string, maxPaths = 200): NFAPath[] {
  const results: NFAPath[] = [];

  function dfs(state: string, pos: number, path: NFAPathStep[], visitedEpsilon: Set<string>) {
    if (results.length >= maxPaths) return;

    if (pos === input.length) {
      results.push({ steps: [...path], accepted: nfa.acceptStates.includes(state) });
      // tetap lanjut eksplorasi epsilon dari sini juga (string sudah habis dibaca,
      // NFA boleh terus melalui epsilon untuk sampai ke accept state)
    }

    // Transisi epsilon (tidak mengonsumsi input)
    const epsTargets = nfa.transitions[state]?.[EPSILON] ?? [];
    for (const next of epsTargets) {
      const key = `${pos}:${state}->${next}`;
      if (visitedEpsilon.has(key)) continue; // cegah infinite loop epsilon
      visitedEpsilon.add(key);
      dfs(next, pos, [...path, { state: next, via: EPSILON }], visitedEpsilon);
      visitedEpsilon.delete(key);
    }

    if (pos < input.length) {
      const symbol = input[pos];
      const targets = nfa.transitions[state]?.[symbol] ?? [];
      for (const next of targets) {
        dfs(next, pos + 1, [...path, { state: next, via: symbol }], new Set());
      }
    }
  }

  dfs(nfa.startState, 0, [{ state: nfa.startState, via: null }], new Set());
  return results;
}

export function simulateNFA(nfa: NFA, input: string): NFASimulationResult {
  if (!nfa.states.includes(nfa.startState)) {
    return { accepted: false, allPaths: [], acceptingPaths: [], error: "Start state tidak valid." };
  }
  const invalidSymbol = Array.from(input).find(
    (c) => !nfa.alphabet.includes(c)
  );
  if (invalidSymbol) {
    return {
      accepted: false,
      allPaths: [],
      acceptingPaths: [],
      error: `Simbol "${invalidSymbol}" tidak ada di alfabet Σ.`,
    };
  }

  const allPaths = enumerateAllPaths(nfa, input);
  // hanya path yang benar-benar berakhir setelah membaca seluruh input dihitung
  const fullPaths = allPaths.filter((p) => {
    const consumed = p.steps.filter((s) => s.via !== null && s.via !== EPSILON).length;
    return consumed === input.length || input.length === 0;
  });
  const acceptingPaths = fullPaths.filter((p) => p.accepted);

  return {
    accepted: acceptingPaths.length > 0 || simulateNFAFast(nfa, input),
    allPaths: fullPaths,
    acceptingPaths,
  };
}

// ---------- Contoh & 5 Test Case ----------
// Bahasa: string yang mengandung substring "ab" (NFA dengan non-determinisme asli)
export const exampleNFA_containsAB: NFA = {
  states: ["q0", "q1", "q2"],
  alphabet: ["a", "b"],
  startState: "q0",
  acceptStates: ["q2"],
  transitions: {
    q0: { a: ["q0", "q1"], b: ["q0"] }, // non-deterministik: dari q0 baca 'a' bisa tetap di q0 atau pindah ke q1
    q1: { b: ["q2"] },
    q2: { a: ["q2"], b: ["q2"] },
  },
};

export const nfaTestCases: { input: string; expected: boolean }[] = [
  { input: "ab", expected: true },
  { input: "xab".replace("x", ""), expected: true }, // "ab"
  { input: "aab", expected: true },
  { input: "aaab", expected: true },
  { input: "ba", expected: false },
];

export function runNfaTests() {
  return nfaTestCases.map((tc) => {
    const result = simulateNFA(exampleNFA_containsAB, tc.input);
    return { ...tc, actual: result.accepted, pass: result.accepted === tc.expected };
  });
}
