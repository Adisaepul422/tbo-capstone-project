"use client";

import { useMemo, useState } from "react";
import { CFG } from "@/types/cfg";
import { convertToCNF, exampleCFG_forCNF, grammarToString, isValidCNF } from "@/lib/cnf/convert";
import { classifyGrammar, hierarchyExamples } from "@/lib/cnf/hierarchy";
import { ChomskyType } from "@/types/cnf";

const hierarchyOrder: { type: ChomskyType; name: string; machine: string }[] = [
  { type: "Type 0", name: "Unrestricted Grammar", machine: "Turing Machine" },
  { type: "Type 1", name: "Context-Sensitive Grammar", machine: "Linear Bounded Automaton" },
  { type: "Type 2", name: "Context-Free Grammar", machine: "Pushdown Automaton" },
  { type: "Type 3", name: "Regular Grammar", machine: "Finite Automaton" },
];

export default function ChomskyPage() {
  const [defText, setDefText] = useState(JSON.stringify(exampleCFG_forCNF, null, 2));
  const [error, setError] = useState<string | null>(null);

  const cfg: CFG | null = useMemo(() => {
    try {
      const parsed = JSON.parse(defText);
      setError(null);
      return parsed;
    } catch (e: any) {
      setError(`JSON tidak valid: ${e.message}`);
      return null;
    }
  }, [defText]);

  const cnfResult = cfg ? convertToCNF(cfg) : null;
  const validity = cnfResult ? isValidCNF(cnfResult.cnf) : null;

  const cfgClassification = cfg
    ? classifyGrammar(
        cfg.productions.map((p) => ({ lhs: p.lhs, rhs: p.rhs.join(" ") })),
        cfg.variables
      )
    : null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Modul 4 — Hierarki Chomsky &amp; CNF</h1>
        <p className="mt-1 text-sm text-slate-400">
          Visualisasi Tipe 0–3 dalam Hierarki Chomsky, dan konversi CFG sembarang ke Chomsky Normal Form.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Hierarki Chomsky</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hierarchyOrder.map((h, i) => (
            <div key={h.type} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="font-mono text-xs text-slate-500">Type {3 - i}</p>
              <p className="mt-1 font-semibold text-sky-300">{h.name}</p>
              <p className="mt-1 text-xs text-slate-400">≡ {h.machine}</p>
              <p className="mt-3 text-[11px] text-slate-500">{hierarchyExamples[h.type].description}</p>
              <div className="mt-2 space-y-0.5 font-mono text-[11px] text-slate-400">
                {hierarchyExamples[h.type].grammar.map((p, j) => (
                  <p key={j}>
                    {p.lhs} → {p.rhs || "ε"}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Relasi subset: Type 3 ⊂ Type 2 ⊂ Type 1 ⊂ Type 0 — setiap grammar reguler juga context-free, setiap context-free juga context-sensitive, dst.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Konversi CFG → Chomsky Normal Form</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-slate-400">Definisi CFG (JSON)</label>
            <textarea
              value={defText}
              onChange={(e) => setDefText(e.target.value)}
              spellCheck={false}
              className="mt-1 h-56 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            />
            {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
          </div>
          <div className="space-y-3">
            {cfgClassification && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-sm text-slate-400">Klasifikasi grammar input:</p>
                <p className="mt-1 font-semibold text-sky-300">{cfgClassification.type} — {cfgClassification.automatonEquivalent}</p>
                <p className="mt-1 text-xs text-slate-500">{cfgClassification.reason}</p>
              </div>
            )}
            {validity && (
              <div className={`rounded-lg border p-4 ${validity.valid ? "border-emerald-800 bg-emerald-950/30" : "border-amber-800 bg-amber-950/30"}`}>
                <p className={`text-sm font-semibold ${validity.valid ? "text-emerald-400" : "text-amber-400"}`}>
                  {validity.valid ? "Hasil valid CNF ✓" : "Ditemukan pelanggaran bentuk CNF"}
                </p>
              </div>
            )}
          </div>
        </div>

        {cnfResult && (
          <div className="space-y-3">
            {cnfResult.steps.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <p className="font-semibold text-slate-200">{s.stepName}</p>
                <p className="mt-1 text-xs text-slate-400">{s.description}</p>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-300">{grammarToString(s.grammarAfter)}</pre>
              </div>
            ))}
            <div className="rounded-lg border border-sky-800 bg-sky-950/20 p-4">
              <p className="font-semibold text-sky-300">Hasil Akhir (CNF)</p>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-200">{grammarToString(cnfResult.cnf)}</pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
