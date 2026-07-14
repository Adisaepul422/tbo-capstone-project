// ============================================================
// lib/cfg/derivation.ts
// Leftmost & Rightmost Derivation untuk CFG
// ============================================================
//
// KONSEP:
// Derivasi adalah proses menurunkan string terminal dari simbol awal S
// dengan berulang kali mengganti satu variabel menggunakan salah satu
// produksinya.
//   - Leftmost derivation: SELALU ganti variabel PALING KIRI dalam
//     bentuk sentensial saat ini.
//   - Rightmost derivation: SELALU ganti variabel PALING KANAN.
//
// Karena CFG bisa ambigu / memiliki banyak pilihan produksi, di sini
// kita gunakan pencarian (DFS berbatas kedalaman) untuk MENEMUKAN
// SATU derivasi yang menghasilkan target string (jika ada).
//
// PSEUDOCODE (leftmost, mirip untuk rightmost tinggal balik arah pencarian):
//   function derive(cfg, target, mode):
//       start = [cfg.startSymbol]
//       return dfs(start, [], maxDepth)
//
//   function dfs(sentential, stepsSoFar, depthLeft):
//       if sentential adalah semua terminal:
//           return sentential == target ? stepsSoFar : FAIL
//       if depthLeft == 0: return FAIL
//       idx = mode==leftmost ? indexOf pertama variabel : indexOf terakhir variabel
//       for setiap produksi P dengan lhs == sentential[idx]:
//           newSentential = replace sentential[idx] dengan P.rhs
//           if newSentential adalah prefix yang konsisten menuju target (pruning):
//               hasil = dfs(newSentential, stepsSoFar + [step], depthLeft-1)
//               if hasil != FAIL: return hasil
//       return FAIL

import { CFG, DerivationResult, DerivationStep } from "@/types/cfg";

function isVariable(cfg: CFG, symbol: string): boolean {
  return cfg.variables.includes(symbol);
}

function sententialToTerminalString(cfg: CFG, sentential: string[]): string | null {
  if (sentential.some((s) => isVariable(cfg, s))) return null;
  return sentential.join("");
}

/** Pruning sederhana: jumlah terminal pada sentential tidak boleh melebihi panjang target,
 *  dan urutan terminal yang sudah pasti (tanpa variabel di antaranya di ujung kiri/kanan)
 *  harus konsisten dengan target. Ini heuristik untuk mempersempit ruang pencarian. */
function terminalCount(cfg: CFG, sentential: string[]): number {
  return sentential.filter((s) => !isVariable(cfg, s)).length;
}

export function deriveString(
  cfg: CFG,
  target: string,
  mode: "leftmost" | "rightmost",
  maxDepth = 60
): DerivationResult {
  const steps: DerivationStep[] = [];

  function findIndex(sentential: string[]): number {
    if (mode === "leftmost") {
      return sentential.findIndex((s) => isVariable(cfg, s));
    } else {
      for (let i = sentential.length - 1; i >= 0; i--) {
        if (isVariable(cfg, sentential[i])) return i;
      }
      return -1;
    }
  }

  const visited = new Set<string>();

  function dfs(sentential: string[], depth: number, trail: DerivationStep[]): DerivationStep[] | null {
    const key = sentential.join(" ") + `@${depth}`;
    if (visited.has(key)) return null;
    visited.add(key);

    const asTerminal = sententialToTerminalString(cfg, sentential);
    if (asTerminal !== null) {
      return asTerminal === target ? trail : null;
    }
    if (depth <= 0) return null;
    if (terminalCount(cfg, sentential) > target.length) return null;

    const idx = findIndex(sentential);
    if (idx === -1) return null;
    const variable = sentential[idx];

    const candidates = cfg.productions.filter((p) => p.lhs === variable);
    for (const prod of candidates) {
      const rhs = prod.rhs.length === 0 ? [] : prod.rhs;
      const newSentential = [...sentential.slice(0, idx), ...rhs, ...sentential.slice(idx + 1)];
      const stepStr = `${variable} -> ${prod.rhs.length === 0 ? "ε" : prod.rhs.join("")}`;
      const newTrail = [
        ...trail,
        {
          step: trail.length + 1,
          sentential: newSentential.length === 0 ? "ε" : newSentential.join(""),
          productionUsed: stepStr,
          replacedIndex: idx,
        },
      ];
      const result = dfs(newSentential, depth - 1, newTrail);
      if (result) return result;
    }
    return null;
  }

  const result = dfs([cfg.startSymbol], maxDepth, []);
  if (!result) {
    return { success: false, steps: [], finalString: target, error: `Tidak ditemukan derivasi ${mode} untuk string "${target}" (dalam batas kedalaman ${maxDepth}).` };
  }
  return { success: true, steps: result, finalString: target };
}

// ---------- Test cases ----------
export const exampleCFG_anbn: CFG = {
  variables: ["S"],
  terminals: ["a", "b"],
  startSymbol: "S",
  productions: [
    { lhs: "S", rhs: ["a", "S", "b"] },
    { lhs: "S", rhs: [] },
  ],
};

export function runDerivationTests() {
  const cases = [
    { input: "aabb", mode: "leftmost" as const, expected: true },
    { input: "ab", mode: "leftmost" as const, expected: true },
    { input: "", mode: "leftmost" as const, expected: true },
    { input: "aaabbb", mode: "rightmost" as const, expected: true },
    { input: "aab", mode: "leftmost" as const, expected: false },
  ];
  return cases.map((tc) => {
    const result = deriveString(exampleCFG_anbn, tc.input, tc.mode);
    return { ...tc, actual: result.success, pass: result.success === tc.expected };
  });
}
