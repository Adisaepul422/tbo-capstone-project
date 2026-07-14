// ============================================================
// lib/cfg/pda.ts
// Konversi CFG -> PDA (Top-Down / Predictive Construction) + Simulasi
// ============================================================
//
// KONSEP (Konstruksi Standar CFG -> PDA, 1 state):
// PDA yang dibangun hanya memiliki SATU state "q" (loop state), dan
// bekerja secara top-down:
//   1. Push simbol awal grammar S ke atas stack.
//   2. Untuk setiap produksi A -> X1 X2 ... Xn:
//        transisi (q, ε, A) -> (q, X1 X2 ... Xn)   [pop A, push X1..Xn]
//   3. Untuk setiap terminal a:
//        transisi (q, a, a) -> (q, ε)               [cocokkan & pop input=stack]
//   4. String diterima bila seluruh input habis DAN stack kosong
//      (acceptance by empty stack).
//
// Karena grammar bisa memiliki banyak pilihan produksi (non-deterministik),
// simulasi PDA dilakukan dengan BFS/DFS atas seluruh konfigurasi
// (state, sisa input, isi stack) yang mungkin, mirip cara kerja NFA.
//
// PSEUDOCODE:
//   function cfgToPDA(cfg):
//       transitions = []
//       for A -> X1..Xn in cfg.productions:
//           transitions.push( (q, ε, A) -> (q, [X1..Xn]) )
//       for terminal a in cfg.terminals:
//           transitions.push( (q, a, a) -> (q, []) )
//       return PDA(states=[q], start=q, startStack=cfg.startSymbol, transitions)
//
//   function simulatePDA(pda, input):
//       BFS dari konfigurasi awal (q, input, [startStackSymbol])
//       pada setiap langkah, coba SEMUA transisi yang applicable:
//         - transisi non-terminal (ε, pop A, push rhs) - tidak konsumsi input
//         - transisi terminal (a, pop a, push ε) - konsumsi 1 karakter input
//       diterima jika mencapai konfigurasi (sisa input="", stack=[])

import { CFG } from "@/types/cfg";
import { PDA, PDATransition, PDAStackTraceStep, PDASimulationResult } from "@/types/cfg";

const Q = "q"; // satu-satunya state pada konstruksi top-down standar

export function cfgToPDA(cfg: CFG): PDA {
  const transitions: PDATransition[] = [];

  for (const p of cfg.productions) {
    transitions.push({
      fromState: Q,
      inputSymbol: "ε",
      stackTop: p.lhs,
      toState: Q,
      stackPush: p.rhs, // push X1..Xn (index 0 = akan berada paling atas setelah proses push berurutan terbalik, lihat simulasi)
    });
  }
  for (const a of cfg.terminals) {
    transitions.push({
      fromState: Q,
      inputSymbol: a,
      stackTop: a,
      toState: Q,
      stackPush: [],
    });
  }

  return {
    states: [Q],
    inputAlphabet: cfg.terminals,
    stackAlphabet: [...cfg.variables, ...cfg.terminals, "Z0"],
    transitions,
    startState: Q,
    startStackSymbol: cfg.startSymbol,
    acceptStates: [Q],
  };
}

interface Config {
  remainingInput: string;
  stack: string[]; // stack[0] = top
  path: PDAStackTraceStep[];
}

export function simulatePDA(pda: PDA, input: string, maxSteps = 5000): PDASimulationResult {
  const initial: Config = {
    remainingInput: input,
    stack: [pda.startStackSymbol],
    path: [{ step: 0, state: pda.startState, remainingInput: input, stack: [pda.startStackSymbol] }],
  };

  const queue: Config[] = [initial];
  const visited = new Set<string>();
  let stepsExplored = 0;

  while (queue.length > 0 && stepsExplored < maxSteps) {
    const config = queue.shift()!;
    stepsExplored++;

    if (config.remainingInput.length === 0 && config.stack.length === 0) {
      return { accepted: true, trace: config.path };
    }

    const key = `${config.remainingInput}|${config.stack.join(",")}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (config.stack.length === 0) continue; // stack kosong tapi input tersisa -> dead end
    const top = config.stack[0];

    // 1) Coba transisi epsilon (produksi non-terminal): pop top, push rhs
    for (const t of pda.transitions) {
      if (t.inputSymbol === "ε" && t.stackTop === top) {
        const newStack = [...t.stackPush, ...config.stack.slice(1)];
        const step: PDAStackTraceStep = {
          step: config.path.length,
          state: t.toState,
          remainingInput: config.remainingInput,
          stack: newStack,
          transitionUsed: `${top} -> ${t.stackPush.length ? t.stackPush.join("") : "ε"}`,
        };
        queue.push({ remainingInput: config.remainingInput, stack: newStack, path: [...config.path, step] });
      }
    }

    // 2) Coba transisi terminal: cocokkan input[0] dengan top of stack
    if (config.remainingInput.length > 0) {
      const symbol = config.remainingInput[0];
      for (const t of pda.transitions) {
        if (t.inputSymbol === symbol && t.stackTop === top) {
          const newStack = config.stack.slice(1);
          const newInput = config.remainingInput.slice(1);
          const step: PDAStackTraceStep = {
            step: config.path.length,
            state: t.toState,
            remainingInput: newInput,
            stack: newStack,
            transitionUsed: `baca '${symbol}', pop '${top}'`,
          };
          queue.push({ remainingInput: newInput, stack: newStack, path: [...config.path, step] });
        }
      }
    }
  }

  return {
    accepted: false,
    trace: initial.path,
    error: `String ditolak (tidak ditemukan jalur PDA yang menghabiskan input dengan stack kosong dalam ${maxSteps} langkah eksplorasi).`,
  };
}

// ---------- Test cases ----------
import { exampleCFG_anbn } from "./derivation";
import { exampleCFG_balancedParens, exampleCFG_aOrB } from "./cyk";

export function runPDATests() {
  const cases: { cfg: CFG; input: string; expected: boolean; label: string }[] = [
    { cfg: exampleCFG_anbn, input: "aabb", expected: true, label: "S->aSb|ε : aabb" },
    { cfg: exampleCFG_anbn, input: "", expected: true, label: "S->aSb|ε : ε" },
    { cfg: exampleCFG_balancedParens, input: "(())", expected: true, label: "S->SS|(S)|ε : (())" },
    { cfg: exampleCFG_aOrB, input: "ab", expected: true, label: "S->aS|bS|a|b : ab" },
    { cfg: exampleCFG_anbn, input: "aab", expected: false, label: "S->aSb|ε : aab (ditolak)" },
  ];
  return cases.map((tc) => {
    const pda = cfgToPDA(tc.cfg);
    const result = simulatePDA(pda, tc.input);
    return { ...tc, actual: result.accepted, pass: result.accepted === tc.expected };
  });
}
