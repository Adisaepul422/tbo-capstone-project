// ============================================================
// lib/subsetConstruction.ts
// Konversi NFA -> DFA (Subset Construction / Lazy Powerset)
// ============================================================
//
// KONSEP:
// Setiap DFA state adalah HIMPUNAN dari NFA states (subset of Q_NFA).
// Kita mulai dari epsilon-closure({q0}) sebagai DFA start state, lalu
// untuk setiap DFA state dan setiap simbol alfabet, hitung:
//     target = epsilonClosure( union( delta_NFA[s][symbol] for s in currentSet ) )
// Jika target adalah himpunan baru, tambahkan sebagai DFA state baru.
// Ulangi sampai tidak ada himpunan baru yang muncul.
// DFA accept states = semua himpunan yang mengandung minimal 1 NFA
// accept state.
//
// PSEUDOCODE:
//   function subsetConstruction(nfa):
//       start = epsilonClosure({nfa.q0})
//       queue = [start]; dfaStates = {start}
//       while queue not empty:
//           S = queue.pop()
//           for symbol in nfa.alphabet:
//               T = epsilonClosure( move(S, symbol) )
//               if T is empty: continue        // trap/tidak ada transisi
//               record transition S --symbol--> T
//               if T not in dfaStates:
//                   dfaStates.add(T); queue.push(T)
//       F_dfa = { S in dfaStates | S intersect F_nfa != empty }
//       return DFA(dfaStates, alphabet, transitions, start, F_dfa)

import { DFA, NFA, SubsetConstructionResult, SubsetConstructionStep } from "@/types/automata";
import { epsilonClosure, moveNFA } from "./nfa";

function setKey(s: Set<string>): string {
  return Array.from(s).sort().join(",");
}
function setName(s: Set<string>): string {
  const arr = Array.from(s).sort();
  return arr.length === 0 ? "∅" : `{${arr.join(",")}}`;
}

export function nfaToDfa(nfa: NFA): SubsetConstructionResult {
  const steps: SubsetConstructionStep[] = [];
  const stateNameMap: Record<string, string[]> = {};

  const startSet = epsilonClosure(nfa, [nfa.startState]);
  const startKey = setKey(startSet);
  const startName = setName(startSet);
  stateNameMap[startName] = Array.from(startSet);

  const discovered = new Map<string, Set<string>>(); // key -> set
  discovered.set(startKey, startSet);
  const queue: Set<string>[] = [startSet];
  const dfaStates = new Set<string>([startName]);
  const transitions: Record<string, Record<string, string>> = {};
  let stepNumber = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentName = setName(current);
    transitions[currentName] = transitions[currentName] || {};

    for (const symbol of nfa.alphabet) {
      const moved = moveNFA(nfa, current, symbol);
      if (moved.size === 0) continue; // tidak ada transisi -> dead state, kita skip (opsional: bisa tambahkan trap state)
      const target = epsilonClosure(nfa, Array.from(moved));
      const targetKey = setKey(target);
      const targetName = setName(target);

      stepNumber++;
      steps.push({
        stepNumber,
        fromDfaState: Array.from(current).sort(),
        symbol,
        toDfaState: Array.from(target).sort(),
        explanation: `δ'(${currentName}, ${symbol}) = ε-closure(move(${currentName}, ${symbol})) = ${targetName}`,
      });

      transitions[currentName][symbol] = targetName;

      if (!discovered.has(targetKey)) {
        discovered.set(targetKey, target);
        stateNameMap[targetName] = Array.from(target);
        dfaStates.add(targetName);
        queue.push(target);
      }
    }
  }

  const acceptStates = Array.from(dfaStates).filter((name) =>
    stateNameMap[name].some((s) => nfa.acceptStates.includes(s))
  );

  const dfa: DFA = {
    states: Array.from(dfaStates),
    alphabet: nfa.alphabet,
    startState: startName,
    acceptStates,
    transitions,
  };

  return { dfa, steps, stateNameMap };
}

// ---------- Test: konversi exampleNFA_containsAB dan cek konsistensi hasil ----------
import { exampleNFA_containsAB, nfaTestCases, simulateNFAFast } from "./nfa";
import { simulateDFA } from "./dfa";

export function runSubsetConstructionTests() {
  const { dfa } = nfaToDfa(exampleNFA_containsAB);
  return nfaTestCases.map((tc) => {
    const nfaResult = simulateNFAFast(exampleNFA_containsAB, tc.input);
    const dfaResult = simulateDFA(dfa, tc.input).accepted;
    return {
      input: tc.input,
      expected: tc.expected,
      nfaResult,
      dfaResult,
      // DFA hasil konversi HARUS ekuivalen dengan NFA asli
      pass: nfaResult === dfaResult && dfaResult === tc.expected,
    };
  });
}
