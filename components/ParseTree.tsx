"use client";

import { ParseTreeNode } from "@/types/cfg";

interface LayoutNode {
  node: ParseTreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

const NODE_W = 44;
const LEVEL_H = 64;

function layout(node: ParseTreeNode, depth: number, xCounter: { value: number }): LayoutNode {
  if (node.children.length === 0) {
    const x = xCounter.value * NODE_W;
    xCounter.value += 1;
    return { node, x, y: depth * LEVEL_H, children: [] };
  }
  const children = node.children.map((c) => layout(c, depth + 1, xCounter));
  const x = children.reduce((sum, c) => sum + c.x, 0) / children.length;
  return { node, x, y: depth * LEVEL_H, children };
}

function collectNodes(l: LayoutNode, acc: LayoutNode[] = []): LayoutNode[] {
  acc.push(l);
  l.children.forEach((c) => collectNodes(c, acc));
  return acc;
}

export default function ParseTree({ root }: { root: ParseTreeNode | null }) {
  if (!root) {
    return <p className="text-sm text-slate-400">Belum ada parse tree untuk ditampilkan.</p>;
  }
  const xCounter = { value: 0 };
  const laidOut = layout(root, 0, xCounter);
  const allNodes = collectNodes(laidOut);
  const width = Math.max(xCounter.value * NODE_W, NODE_W) + 40;
  const maxDepth = Math.max(...allNodes.map((n) => n.y));
  const height = maxDepth + LEVEL_H;

  function renderEdges(l: LayoutNode): JSX.Element[] {
    const edges: JSX.Element[] = [];
    l.children.forEach((c, i) => {
      edges.push(
        <line
          key={`${l.node.symbol}-${l.x}-${l.y}-${i}`}
          x1={l.x + 20}
          y1={l.y + 20}
          x2={c.x + 20}
          y2={c.y + 20}
          stroke="#64748b"
          strokeWidth={1.5}
        />
      );
      edges.push(...renderEdges(c));
    });
    return edges;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-4">
      <svg width={width} height={height + 20}>
        <g transform="translate(20,10)">
          {renderEdges(laidOut)}
          {allNodes.map((n, i) => (
            <g key={i} transform={`translate(${n.x},${n.y})`}>
              <circle
                cx={20}
                cy={20}
                r={18}
                fill={n.node.isTerminal ? "#0f172a" : "#1e293b"}
                stroke={n.node.isTerminal ? "#34d399" : "#38bdf8"}
                strokeWidth={2}
              />
              <text
                x={20}
                y={25}
                textAnchor="middle"
                fontSize={13}
                fontFamily="monospace"
                fill="#f1f5f9"
              >
                {n.node.symbol}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
