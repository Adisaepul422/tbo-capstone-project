// ============================================================
// types/regex.ts
// Abstract Syntax Tree untuk Regular Expression
// ============================================================
//
// Grammar RE yang didukung (precedence rendah -> tinggi):
//   Expr    := Term ('|' Term)*          // union
//   Term    := Factor+                   // concatenation (implisit)
//   Factor  := Atom ('*' | '+' | '?')?    // kleene star / plus / optional
//   Atom    := Char | '(' Expr ')' | CharClass
//
// CharClass sederhana: [a-z], [0-9], [a-zA-Z0-9] dsb, diperlakukan
// sebagai union dari semua karakter yang termasuk di dalamnya.

export type RegexNodeType = "char" | "concat" | "union" | "star" | "plus" | "optional" | "epsilon";

export interface RegexNode {
  type: RegexNodeType;
  value?: string; // untuk node 'char'
  children?: RegexNode[]; // untuk concat/union (bisa >2 anak untuk concat & union)
  child?: RegexNode; // untuk star/plus/optional (unary)
}

export interface NFAFragment {
  start: string;
  accept: string;
}
