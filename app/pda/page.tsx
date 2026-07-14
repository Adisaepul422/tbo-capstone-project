"use client";

import { useMemo, useState } from "react";
import { CFG } from "@/types/cfg";
import { deriveString, exampleCFG_anbn } from "@/lib/cfg/derivation";
import { runCYK } from "@/lib/cfg/cyk";
import { cfgToPDA, simulatePDA } from "@/lib/cfg/pda";
import ParseTree from "@/components/ParseTree";

export default function PdaPage() {
  const [defText, setDefText] = useState(JSON.stringify(exampleCFG_anbn, null, 2));
  const [testString, setTestString] = useState("aabb");
  const [mode, setMode] = useState<"leftmost" | "rightmost">("leftmost");
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

  const cyk = cfg ? runCYK(cfg, testString) : null;
  const derivation = cfg ? deriveString(cfg, testString, mode) : null;
  const pdaResult = cfg ? simulatePDA(cfgToPDA(cfg), testString) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modul 3 — Pushdown Automata &amp; CFG</h1>
        <p className="mt-1 text-sm text-slate-400">
          Derivasi leftmost/rightmost, validasi keanggotaan string dengan algoritma CYK, visualisasi parse tree, dan simulasi PDA dengan stack trace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-slate-400">
            Definisi CFG (JSON). Format produksi: <code className="text-sky-300">rhs: []</code> untuk ε.
          </label>
          <textarea
            value={defText}
            onChange={(e) => setDefText(e.target.value)}
            spellCheck={false}
            className="mt-1 h-56 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          />
          {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400">String uji</label>
            <input
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Mode derivasi</label>
            <div className="mt-1 flex gap-2">
              {(["leftmost", "rightmost"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 text-sm ${mode === m ? "bg-sky-500/20 text-sky-300" : "bg-slate-800 text-slate-400"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {cyk && (
            <div className={`rounded-lg border p-3 ${cyk.accepted ? "border-emerald-800 bg-emerald-950/30" : "border-rose-800 bg-rose-950/30"}`}>
              <p className={`text-sm font-semibold ${cyk.accepted ? "text-emerald-400" : "text-rose-400"}`}>
                CYK: {cyk.accepted ? "ACCEPTED ✓" : "REJECTED ✗"}
              </p>
            </div>
          )}
        </div>
      </div>

      {cfg && (
        <>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-300">Derivasi ({mode})</p>
            {derivation?.success ? (
              <div className="space-y-1 font-mono text-xs text-slate-300">
                <p>{cfg.startSymbol}</p>
                {derivation.steps.map((s) => (
                  <p key={s.step}>
                    ⇒ <span className="text-slate-100">{s.sentential}</span>{" "}
                    <span className="text-slate-500">[{s.productionUsed}]</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-rose-400">{derivation?.error}</p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-300">Parse Tree (dari tabel CYK)</p>
              <ParseTree root={cyk?.parseTree ?? null} />
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-300">
                Simulasi PDA {pdaResult?.accepted ? <span className="text-emerald-400">(ACCEPTED)</span> : <span className="text-rose-400">(REJECTED)</span>}
              </p>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500">
                    <tr><th className="pr-3 py-1">#</th><th className="pr-3">Sisa Input</th><th className="pr-3">Stack (top→bottom)</th><th>Aksi</th></tr>
                  </thead>
                  <tbody className="font-mono text-slate-300">
                    {pdaResult?.trace.map((t) => (
                      <tr key={t.step} className="border-t border-slate-800">
                        <td className="pr-3 py-1">{t.step}</td>
                        <td className="pr-3">{t.remainingInput || "ε"}</td>
                        <td className="pr-3">{t.stack.length ? t.stack.join(" ") : "ε"}</td>
                        <td>{t.transitionUsed ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pdaResult?.error && <p className="mt-2 text-xs text-rose-400">{pdaResult.error}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
