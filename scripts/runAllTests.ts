import { runDfaTests } from "../lib/dfa";
import { runNfaTests } from "../lib/nfa";
import { runSubsetConstructionTests } from "../lib/subsetConstruction";
import { runMealyTests, runMooreTests } from "../lib/mooreMealy";
import { runRegexTests } from "../lib/regex/match";
import { runDerivationTests } from "../lib/cfg/derivation";
import { runCYKTests } from "../lib/cfg/cyk";
import { runPDATests } from "../lib/cfg/pda";
import { runCNFTests } from "../lib/cnf/convert";
import { runHierarchyTests } from "../lib/cnf/hierarchy";

function report(name: string, results: any) {
  const arr = Array.isArray(results) ? results : [results];
  const passed = arr.filter((r) => r.pass).length;
  console.log(`\n=== ${name}: ${passed}/${arr.length} PASS ===`);
  arr.forEach((r, i) => console.log(`  [${r.pass ? "OK" : "FAIL"}] #${i + 1}`, JSON.stringify(r)));
}

report("DFA", runDfaTests());
report("NFA", runNfaTests());
report("Subset Construction (NFA->DFA)", runSubsetConstructionTests());
report("Mealy", runMealyTests());
report("Moore", runMooreTests());
report("Regex Matching", runRegexTests());
report("CFG Derivation", runDerivationTests());
report("CYK", runCYKTests());
report("PDA", runPDATests());
report("CNF Conversion", runCNFTests());
report("Chomsky Hierarchy", runHierarchyTests());
