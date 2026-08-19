import { useMemo, useState } from "react";
import { displayEdges, displayId, nodeById } from "../data/graph.js";

const LAYERS = [
  { key: "vuln", label: "Reach event", y: 56 },
  { key: "package", label: "Packages", y: 170 },
  { key: "maintainer", label: "Maintainers", y: 280 },
  { key: "app", label: "Applications", y: 390 },
  { key: "service", label: "Services", y: 500 },
  { key: "env", label: "Environments", y: 610 },
  { key: "repo", label: "Repositories", y: 280 },
];

function shape(kind, x, y, hot) {
  const stroke = hot ? "#e5484d" : kind === "vuln" ? "#e5484d" : "#6b7cff";
  const fill = "#111113";
  if (kind === "vuln") {
    return (
      <g>
        <circle cx={x} cy={y} r="22" fill="rgba(229,72,77,0.12)" className="pulse-ring" />
        <polygon
          points={`${x},${y - 16} ${x + 16},${y} ${x},${y + 16} ${x - 16},${y}`}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.6"
        />
      </g>
    );
  }
  if (kind === "package") return <circle cx={x} cy={y} r="14" fill={fill} stroke={stroke} strokeWidth="1.4" />;
  if (kind === "maintainer") return <circle cx={x} cy={y} r="11" fill={fill} stroke="#c5cdff" />;
  if (kind === "repo") return <rect x={x - 16} y={y - 11} width="32" height="22" fill={fill} stroke="#9aa3b5" />;
  if (kind === "app") return <rect x={x - 13} y={y - 13} width="26" height="26" fill={fill} stroke={stroke} />;
  if (kind === "service") return <rect x={x - 20} y={y - 11} width="40" height="22" rx="8" fill={fill} stroke={stroke} />;
  if (kind === "env") {
    const s = 14;
    return (
      <polygon
        points={`${x},${y - s} ${x + s},${y - s / 2} ${x + s},${y + s / 2} ${x},${y + s} ${x - s},${y + s / 2} ${x - s},${y - s / 2}`}
        fill={fill}
        stroke={stroke}
      />
    );
  }
  return <rect x={x - 14} y={y - 10} width="28" height="20" fill={fill} stroke={stroke} />;
}

function shortLabel(node) {
  if (node.kind === "package") return node.name.replace("vulnerable-lib", "vulnerable-lib");
  return node.name;
}

export default function GraphCanvas({
  nodes,
  highlight = [],
  dimOthers = false,
  onSelect,
  selected,
  compact = false,
}) {
  const [hover, setHover] = useState(null);
  const hi = useMemo(() => new Set(highlight.map(displayId)), [highlight]);

  const visible = useMemo(() => {
    const ids = new Set(nodes.map(displayId));
    return [...ids].map(nodeById).filter(Boolean);
  }, [nodes]);

  const width = compact ? 900 : 1280;
  const height = compact ? 420 : 700;
  const positions = useMemo(() => {
    const grouped = {};
    for (const n of visible) {
      const key = n.kind === "version" ? "package" : n.kind;
      (grouped[key] ||= []).push(n);
    }
    const pos = {};
    for (const layer of LAYERS) {
      const list = grouped[layer.key] || [];
      const y = compact ? layer.y * 0.62 : layer.y;
      list.forEach((n, i) => {
        const x = 110 + ((i + 1) * (width - 180)) / (list.length + 1);
        pos[n.id] = { x, y, node: n };
      });
    }
    return pos;
  }, [visible, compact, width]);

  const edges = useMemo(() => {
    return displayEdges().filter(([a, b]) => positions[a] && positions[b]);
  }, [positions]);

  const neighbor = hover
    ? new Set(
        edges.flatMap(([a, b]) => (a === hover || b === hover ? [a, b] : []))
      )
    : null;

  return (
    <svg className="canvas" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Software graph">
      <defs>
        <linearGradient id="flow" x1="0" x2="1">
          <stop offset="0" stopColor="#8ea0ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8ea0ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8ea0ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {LAYERS.map((l) => (
        <text
          key={l.key}
          x="28"
          y={(compact ? l.y * 0.62 : l.y) - 36}
          fill="#5c5c63"
          fontSize="10"
          letterSpacing="0.16em"
        >
          {l.label.toUpperCase()}
        </text>
      ))}
      {edges.map(([a, b, rel]) => {
        const A = positions[a];
        const B = positions[b];
        const onPath = hi.size ? hi.has(a) && hi.has(b) : false;
        const related = neighbor ? neighbor.has(a) && neighbor.has(b) : false;
        const dim = dimOthers && hi.size && !onPath;
        const midX = (A.x + B.x) / 2;
        const midY = (A.y + B.y) / 2;
        return (
          <g key={a + b + rel} opacity={dim ? 0.08 : related || onPath ? 1 : 0.28}>
            <path
              d={`M ${A.x} ${A.y} C ${A.x} ${midY}, ${B.x} ${midY}, ${B.x} ${B.y}`}
              fill="none"
              stroke={onPath ? "#e5484d" : "#5a64a8"}
              strokeWidth={onPath ? 1.8 : 1}
              className={onPath ? "edge-flow" : undefined}
            />
            {related && (
              <text x={midX} y={midY - 6} textAnchor="middle" fill="#8b8b92" fontSize="9">
                {rel}
              </text>
            )}
          </g>
        );
      })}
      {Object.values(positions).map(({ x, y, node }) => {
        const id = node.id;
        const active = hi.size ? hi.has(id) : selected === id;
        const dim = dimOthers && hi.size && !hi.has(id);
        const hot = node.kind === "vuln" || (node.kind === "package" && node.name === "vulnerable-lib" && hi.has(id));
        return (
          <g
            key={id}
            opacity={dim ? 0.18 : 1}
            onClick={() => onSelect?.(node)}
            onMouseEnter={() => setHover(id)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          >
            {shape(node.kind, x, y, hot || active)}
            <text x={x} y={y + 32} textAnchor="middle" fill="#ececee" fontSize="11">
              {shortLabel(node)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
