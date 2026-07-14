// ============================================================
// lib/cnf/convert.ts
// Konversi CFG sembarang -> Chomsky Normal Form (CNF)
// ============================================================
//
// CNF mensyaratkan setiap produksi berbentuk:
//   A -> BC   (dua variabel)
//   A -> a    (satu terminal)
//   S -> ε    (hanya untuk simbol awal, jika ε ada di bahasa)
//
// TAHAPAN (harus dilakukan berurutan):
//   1. START:      Buat S0 baru -> S lama, agar S tidak muncul di RHS manapun
//                  (memudahkan penanganan S -> ε).
//   2. NULLABLE:   Hilangkan produksi A -> ε (kecuali S0 -> ε bila ε in L(G)),
//                  dengan menambahkan versi produksi tanpa setiap kombinasi
//                  variabel nullable yang dihilangkan.
//   3. UNIT:       Hilangkan produksi A -> B (B variabel tunggal) dengan
//                  "mewariskan" langsung semua produksi non-unit dari B ke A.
//   4. USELESS:    Hilangkan simbol yang unreachable (tidak bisa dicapai dari
//                  S) dan unproductive (tidak bisa menghasilkan string terminal).
//   5. BIN:        Pecah RHS panjang > 2 menjadi rangkaian produksi biner
//                  menggunakan variabel bantu A1, A2, ...
//   6. TERM:       Ganti terminal yang muncul bersama simbol lain di RHS
//                  (misal A -> aB) dengan variabel baru: A -> Xa B, Xa -> a.
//
// PSEUDOCODE convertToCNF(cfg):
//   g = addNewStartSymbol(cfg)
//   g = eliminateNullableProductions(g)
//   g = eliminateUnitProductions(g)
//   g = eliminateUselessSymbols(g)
//   g = handleTerminals(g)      // dilakukan sebelum binarize agar RHS panjang>2 hanya berisi variabel
//   g = binarizeProductions(g)
//   return g

import { CFG, Production } from "@/types/cfg";
import { CNFConversionResult, CNFConversionStep } from "@/types/cnf";

let helperCounter = 0;
function freshVar(prefix: string, existing: Set<string>): string {
  let name = `${prefix}${helperCounter++}`;
  while (existing.has(name)) name = `${prefix}${helperCounter++}`;
  existing.add(name);
  return name;
}

function cloneCFG(cfg: CFG): CFG {
  return JSON.parse(JSON.stringify(cfg));
}

function prodKey(p: Production): string {
  return `${p.lhs}->${p.rhs.join(",")}`;
}
function dedupe(productions: Production[]): Production[] {
  const seen = new Set<string>();
  const result: Production[] = [];
  for (const p of productions) {
    const k = prodKey(p);
    if (!seen.has(k)) {
      seen.add(k);
      result.push(p);
    }
  }
  return result;
}

// ---------- STEP 0: START SYMBOL ISOLATION ----------
export function addNewStartSymbol(cfg: CFG): CFG {
  const g = cloneCFG(cfg);
  const newStart = "S0";
  if (!g.variables.includes(newStart)) {
    g.variables.unshift(newStart);
    g.productions.unshift({ lhs: newStart, rhs: [g.startSymbol] });
    g.startSymbol = newStart;
  }
  return g;
}

// ---------- STEP 1: NULLABLE PRODUCTIONS ----------
export function findNullableVariables(cfg: CFG): Set<string> {
  const nullable = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of cfg.productions) {
      if (nullable.has(p.lhs)) continue;
      if (p.rhs.length === 0 || p.rhs.every((s) => nullable.has(s))) {
        nullable.add(p.lhs);
        changed = true;
      }
    }
  }
  return nullable;
}

function subsetsToOmit(rhs: string[], nullable: Set<string>): string[][] {
  // Hasilkan seluruh kombinasi RHS dengan menghilangkan 0..n simbol nullable
  const nullablePositions = rhs.map((s, i) => (nullable.has(s) ? i : -1)).filter((i) => i !== -1);
  const results: string[][] = [];
  const totalCombos = 1 << nullablePositions.length;
  for (let mask = 0; mask < totalCombos; mask++) {
    const omit = new Set<number>();
    nullablePositions.forEach((pos, bitIdx) => {
      if (mask & (1 << bitIdx)) omit.add(pos);
    });
    const newRhs = rhs.filter((_, i) => !omit.has(i));
    results.push(newRhs);
  }
  return results;
}

export function eliminateNullableProductions(cfg: CFG): CFG {
  const g = cloneCFG(cfg);
  const nullable = findNullableVariables(g);
  const newProductions: Production[] = [];

  for (const p of g.productions) {
    if (p.rhs.length === 0) continue; // hapus A -> epsilon (akan ditambahkan kembali khusus start symbol jika perlu)
    const variants = subsetsToOmit(p.rhs, nullable);
    for (const v of variants) {
      if (v.length > 0) newProductions.push({ lhs: p.lhs, rhs: v });
    }
  }

  // Pertahankan S0 -> ε jika start symbol asli nullable (bahasa mengandung string kosong)
  if (nullable.has(cfg.startSymbol)) {
    newProductions.push({ lhs: g.startSymbol, rhs: [] });
  }

  g.productions = dedupe(newProductions);
  return g;
}

