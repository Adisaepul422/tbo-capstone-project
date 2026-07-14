// ============================================================
// lib/regex/thompson.ts
// Thompson's Construction: RegexNode (AST) -> NFA
// ============================================================
//
// KONSEP:
// Setiap node AST diterjemahkan menjadi FRAGMEN NFA dengan TEPAT SATU
// start state dan TEPAT SATU accept state, dihubungkan dengan transisi
// epsilon sesuai jenis operator:
//
//   Char(a):     (start) --a--> (accept)
//
//   Concat(X,Y): start_X ... accept_X --ε--> start_Y ... accept_Y
//                (accept fragmen kiri disambung epsilon ke start fragmen kanan)
//
//   Union(X,Y):        ε--> start_X ... accept_X --ε
//                (new start)                          (new accept)
//                       ε--> start_Y ... accept_Y --ε
//
//   Star(X):     new_start --ε--> start_X ... accept_X --ε--> new_accept
//                new_start --ε--> new_accept   (boleh nol kemunculan)
//                accept_X  --ε--> start_X       (boleh berulang)
//
//   Plus(X):     sama seperti Star tapi TANPA epsilon langsung start->accept
//                (X harus muncul minimal 1 kali)
//
//   Optional(X): new_start --ε--> start_X ... accept_X --ε--> new_accept
//                new_start --ε--> new_accept   (boleh 0 atau 1 kali, tanpa loop)
//
// PSEUDOCODE:
//   function thompson(node):
//       switch node.type:
//         case 'char':   return makeCharFragment(node.value)
//         case 'concat':  return foldFragments(node.children, concatTwo)
//         case 'union':   return foldFragments(node.children, unionTwo)
//         case 'star':    return starFragment(thompson(node.child))
//         case 'plus':    return plusFragment(thompson(node.child))
//         case 'optional':return optionalFragment(thompson(node.child))

import { NFA, EPSILON } from "@/types/automata";
import { NFAFragment, RegexNode } from "@/types/regex";

let counter = 0;
function newState(): string {
  return `n${counter++}`;
}

export interface ThompsonBuild {
  nfa: NFA;
  fragment: NFAFragment;
}

export function regexToNFA(ast: RegexNode): ThompsonBuild {
  counter = 0;
  const states = new Set<string>();
  const alphabet = new Set<string>();
  const transitions: Record<string, Record<string, string[]>> = {};

  function addTransition(from: string, symbol: string, to: string) {
    transitions[from] = transitions[from] || {};
    transitions[from][symbol] = transitions[from][symbol] || [];
    transitions[from][symbol].push(to);
  }

  function build(node: RegexNode): NFAFragment {
    switch (node.type) {
      case "epsilon": {
        const s = newState(), a = newState();
        states.add(s); states.add(a);
        addTransition(s, EPSILON, a);
        return { start: s, accept: a };
      }
      case "char": {
        const s = newState(), a = newState();
        states.add(s); states.add(a);
        alphabet.add(node.value!);
        addTransition(s, node.value!, a);
        return { start: s, accept: a };
      }
      case "concat": {
        const frags = node.children!.map(build);
        for (let i = 0; i < frags.length - 1; i++) {
          addTransition(frags[i].accept, EPSILON, frags[i + 1].start);
        }
        return { start: frags[0].start, accept: frags[frags.length - 1].accept };
      }
      case "union": {
        const frags = node.children!.map(build);
        const s = newState(), a = newState();
        states.add(s); states.add(a);
        for (const f of frags) {
          addTransition(s, EPSILON, f.start);
          addTransition(f.accept, EPSILON, a);
        }
        return { start: s, accept: a };
      }
      case "star": {
        const f = build(node.child!);
        const s = newState(), a = newState();
        states.add(s); states.add(a);
        addTransition(s, EPSILON, f.start);
        addTransition(s, EPSILON, a);
        addTransition(f.accept, EPSILON, f.start);
        addTransition(f.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case "plus": {
        const f = build(node.child!);
        const s = newState(), a = newState();
        states.add(s); states.add(a);
        addTransition(s, EPSILON, f.start);
        addTransition(f.accept, EPSILON, f.start); // boleh berulang
        addTransition(f.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case "optional": {
        const f = build(node.child!);
        const s = newState(), a = newState();
        states.add(s); states.add(a);
        addTransition(s, EPSILON, f.start);
        addTransition(s, EPSILON, a);
        addTransition(f.accept, EPSILON, a);
        return { start: s, accept: a };
      }
    }
  }

  const fragment = build(ast);

  const nfa: NFA = {
    states: Array.from(states),
    alphabet: Array.from(alphabet),
    startState: fragment.start,
    acceptStates: [fragment.accept],
    transitions,
  };

  return { nfa, fragment };
}
