// ============================================================
// lib/regex/parser.ts
// Recursive Descent Parser: Regular Expression -> AST (RegexNode)
// ============================================================
//
// KONSEP:
// Kita parse RE menggunakan recursive descent yang mengikuti grammar:
//   Expr    := Term ('|' Term)*
//   Term    := Factor*                      (concatenation implisit, boleh kosong -> epsilon)
//   Factor  := Atom ('*' | '+' | '?')?
//   Atom    := Char | '(' Expr ')' | '[' CharClass ']'
//
// Precedence dari rendah ke tinggi: union (|) < concatenation < star/plus/optional.
// Ini otomatis terbentuk dari struktur fungsi rekursif (Expr memanggil Term,
// Term memanggil Factor, Factor memanggil Atom).
//
// PSEUDOCODE:
//   parseExpr():
//       term = parseTerm()
//       terms = [term]
//       while peek() == '|': consume('|'); terms.push(parseTerm())
//       return terms.length == 1 ? terms[0] : UnionNode(terms)
//
//   parseTerm():
//       factors = []
//       while peek() is start-of-Atom: factors.push(parseFactor())
//       return factors.length == 0 ? EpsilonNode
//            : factors.length == 1 ? factors[0] : ConcatNode(factors)
//
//   parseFactor():
//       atom = parseAtom()
//       if peek() in {'*','+','?'}: atom = UnaryNode(consume(), atom)
//       return atom
//
//   parseAtom():
//       if peek() == '(': consume('('); e = parseExpr(); consume(')'); return e
//       if peek() == '[': return parseCharClass()
//       return CharNode(consume())

import { RegexNode } from "@/types/regex";

const SPECIAL_CHARS = new Set(["(", ")", "|", "*", "+", "?", "[", "]"]);

class RegexParser {
  private pos = 0;
  constructor(private input: string) {}

  private peek(): string | undefined {
    return this.input[this.pos];
  }
  private consume(): string {
    return this.input[this.pos++];
  }
  private eof(): boolean {
    return this.pos >= this.input.length;
  }

  parse(): RegexNode {
    const node = this.parseExpr();
    if (!this.eof()) {
      throw new Error(`Karakter tak terduga "${this.peek()}" pada posisi ${this.pos}. Cek tanda kurung.`);
    }
    return node;
  }

  private parseExpr(): RegexNode {
    const terms = [this.parseTerm()];
    while (this.peek() === "|") {
      this.consume();
      terms.push(this.parseTerm());
    }
    return terms.length === 1 ? terms[0] : { type: "union", children: terms };
  }

  private parseTerm(): RegexNode {
    const factors: RegexNode[] = [];
    while (!this.eof() && this.peek() !== "|" && this.peek() !== ")") {
      factors.push(this.parseFactor());
    }
    if (factors.length === 0) return { type: "epsilon" };
    return factors.length === 1 ? factors[0] : { type: "concat", children: factors };
  }

  private parseFactor(): RegexNode {
    let atom = this.parseAtom();
    while (this.peek() === "*" || this.peek() === "+" || this.peek() === "?") {
      const op = this.consume();
      const type = op === "*" ? "star" : op === "+" ? "plus" : "optional";
      atom = { type, child: atom };
    }
    return atom;
  }

  private parseAtom(): RegexNode {
    if (this.eof()) throw new Error("Ekspresi tidak lengkap (unexpected end of input).");
    const c = this.peek();
    if (c === "(") {
      this.consume();
      const node = this.parseExpr();
      if (this.peek() !== ")") throw new Error('Tanda kurung tidak seimbang, diharapkan ")".');
      this.consume();
      return node;
    }
    if (c === "[") {
      return this.parseCharClass();
    }
    if (c && SPECIAL_CHARS.has(c)) {
      throw new Error(`Karakter khusus "${c}" tidak valid di posisi ini.`);
    }
    const ch = this.consume();
    return { type: "char", value: ch };
  }

  /** Menangani [a-z], [0-9], [abc], [a-zA-Z0-9] -> union dari seluruh char literal */
  private parseCharClass(): RegexNode {
    this.consume(); // '['
    const chars: string[] = [];
    while (!this.eof() && this.peek() !== "]") {
      const start = this.consume();
      if (this.peek() === "-" && this.input[this.pos + 1] !== "]") {
        this.consume(); // '-'
        const end = this.consume();
        const startCode = start.charCodeAt(0);
        const endCode = end.charCodeAt(0);
        if (startCode > endCode) throw new Error(`Range karakter tidak valid: ${start}-${end}`);
        for (let code = startCode; code <= endCode; code++) chars.push(String.fromCharCode(code));
      } else {
        chars.push(start);
      }
    }
    if (this.peek() !== "]") throw new Error('Character class tidak ditutup, diharapkan "]".');
    this.consume(); // ']'
    if (chars.length === 0) throw new Error("Character class kosong tidak valid.");
    const nodes: RegexNode[] = chars.map((c) => ({ type: "char", value: c }));
    return nodes.length === 1 ? nodes[0] : { type: "union", children: nodes };
  }
}

export function parseRegex(pattern: string): RegexNode {
  return new RegexParser(pattern).parse();
}

/** Cetak AST sebagai string berindentasi, untuk ditampilkan di UI. */
export function astToString(node: RegexNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  switch (node.type) {
    case "char":
      return `${indent}Char('${node.value}')`;
    case "epsilon":
      return `${indent}Epsilon`;
    case "concat":
      return `${indent}Concat\n${node.children!.map((c) => astToString(c, depth + 1)).join("\n")}`;
    case "union":
      return `${indent}Union\n${node.children!.map((c) => astToString(c, depth + 1)).join("\n")}`;
    case "star":
      return `${indent}Star\n${astToString(node.child!, depth + 1)}`;
    case "plus":
      return `${indent}Plus\n${astToString(node.child!, depth + 1)}`;
    case "optional":
      return `${indent}Optional\n${astToString(node.child!, depth + 1)}`;
  }
}