// ---------- STEP 2: UNIT PRODUCTIONS ----------
export function eliminateUnitProductions(cfg: CFG): CFG {
  const g = cloneCFG(cfg);

  function unitClosure(variable: string): Set<string> {
    const closure = new Set<string>([variable]);
    const stack = [variable];
    while (stack.length > 0) {
      const v = stack.pop()!;
      for (const p of g.productions) {
        if (p.lhs === v && p.rhs.length === 1 && g.variables.includes(p.rhs[0]) && !closure.has(p.rhs[0])) {
          closure.add(p.rhs[0]);
          stack.push(p.rhs[0]);
        }
      }
    }
    return closure;
  }

  const newProductions: Production[] = [];
  for (const variable of g.variables) {
    const closure = unitClosure(variable);
    for (const v of closure) {
      for (const p of g.productions) {
        if (p.lhs === v) {
          const isUnit = p.rhs.length === 1 && g.variables.includes(p.rhs[0]);
          if (!isUnit) newProductions.push({ lhs: variable, rhs: p.rhs });
        }
      }
    }
  }
  g.productions = dedupe(newProductions);
  return g;
}

// ---------- STEP 3: USELESS SYMBOLS ----------
export function eliminateUselessSymbols(cfg: CFG): CFG {
  let g = cloneCFG(cfg);

  // (a) hilangkan variabel unproductive (tidak bisa hasilkan string terminal)
  const productive = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of g.productions) {
      if (productive.has(p.lhs)) continue;
      if (p.rhs.every((s) => g.terminals.includes(s) || productive.has(s))) {
        productive.add(p.lhs);
        changed = true;
      }
    }
  }
  g.variables = g.variables.filter((v) => productive.has(v));
  g.productions = g.productions.filter(
    (p) => productive.has(p.lhs) && p.rhs.every((s) => g.terminals.includes(s) || productive.has(s))
  );

  // (b) hilangkan simbol unreachable dari start symbol
  const reachable = new Set<string>([g.startSymbol]);
  const stack = [g.startSymbol];
  while (stack.length > 0) {
    const v = stack.pop()!;
    for (const p of g.productions) {
      if (p.lhs === v) {
        for (const sym of p.rhs) {
          if (g.variables.includes(sym) && !reachable.has(sym)) {
            reachable.add(sym);
            stack.push(sym);
          }
        }
      }
    }
  }
  g.variables = g.variables.filter((v) => reachable.has(v));
  g.productions = g.productions.filter((p) => reachable.has(p.lhs));

  return g;
}

// ---------- STEP 4: TERMINAL HANDLING (sebelum binarize) ----------
export function handleTerminals(cfg: CFG): CFG {
  const g = cloneCFG(cfg);
  const existingVars = new Set(g.variables);
  const terminalVarMap = new Map<string, string>(); // terminal -> variabel pengganti
  const newProductions: Production[] = [];

  for (const p of g.productions) {
    if (p.rhs.length <= 1) {
      newProductions.push(p);
      continue;
    }
    const newRhs = p.rhs.map((sym) => {
      if (g.terminals.includes(sym)) {
        if (!terminalVarMap.has(sym)) {
          const v = freshVar("X", existingVars);
          terminalVarMap.set(sym, v);
        }
        return terminalVarMap.get(sym)!;
      }
      return sym;
    });
    newProductions.push({ lhs: p.lhs, rhs: newRhs });
  }

  terminalVarMap.forEach((variable, terminal) => {
    g.variables.push(variable);
    newProductions.push({ lhs: variable, rhs: [terminal] });
  });

  g.productions = dedupe(newProductions);
  return g;
}

// ---------- STEP 5: BINARIZATION ----------
export function binarizeProductions(cfg: CFG): CFG {
  const g = cloneCFG(cfg);
  const existingVars = new Set(g.variables);
  const newProductions: Production[] = [];

  for (const p of g.productions) {
    if (p.rhs.length <= 2) {
      newProductions.push(p);
      continue;
    }
    // A -> X1 X2 X3 ... Xn  menjadi:
    // A -> X1 A1, A1 -> X2 A2, ..., A(n-2) -> X(n-1) Xn
    let currentLhs = p.lhs;
    for (let i = 0; i < p.rhs.length - 2; i++) {
      const nextVar = freshVar("A", existingVars);
      g.variables.push(nextVar);
      newProductions.push({ lhs: currentLhs, rhs: [p.rhs[i], nextVar] });
      currentLhs = nextVar;
    }
    newProductions.push({ lhs: currentLhs, rhs: [p.rhs[p.rhs.length - 2], p.rhs[p.rhs.length - 1]] });
  }

  g.productions = dedupe(newProductions);
  return g;
}

