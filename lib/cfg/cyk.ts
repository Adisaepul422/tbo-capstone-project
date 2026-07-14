// ============================================================
// lib/cfg/cyk.ts
// Algoritma CYK (Cocke-Younger-Kasami) untuk validasi keanggotaan string
// dalam CFG, + pembangunan parse tree dari tabel CYK.
// ============================================================
//
// SYARAT: CYK bekerja pada grammar dalam bentuk CNF (Chomsky Normal
// Form). Karena itu, sebelum menjalankan CYK, CFG asli dikonversi
// otomatis ke CNF menggunakan convertToCNF() dari lib/cnf/convert.ts.
//
// KONSEP:
// table[len][start] = himpunan variabel yang dapat menurunkan substring
// input[start .. start+len-1].
//   - Basis (len=1): table[1][i] = { A | A -> input[i] ada di grammar }
//   - Induksi (len>1): untuk setiap cara membagi substring menjadi dua
//     bagian (split), table[len][start] menerima variabel A jika ada
//     produksi A -> BC dengan B di bagian kiri dan C di bagian kanan.
// String diterima jika S ada di table[n][0] (n = panjang string).
//
// PSEUDOCODE:
//   for i in 0..n-1: table[1][i] = { A | A->input[i] in P }
//   for len in 2..n:
//     for start in 0..n-len:
//       for split in 1..len-1:
//         B_set = table[split][start]
//         C_set = table[len-split][start+split]
//         for A -> B C in P:
//           if B in B_set and C in C_set:
//             table[len][start].add(A); record backpointer

import { CFG, CYKCell, CYKResult, ParseTreeNode } from "@/types/cfg";
import { convertToCNF } from "../cnf/convert";

export function runCYK(cfg: CFG, input: string): CYKResult {
  const { cnf } = convertToCNF(cfg);
  const n = input.length;

  if (n === 0) {
    const accepted = cnf.productions.some((p) => p.lhs === cnf.startSymbol && p.rhs.length === 0);
    return { accepted, table: [], parseTree: accepted ? { symbol: cnf.startSymbol, children: [], isTerminal: false } : null };
  }

  // table[len][start], len dari 1..n, start dari 0..n-len
  const table: CYKCell[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: n + 1 }, () => ({ variables: new Set<string>(), backpointers: {} }))
  );

  // Basis: substring panjang 1
  for (let i = 0; i < n; i++) {
    const symbol = input[i];
    for (const p of cnf.productions) {
      if (p.rhs.length === 1 && p.rhs[0] === symbol) {
        table[1][i].variables.add(p.lhs);
        table[1][i].backpointers[p.lhs] = { terminal: symbol };
      }
    }
  }

  // Induksi: substring panjang 2..n
  for (let len = 2; len <= n; len++) {
    for (let start = 0; start <= n - len; start++) {
      for (let split = 1; split < len; split++) {
        const leftCell = table[split][start];
        const rightCell = table[len - split][start + split];
        for (const p of cnf.productions) {
          if (p.rhs.length !== 2) continue;
          const [B, C] = p.rhs;
          if (leftCell.variables.has(B) && rightCell.variables.has(C)) {
            table[len][start].variables.add(p.lhs);
            if (!table[len][start].backpointers[p.lhs]) {
              table[len][start].backpointers[p.lhs] = { split: start + split, left: B, right: C };
            }
          }
        }
      }
    }
  }

  const accepted = table[n][0].variables.has(cnf.startSymbol);

  function buildTree(len: number, start: number, variable: string): ParseTreeNode {
    const bp = table[len][start].backpointers[variable];
    if (!bp) return { symbol: variable, children: [], isTerminal: false };
    if ("terminal" in bp) {
      return { symbol: variable, children: [{ symbol: bp.terminal, children: [], isTerminal: true }], isTerminal: false };
    }
    const leftLen = bp.split - start;
    const rightLen = len - leftLen;
    const leftTree = buildTree(leftLen, start, bp.left);
    const rightTree = buildTree(rightLen, bp.split, bp.right);
    return { symbol: variable, children: [leftTree, rightTree], isTerminal: false };
  }

  const parseTree = accepted ? buildTree(n, 0, cnf.startSymbol) : null;

  return { accepted, table, parseTree };
}

// ---------- Test cases (sesuai contoh spesifikasi tugas) ----------
import { exampleCFG_anbn } from "./derivation";

export const exampleCFG_balancedParens: CFG = {
  variables: ["S"],
  terminals: ["(", ")"],
  startSymbol: "S",
  productions: [
    { lhs: "S", rhs: ["S", "S"] },
    { lhs: "S", rhs: ["(", "S", ")"] },
    { lhs: "S", rhs: [] },
  ],
};

export const exampleCFG_aOrB: CFG = {
  variables: ["S"],
  terminals: ["a", "b"],
  startSymbol: "S",
  productions: [
    { lhs: "S", rhs: ["a", "S"] },
    { lhs: "S", rhs: ["b", "S"] },
    { lhs: "S", rhs: ["a"] },
    { lhs: "S", rhs: ["b"] },
  ],
};

export function runCYKTests() {
  const cases: { cfg: CFG; input: string; expected: boolean; label: string }[] = [
    { cfg: exampleCFG_anbn, input: "aabb", expected: true, label: "S->aSb|ε : aabb" },
    { cfg: exampleCFG_balancedParens, input: "(())", expected: true, label: "S->SS|(S)|ε : (())" },
    { cfg: exampleCFG_aOrB, input: "ab", expected: true, label: "S->aS|bS|a|b : ab" },
    { cfg: exampleCFG_anbn, input: "aab", expected: false, label: "S->aSb|ε : aab (harus ditolak)" },
    { cfg: exampleCFG_balancedParens, input: "(()", expected: false, label: "S->SS|(S)|ε : (() (tidak seimbang)" },
  ];
  return cases.map((tc) => {
    const result = runCYK(tc.cfg, tc.input);
    return { ...tc, actual: result.accepted, pass: result.accepted === tc.expected };
  });
}
