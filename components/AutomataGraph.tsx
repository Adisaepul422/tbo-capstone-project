"use client";

import { useEffect, useRef } from "react";
import type { Core, ElementDefinition } from "cytoscape";

interface Props {
  states: string[];
  startState: string;
  acceptStates: string[];
  edges: { from: string; to: string; label: string }[];
  activeStates?: string[]; // state yang sedang di-highlight (mis. saat trace berjalan)
  height?: number;
}

export default function AutomataGraph({
  states,
  startState,
  acceptStates,
  edges,
  activeStates = [],
  height = 360,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const cytoscape = (await import("cytoscape")).default;
      if (cancelled || !containerRef.current) return;

      const elements: ElementDefinition[] = [
        ...states.map((s) => ({
          data: { id: s, label: s },
          classes: [
            acceptStates.includes(s) ? "accept" : "",
            s === startState ? "start" : "",
            activeStates.includes(s) ? "active" : "",
          ]
            .filter(Boolean)
            .join(" "),
        })),
        ...edges.map((e, i) => ({
          data: { id: `e${i}`, source: e.from, target: e.to, label: e.label },
        })),
      ];

      if (cyRef.current) {
        cyRef.current.destroy();
      }

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#1e293b",
              "border-color": "#475569",
              "border-width": 2,
              label: "data(label)",
              color: "#f1f5f9",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": 13,
              "font-family": "monospace",
              width: 44,
              height: 44,
            },
          },
          {
            selector: "node.start",
            style: { "border-color": "#38bdf8", "border-width": 3 },
          },
          {
            selector: "node.accept",
            style: {
              "border-style": "double",
              "border-width": 6,
              "border-color": "#34d399",
            },
          },
          {
            selector: "node.active",
            style: { "background-color": "#7c3aed" },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "#64748b",
              "target-arrow-color": "#64748b",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              label: "data(label)",
              "font-size": 11,
              color: "#e2e8f0",
              "text-background-color": "#0f172a",
              "text-background-opacity": 1,
              "text-background-padding": "2px",
            },
          },
        ],
        layout: { name: "cose", animate: false, padding: 30 },
      });
    }

    render();
    return () => {
      cancelled = true;
      cyRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(states), JSON.stringify(edges), startState, JSON.stringify(acceptStates), JSON.stringify(activeStates)]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-lg border border-slate-700 bg-slate-950"
    />
  );
}
