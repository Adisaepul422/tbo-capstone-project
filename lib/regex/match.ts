// ============================================================
// lib/regex/match.ts
// Pattern Matching: uji apakah string cocok dengan RE penuh (full match)
// ============================================================
//
// KONSEP:
// Setelah RE dikonversi ke NFA (Thompson's Construction), pencocokan
// string dilakukan dengan MENSIMULASIKAN NFA tsb terhadap seluruh
// string input (full match, bukan search substring). Ini persis sama
// dengan simulasi NFA pada Modul 1.
//
// PSEUDOCODE:
//   function matchRegex(pattern, testString):
//       ast = parseRegex(pattern)
//       nfa = thompson(ast)
//       return simulateNFA(nfa, testString).accepted

import { parseRegex, astToString } from "./parser";
import { regexToNFA } from "./thompson";
import { simulateNFA } from "../nfa";

export interface RegexMatchResult {
  accepted: boolean;
  astString: string;
  nfaStateCount: number;
  error?: string;
}

export function matchRegex(pattern: string, testString: string): RegexMatchResult {
  try {
    const ast = parseRegex(pattern);
    const { nfa } = regexToNFA(ast);
    const result = simulateNFA(nfa, testString);
    return {
      accepted: result.accepted,
      astString: astToString(ast),
      nfaStateCount: nfa.states.length,
      error: result.error,
    };
  } catch (e: any) {
    return { accepted: false, astString: "", nfaStateCount: 0, error: e.message };
  }
}

/**
 * Menampilkan grammar reguler (Tipe 3) yang setara dengan RE sederhana
 * berbentuk (a|b)*c, a*b, dst. Pendekatan: bangun grammar dari NFA hasil
 * Thompson's construction secara langsung.
 *   Untuk setiap transisi delta(q, a) = p   => produksi  Q -> a P
 *   Untuk setiap accept state q             => produksi  Q -> ε
 */
export function regexToRegularGrammar(pattern: string): string[] {
  const ast = parseRegex(pattern);
  const { nfa } = regexToNFA(ast);
  const lines: string[] = [];
  for (const state of nfa.states) {
    const rhs: string[] = [];
    for (const symbol of Object.keys(nfa.transitions[state] || {})) {
      for (const target of nfa.transitions[state][symbol]) {
        rhs.push(symbol === "ε" ? target.toUpperCase() : `${symbol}${target.toUpperCase()}`);
      }
    }
    if (nfa.acceptStates.includes(state)) rhs.push("ε");
    if (rhs.length > 0) lines.push(`${state.toUpperCase()} -> ${rhs.join(" | ")}`);
  }
  return lines;
}

// ---------- 5 Test Case (sesuai contoh pada spesifikasi tugas) ----------
export const regexTestCases: { pattern: string; input: string; expected: boolean }[] = [
  { pattern: "a*b", input: "aaab", expected: true },
  { pattern: "(a|b)*abb", input: "aabb", expected: true },
  { pattern: "(0|1)*", input: "101", expected: true },
  { pattern: "a+b", input: "a", expected: false },
  { pattern: "a*b", input: "ba", expected: false },
];

export function runRegexTests() {
  return regexTestCases.map((tc) => {
    const result = matchRegex(tc.pattern, tc.input);
    return { ...tc, actual: result.accepted, pass: result.accepted === tc.expected };
  });
}
