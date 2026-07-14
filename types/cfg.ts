// ============================================================
// types/cfg.ts
// Definisi tipe untuk Context-Free Grammar (CFG) dan Pushdown Automata (PDA)
// ============================================================

/** Produksi CFG: LHS -> RHS (RHS adalah array simbol; string kosong array = epsilon) */
export interface Production {
  lhs: string;
  rhs: string[]; // contoh: S -> aSb direpresentasikan rhs = ["a","S","b"]; S -> ε direpresentasikan rhs = []
}

export interface CFG {
  variables: string[]; // Non-terminal (V)
  terminals: string[]; // Terminal (Σ)
  productions: Production[]; // P
  startSymbol: string; // S
}

export interface ParseTreeNode {
  symbol: string;
  children: ParseTreeNode[];
  isTerminal: boolean;
}

export interface DerivationStep {
  step: number;
  sentential: string; // bentuk sentensial saat ini, misal "aSb"
  productionUsed: string; // misal "S -> aSb"
  replacedIndex: number; // index simbol yang diganti (untuk highlight)
}

export interface DerivationResult {
  success: boolean;
  steps: DerivationStep[];
  finalString: string;
  error?: string;
}

// ---------- PDA ----------
export interface PDATransition {
  fromState: string;
  inputSymbol: string; // bisa 'ε'
  stackTop: string; // simbol yang harus ada di puncak stack (bisa 'ε' = tidak peduli/tidak pop)
  toState: string;
  stackPush: string[]; // simbol-simbol yang di-push (urutan kiri=atas setelah push); [] artinya pop tanpa push baru
}

export interface PDA {
  states: string[];
  inputAlphabet: string[];
  stackAlphabet: string[];
  transitions: PDATransition[];
  startState: string;
  startStackSymbol: string;
  acceptStates: string[];
}

export interface PDAStackTraceStep {
  step: number;
  state: string;
  remainingInput: string;
  stack: string[]; // stack[0] = top
  transitionUsed?: string;
}

export interface PDASimulationResult {
  accepted: boolean;
  trace: PDAStackTraceStep[];
  error?: string;
}

// ---------- CYK ----------
export interface CYKCell {
  variables: Set<string>;
  // untuk membangun parse tree: backpointer[var] = { split, leftVar, rightVar } atau { terminal }
  backpointers: Record<string, { split: number; left: string; right: string } | { terminal: string }>;
}

export interface CYKResult {
  accepted: boolean;
  table: CYKCell[][]; // table[len][start] , diagonal utama = substring panjang 1
  parseTree: ParseTreeNode | null;
}
