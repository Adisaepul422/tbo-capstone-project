"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { parseRegex, astToString } from "@/lib/regex/parser";
import { regexToNFA } from "@/lib/regex/thompson";
import { matchRegex, regexToRegularGrammar } from "@/lib/regex/match";

const AutomataGraph = dynamic(() => import("@/components/AutomataGraph"), { ssr: false });

export default function RegexPage() {
  const [pattern, setPattern] = useState("(a|b)*abb");
  const [testString, setTestString] = useState("aabb");

  const parsed = useMemo(() => {
    try {
      const ast = parseRegex(pattern);
      const { nfa } = regexToNFA(ast);
      return { ast, nfa, error: null as string | null };
    } catch (e: any) {
      return { ast: null, nfa: null, error: e.message as string };
    }
  }, [pattern]);

  const matchResult = matchRegex(pattern, testString);
  const grammar = parsed.ast ? regexToRegularGrammar(pattern) : [];

  const edges = parsed.nfa
    ? parsed.nfa.states.flatMap((s) =>
        Object.entries(parsed.nfa!.transitions[s] || {}).flatMap(([symbol, targets]) =>
          targets.map((t) => ({ from: s, to: t, label: symbol }))
        )
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modul 2 — Regular Expression</h1>
        <p className="mt-1 text-sm text-slate-400">
          Parser RE → AST, konversi RE → NFA (Thompson&apos;s Construction), dan pattern matching.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-slate-400">Regular Expression</label>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="contoh: (a|b)*abb"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">Operator didukung: | (union), * (kleene star), + (plus), ? (optional), () grouping, [a-z] character class.</p>
        </div>
        <div>
          <label className="text-sm text-slate-400">String uji</label>
          <input
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {parsed.error && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-300">
          Parse error: {parsed.error}
        </div>
      )}

      {!parsed.error && (
        <>
          <div className={`rounded-lg border p-4 ${matchResult.accepted ? "border-emerald-800 bg-emerald-950/30" : "border-rose-800 bg-rose-950/30"}`}>
            <p className={`font-semibold ${matchResult.accepted ? "text-emerald-400" : "text-rose-400"}`}>
              {matchResult.accepted ? "MATCH ✓" : "NO MATCH ✗"}
            </p>
            <p className="mt-1 text-xs text-slate-400">NFA hasil Thompson&apos;s Construction memiliki {matchResult.nfaStateCount} state.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-300">Abstract Syntax Tree</p>
              <pre className="max-h-72 overflow-auto whitespace-pre font-mono text-xs text-slate-300">{astToString(parsed.ast!)}</pre>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-300">NFA hasil Thompson&apos;s Construction</p>
              {parsed.nfa && (
                <AutomataGraph
                  states={parsed.nfa.states}
                  startState={parsed.nfa.startState}
                  acceptStates={parsed.nfa.acceptStates}
                  edges={edges}
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-300">Grammar Reguler (Tipe 3) yang Setara</p>
            <div className="max-h-56 space-y-1 overflow-auto font-mono text-xs text-slate-300">
              {grammar.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
