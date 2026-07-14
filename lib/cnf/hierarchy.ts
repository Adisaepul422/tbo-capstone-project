// ============================================================
// lib/cnf/hierarchy.ts
// Hierarki Chomsky: klasifikasi tipe grammar & mesin ekuivalennya
// ============================================================
//
// KONSEP:
// Hierarki Chomsky mengelompokkan grammar formal ke 4 tipe berdasarkan
// bentuk produksinya (dari paling umum ke paling terbatas):
//
//   Type 0 (Unrestricted Grammar):
//     Produksi: α -> β, dengan α mengandung minimal 1 variabel, tanpa
//     batasan bentuk lain. Mesin pengenal: Turing Machine.
//
//   Type 1 (Context-Sensitive Grammar):
//     Produksi: αAβ -> αγβ, dengan |γ| >= 1 (non-contracting, kecuali
//     S -> ε jika S tak muncul di ruas kanan manapun). "Context" A
//     hanya boleh diganti dalam konteks α...β. Mesin pengenal: Linear
//     Bounded Automaton (LBA).
//
//   Type 2 (Context-Free Grammar):
//     Produksi: A -> γ, LHS harus TEPAT SATU variabel (tanpa syarat
//     konteks). Mesin pengenal: Pushdown Automaton (PDA).
//
//   Type 3 (Regular Grammar):
//     Produksi hanya boleh: A -> aB, A -> a, atau A -> ε (right-linear),
//     ATAU seluruhnya left-linear (A -> Ba, A -> a). Tidak boleh campur
//     keduanya. Mesin pengenal: Finite Automaton (DFA/NFA).
//
// Setiap tipe yang lebih tinggi nomornya adalah SUBSET dari tipe di
// bawahnya: Type 3 ⊂ Type 2 ⊂ Type 1 ⊂ Type 0.
//
// Untuk keperluan visualisasi, produksi direpresentasikan sebagai raw
// string "LHS -> RHS" agar bisa merepresentasikan LHS multi-simbol
// (dibutuhkan untuk Type 0 & Type 1, yang tidak bisa direpresentasikan
// oleh interface CFG standar kita yang mengasumsikan LHS tunggal).

import { ChomskyClassification, ChomskyType } from "@/types/cnf";

export interface RawProduction {
  lhs: string; // bisa lebih dari 1 simbol, dipisah spasi, misal "a A b"
  rhs: string; // dipisah spasi, misal "a A b" atau "" untuk epsilon
}

function tokens(s: string): string[] {
  return s.trim().length === 0 ? [] : s.trim().split(/\s+/);
}

function isUpper(sym: string): boolean {
  return /^[A-Z][A-Za-z0-9']*$/.test(sym);
}

export function classifyGrammar(productions: RawProduction[], variables: string[]): ChomskyClassification {
  let isType3Right = true;
  let isType3Left = true;
  let isType2 = true;
  let isType1 = true;

  for (const p of productions) {
    const lhsTok = tokens(p.lhs);
    const rhsTok = tokens(p.rhs);

    // Type 2: LHS harus tepat 1 variabel
    if (lhsTok.length !== 1 || !isUpper(lhsTok[0])) {
      isType2 = false;
    }

    // Type 1: |RHS| >= |LHS| (non-contracting), kecuali S -> ε
    if (rhsTok.length < lhsTok.length && !(lhsTok.length === 1 && rhsTok.length === 0)) {
      isType1 = false;
    }

    // Type 3 hanya relevan jika juga Type 2 (LHS tunggal)
    if (lhsTok.length === 1 && isUpper(lhsTok[0])) {
      // right-linear: A -> aB | a | ε
      const rightLinearOk =
        rhsTok.length === 0 ||
        (rhsTok.length === 1 && !isUpper(rhsTok[0])) ||
        (rhsTok.length === 2 && !isUpper(rhsTok[0]) && isUpper(rhsTok[1]));
      // left-linear: A -> Ba | a | ε
      const leftLinearOk =
        rhsTok.length === 0 ||
        (rhsTok.length === 1 && !isUpper(rhsTok[0])) ||
        (rhsTok.length === 2 && isUpper(rhsTok[0]) && !isUpper(rhsTok[1]));

      if (!rightLinearOk) isType3Right = false;
      if (!leftLinearOk) isType3Left = false;
    } else {
      isType3Right = false;
      isType3Left = false;
    }
  }

  if (isType2 && (isType3Right || isType3Left)) {
    return {
      type: "Type 3",
      reason: "Semua produksi berbentuk regular (right-linear seluruhnya, atau left-linear seluruhnya): A -> aB, A -> a, atau A -> ε.",
      automatonEquivalent: "Finite Automaton (DFA/NFA)",
    };
  }
  if (isType2) {
    return {
      type: "Type 2",
      reason: "Setiap produksi memiliki LHS tepat satu variabel (context-free), tetapi RHS tidak seluruhnya mengikuti pola regular.",
      automatonEquivalent: "Pushdown Automaton (PDA)",
    };
  }
  if (isType1) {
    return {
      type: "Type 1",
      reason: "Produksi bersifat non-contracting (|RHS| >= |LHS|) namun LHS bisa lebih dari satu simbol (context-sensitive).",
      automatonEquivalent: "Linear Bounded Automaton (LBA)",
    };
  }
  return {
    type: "Type 0",
    reason: "Tidak ada batasan bentuk produksi (bisa contracting, LHS/RHS bebas) — grammar paling umum.",
    automatonEquivalent: "Turing Machine",
  };
}

// ---------- Contoh grammar untuk setiap tipe (untuk visualisasi) ----------
export const hierarchyExamples: Record<ChomskyType, { grammar: RawProduction[]; description: string }> = {
  "Type 0": {
    description: "Unrestricted Grammar — tanpa batasan bentuk produksi.",
    grammar: [
      { lhs: "S", rhs: "A B" },
      { lhs: "A B", rhs: "B A" },
      { lhs: "A B", rhs: "" }, // contracting: 2 simbol -> 0 simbol, hanya diizinkan di Type 0
    ],
  },
  "Type 1": {
    description: "Context-Sensitive Grammar — mengenali bahasa a^n b^n c^n.",
    grammar: [
      { lhs: "S", rhs: "a S B C" },
      { lhs: "S", rhs: "a B C" },
      { lhs: "C B", rhs: "B C" },
      { lhs: "a B", rhs: "a b" },
      { lhs: "b B", rhs: "b b" },
      { lhs: "b C", rhs: "b c" },
      { lhs: "c C", rhs: "c c" },
    ],
  },
  "Type 2": {
    description: "Context-Free Grammar — mengenali bahasa a^n b^n (tidak regular).",
    grammar: [
      { lhs: "S", rhs: "a S b" },
      { lhs: "S", rhs: "" },
    ],
  },
  "Type 3": {
    description: "Regular Grammar — mengenali string biner berakhiran '01'.",
    grammar: [
      { lhs: "S", rhs: "0 S" },
      { lhs: "S", rhs: "1 S" },
      { lhs: "S", rhs: "0 A" },
      { lhs: "A", rhs: "1" },
    ],
  },
};

export function runHierarchyTests() {
  return (Object.keys(hierarchyExamples) as ChomskyType[]).map((type) => {
    const { grammar } = hierarchyExamples[type];
    const vars = Array.from(new Set(grammar.flatMap((p) => tokens(p.lhs).filter(isUpper))));
    const result = classifyGrammar(grammar, vars);
    return { expectedType: type, actualType: result.type, pass: result.type === type };
  });
}