// ---------- PIPELINE UTAMA ----------
export function convertToCNF(cfg: CFG): CNFConversionResult {
  helperCounter = 0;
  const steps: CNFConversionStep[] = [];

  let g = cloneCFG(cfg);

  const withStart = addNewStartSymbol(g);
  steps.push({
    stepName: "1. Isolasi Start Symbol",
    description: "Tambahkan S0 -> S agar simbol awal tidak pernah muncul di ruas kanan produksi manapun.",
    grammarBefore: g,
    grammarAfter: withStart,
  });
  g = withStart;

  const noNullable = eliminateNullableProductions(g);
  steps.push({
    stepName: "2. Eliminasi Nullable Production",
    description: "Hilangkan produksi A -> ε dengan menambahkan versi produksi yang menghilangkan setiap kombinasi variabel nullable.",
    grammarBefore: g,
    grammarAfter: noNullable,
  });
  g = noNullable;

  const noUnit = eliminateUnitProductions(g);
  steps.push({
    stepName: "3. Eliminasi Unit Production",
    description: "Hilangkan produksi berbentuk A -> B (B variabel tunggal) dengan mewariskan produksi non-unit milik B ke A.",
    grammarBefore: g,
    grammarAfter: noUnit,
  });
  g = noUnit;

  const noUseless = eliminateUselessSymbols(g);
  steps.push({
    stepName: "4. Eliminasi Useless Symbols",
    description: "Hilangkan variabel yang unreachable dari S atau tidak dapat menghasilkan string terminal (unproductive).",
    grammarBefore: g,
    grammarAfter: noUseless,
  });
  g = noUseless;

  const withTerminals = handleTerminals(g);
  steps.push({
    stepName: "5. Terminal Handling",
    description: "Ganti terminal yang muncul berdampingan dengan simbol lain (misal A -> aB) menjadi A -> Xa B, dengan Xa -> a.",
    grammarBefore: g,
    grammarAfter: withTerminals,
  });
  g = withTerminals;

  const binarized = binarizeProductions(g);
  steps.push({
    stepName: "6. Binarization",
    description: "Pecah produksi dengan RHS panjang > 2 menjadi rangkaian produksi biner menggunakan variabel bantu.",
    grammarBefore: g,
    grammarAfter: binarized,
  });
  g = binarized;

  return { original: cfg, steps, cnf: g };
}

export function grammarToString(cfg: CFG): string {
  const grouped = new Map<string, string[]>();
  for (const v of cfg.variables) grouped.set(v, []);
  for (const p of cfg.productions) {
    if (!grouped.has(p.lhs)) grouped.set(p.lhs, []);
    grouped.get(p.lhs)!.push(p.rhs.length === 0 ? "ε" : p.rhs.join(" "));
  }
  return Array.from(grouped.entries())
    .filter(([, rhsList]) => rhsList.length > 0)
    .map(([lhs, rhsList]) => `${lhs} -> ${rhsList.join(" | ")}`)
    .join("\n");
}

// ---------- Test Case (sesuai contoh spesifikasi tugas) ----------
export const exampleCFG_forCNF: CFG = {
  variables: ["S", "A", "B", "C"],
  terminals: ["a", "b", "c"],
  startSymbol: "S",
  productions: [
    { lhs: "S", rhs: ["A", "B"] },
    { lhs: "S", rhs: ["B", "C"] },
    { lhs: "A", rhs: ["a", "A"] },
    { lhs: "A", rhs: [] },
    { lhs: "B", rhs: ["b", "B"] },
    { lhs: "B", rhs: ["b"] },
    { lhs: "C", rhs: ["c"] },
  ],
};

export function isValidCNF(cfg: CFG): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const p of cfg.productions) {
    const isAB = p.rhs.length === 2 && p.rhs.every((s) => cfg.variables.includes(s));
    const isA = p.rhs.length === 1 && cfg.terminals.includes(p.rhs[0]);
    const isEpsilonAtStart = p.rhs.length === 0 && p.lhs === cfg.startSymbol;
    if (!isAB && !isA && !isEpsilonAtStart) {
      violations.push(`Produksi "${p.lhs} -> ${p.rhs.join(" ") || "ε"}" bukan bentuk CNF valid.`);
    }
  }
  return { valid: violations.length === 0, violations };
}

export function runCNFTests() {
  const result = convertToCNF(exampleCFG_forCNF);
  const check = isValidCNF(result.cnf);
  return {
    stepsCount: result.steps.length,
    cnfGrammar: grammarToString(result.cnf),
    valid: check.valid,
    violations: check.violations,
    pass: check.valid,
  };
}
