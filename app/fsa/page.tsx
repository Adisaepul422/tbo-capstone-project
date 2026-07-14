"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DFA, NFA } from "@/types/automata";
import { simulateDFA, exampleDFA_endsWith01 } from "@/lib/dfa";
import { simulateNFA, exampleNFA_containsAB } from "@/lib/nfa";
import { nfaToDfa } from "@/lib/subsetConstruction";
import { simulateMoore, simulateMealy, exampleMoore, exampleMealy } from "@/lib/mooreMealy";

const AutomataGraph = dynamic(() => import("@/components/AutomataGraph"), { ssr: false });

type Tab = "dfa" | "nfa" | "convert" | "moore" | "mealy";

function dfaToEdges(dfa: DFA) {
  return dfa.states.flatMap((s) =>
    Object.entries(dfa.transitions[s] || {}).map(([symbol, target]) => ({
      from: s,
      to: target,
      label: symbol,
    }))
  );
}
function nfaToEdges(nfa: NFA) {
  return nfa.states.flatMap((s) =>
    Object.entries(nfa.transitions[s] || {}).flatMap(([symbol, targets]) =>
      targets.map((t) => ({ from: s, to: t, label: symbol }))
    )
  );
}

function JsonEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
    />
  );
}

export default function FSAPage() {
  const [tab, setTab] = useState<Tab>("dfa");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modul 1 — Finite State Automata</h1>
        <p className="mt-1 text-sm text-slate-400">
          Simulator DFA/NFA, konversi NFA→DFA (subset construction), dan bonus Moore/Mealy Machine.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-800">
        {(
          [
            ["dfa", "DFA Simulator"],
            ["nfa", "NFA Simulator"],
            ["convert", "NFA → DFA"],
            ["moore", "Moore Machine"],
            ["mealy", "Mealy Machine"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium ${
              tab === id ? "bg-slate-900 text-sky-300" : "text-slate-500 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dfa" && <DfaPanel />}
      {tab === "nfa" && <NfaPanel />}
      {tab === "convert" && <ConvertPanel />}
      {tab === "moore" && <MoorePanel />}
      {tab === "mealy" && <MealyPanel />}
    </div>
  );
}

function DfaPanel() {
  const [defText, setDefText] = useState(JSON.stringify(exampleDFA_endsWith01, null, 2));
  const [input, setInput] = useState("1101");
  const [error, setError] = useState<string | null>(null);

  const dfa: DFA | null = useMemo(() => {
    try {
      const parsed = JSON.parse(defText);
      setError(null);
      return parsed;
    } catch (e: any) {
      setError(`JSON tidak valid: ${e.message}`);
      return null;
    }
  }, [defText]);

  const result = dfa ? simulateDFA(dfa, input) : null;
  const activeState = result?.trace[result.trace.length - 1]?.nextState ?? dfa?.startState;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <p className="text-sm text-slate-400">
          Definisi DFA (Q, Σ, δ, q0, F) dalam format JSON. Contoh bawaan: string biner yang berakhiran <code className="text-sky-300">01</code>.
        </p>
        <JsonEditor value={defText} onChange={setDefText} />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <div>
          <label className="text-sm text-slate-400">String uji</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {dfa && <AutomataGraph states={dfa.states} startState={dfa.startState} acceptStates={dfa.acceptStates} edges={dfaToEdges(dfa)} activeStates={activeState ? [activeState] : []} />}
        {result && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <p className={`font-semibold ${result.accepted ? "text-emerald-400" : "text-rose-400"}`}>
              {result.error ? "ERROR" : result.accepted ? "ACCEPTED ✓" : "REJECTED ✗"}
            </p>
            {result.error && <p className="mt-1 text-sm text-rose-300">{result.error}</p>}
            {!result.error && (
              <table className="mt-3 w-full text-left text-xs">
                <thead className="text-slate-500">
                  <tr><th className="pr-4 py-1">#</th><th className="pr-4">State</th><th className="pr-4">Simbol</th><th>Next</th></tr>
                </thead>
                <tbody className="font-mono text-slate-300">
                  {result.trace.map((t) => (
                    <tr key={t.step} className="border-t border-slate-800">
                      <td className="pr-4 py-1">{t.step}</td>
                      <td className="pr-4">{t.currentState}</td>
                      <td className="pr-4">{t.inputSymbol ?? "-"}</td>
                      <td>{t.nextState ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NfaPanel() {
  const [defText, setDefText] = useState(JSON.stringify(exampleNFA_containsAB, null, 2));
  const [input, setInput] = useState("aab");
  const [error, setError] = useState<string | null>(null);

  const nfa: NFA | null = useMemo(() => {
    try {
      const parsed = JSON.parse(defText);
      setError(null);
      return parsed;
    } catch (e: any) {
      setError(`JSON tidak valid: ${e.message}`);
      return null;
    }
  }, [defText]);

  const result = nfa ? simulateNFA(nfa, input) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <p className="text-sm text-slate-400">
          Definisi NFA (transisi bisa &gt;1 tujuan, boleh pakai <code className="text-sky-300">"ε"</code> untuk epsilon). Contoh bawaan: mengandung substring <code className="text-sky-300">ab</code>.
        </p>
        <JsonEditor value={defText} onChange={setDefText} />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <div>
          <label className="text-sm text-slate-400">String uji</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {nfa && <AutomataGraph states={nfa.states} startState={nfa.startState} acceptStates={nfa.acceptStates} edges={nfaToEdges(nfa)} />}
        {result && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <p className={`font-semibold ${result.accepted ? "text-emerald-400" : "text-rose-400"}`}>
              {result.error ? "ERROR" : result.accepted ? "ACCEPTED ✓" : "REJECTED ✗"}
            </p>
            {result.error && <p className="mt-1 text-sm text-rose-300">{result.error}</p>}
            {!result.error && (
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto text-xs">
                <p className="text-slate-500">{result.allPaths.length} jalur dieksplorasi, {result.acceptingPaths.length} diterima.</p>
                {result.allPaths.slice(0, 30).map((p, i) => (
                  <p key={i} className={`font-mono ${p.accepted ? "text-emerald-400" : "text-slate-500"}`}>
                    {p.steps.map((s) => s.state).join(" → ")}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConvertPanel() {
  const [defText, setDefText] = useState(JSON.stringify(exampleNFA_containsAB, null, 2));
  const [error, setError] = useState<string | null>(null);

  const nfa: NFA | null = useMemo(() => {
    try {
      const parsed = JSON.parse(defText);
      setError(null);
      return parsed;
    } catch (e: any) {
      setError(`JSON tidak valid: ${e.message}`);
      return null;
    }
  }, [defText]);

  const result = nfa ? nfaToDfa(nfa) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Definisi NFA yang akan dikonversi ke DFA ekuivalen (Subset Construction).</p>
          <JsonEditor value={defText} onChange={setDefText} />
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>
        {result && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">DFA hasil konversi ({result.dfa.states.length} state)</p>
            <AutomataGraph states={result.dfa.states} startState={result.dfa.startState} acceptStates={result.dfa.acceptStates} edges={dfaToEdges(result.dfa)} />
          </div>
        )}
      </div>
      {result && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-300">Langkah-langkah Subset Construction</p>
          <div className="max-h-96 space-y-1 overflow-y-auto font-mono text-xs text-slate-300">
            {result.steps.map((s) => (
              <p key={s.stepNumber}>
                {s.stepNumber}. {s.explanation}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MoorePanel() {
  const [input, setInput] = useState("1011");
  const result = simulateMoore(exampleMoore, input);
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Contoh: Moore Machine penghitung paritas jumlah &lsquo;1&rsquo; (E = genap, O = ganjil). Output bergantung pada STATE, dihasilkan di setiap state termasuk state awal.
      </p>
      <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none" />
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 font-mono text-sm">
        <p>States: {result.states.join(" → ")}</p>
        <p className="mt-1 text-sky-300">Outputs: {result.outputs.join(" ")}</p>
      </div>
    </div>
  );
}

function MealyPanel() {
  const [input, setInput] = useState("1011");
  const result = simulateMealy(exampleMealy, input);
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Contoh: Mealy Machine yang mengeluarkan &lsquo;X&rsquo; untuk setiap simbol &lsquo;1&rsquo; dan &lsquo;Y&rsquo; untuk &lsquo;0&rsquo;. Output bergantung pada STATE + SIMBOL, dihasilkan di setiap transisi.
      </p>
      <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none" />
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 font-mono text-sm">
        <p>Input: {input.split("").join(" ")}</p>
        <p className="mt-1 text-sky-300">Outputs: {result.outputs.join(" ")}</p>
      </div>
    </div>
  );
}
