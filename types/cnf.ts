// ============================================================
// types/cnf.ts
// Tipe untuk proses konversi CFG -> Chomsky Normal Form (CNF)
// ============================================================

import { CFG } from "./cfg";

export type ChomskyType = "Type 0" | "Type 1" | "Type 2" | "Type 3";

export interface CNFConversionStep {
  stepName: string;
  description: string;
  grammarBefore: CFG;
  grammarAfter: CFG;
}

export interface CNFConversionResult {
  original: CFG;
  steps: CNFConversionStep[];
  cnf: CFG;
}

export interface ChomskyClassification {
  type: ChomskyType;
  reason: string;
  automatonEquivalent: string;
}
