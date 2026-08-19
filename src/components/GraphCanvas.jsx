import { useMemo, useState } from "react";
import { displayEdges as harborEdges, nodeById } from "../data/graph.js";

function disp(id, catalog) {
  const n = catalog?.[id] || nodeById(id);
  if (!n) return id;
  if (n.kind === "version") return `pkg:${n.package}`;
  return n.id;
}

const KIND_COLOR = {
  vuln: "#e5484d",
  package: "#8ea0ff",
  maintainer: "#c5cdff",
  repo: "#9aa3b5",
  app: "#8ea0ff",
  service: "#70b8ff",
  env: "#30a46c",
};

function Tile({ x, y, color, hot, size, children }) {
  const s = size;
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2})`}>
      {hot && (
        <rect
          x={-5}
          y={-5}
          width={s + 10}
          height={s + 10}
          rx="13"
          fill={color}
          opacity="0.16"
          className="pulse-ring"
        />
      )}
      <rect
        width={s}
        height={s}
        rx="10"
        fill="#141416"
        stroke={hot ? color : "rgba(255,255,255,0.12)"}
        strokeWidth={hot ? 1.7 : 1}
      />
      <rect x="1" y="1" width={s - 2} height={s - 2} rx="9" fill={`${color}14`} />
      <g
        transform={`translate(${(s - 20) / 2} ${(s - 20) / 2})`}
        fill="none"
        stroke={color}
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </g>
  );
}

function Glyph({ kind, x, y, hot, compact }) {
  const color = KIND_COLOR[kind] || "#8ea0ff";
  const size = compact ? 30 : 36;
  const icon = {
    vuln: (
      <>
        <path d="M10 1.8 17.2 4.6v5c0 4.2-3.1 7.6-7.2 9.2C6 17.2 2.8 13.8 2.8 9.6v-5Z" />
        <path d="M10 7.2v4.1" />
        <circle cx="10" cy="13.6" r="0.75" fill={color} stroke="none" />
      </>
    ),
    package: (
      <>
        <path d="M10 2.2 17.6 6.2v7.6L10 17.8 2.4 13.8V6.2Z" />
        <path d="M10 17.8V10" />
        <path d="M2.4 6.2 10 10l7.6-3.8" />
      </>
    ),
    app: (
      <>
        <rect x="2.2" y="3" width="15.6" height="14" rx="2.2" />
        <path d="M2.2 7.2h15.6" />
        <circle cx="5.2" cy="5.1" r="0.7" fill={color} stroke="none" />
        <circle cx="7.6" cy="5.1" r="0.7" fill={color} stroke="none" />
        <path d="M5.2 10.4h6.4M5.2 13.2h9.2" />
      </>
    ),
    service: (
      <>
        <rect x="2.2" y="1.8" width="15.6" height="4.6" rx="1.2" />
        <rect x="2.2" y="7.7" width="15.6" height="4.6" rx="1.2" />
        <rect x="2.2" y="13.6" width="15.6" height="4.6" rx="1.2" />
        <circle cx="5.2" cy="4.1" r="0.65" fill={color} stroke="none" />
        <circle cx="5.2" cy="10" r="0.65" fill={color} stroke="none" />
        <circle cx="5.2" cy="15.9" r="0.65" fill={color} stroke="none" />
      </>
    ),
    env: (
      <path d="M5.8 14.6h9.6c1.8 0 3-1.4 3-3s-1.3-2.8-3-2.8c-.2-2.1-2-3.8-4.2-3.8-1.8 0-3.3 1.1-3.9 2.7C5.2 8 3.4 9.7 3.4 11.7c0 1.8 1.4 2.9 2.4 2.9Z" />
    ),
    repo: (
      <>
        <path d="M5 2.6h9.2c1.4 0 2.4 1 2.4 2.3v12.3l-7-3.1-7 3.1V4.9c0-1.3 1-2.3 2.4-2.3Z" />
        <path d="M8.2 6.4h5.2M8.2 9.2h5.2" />
      </>
    ),
    maintainer: (
      <>
        <circle cx="10" cy="6.8" r="3.1" />
        <path d="M4.2 17c0-3.4 2.6-5 5.8-5s5.8 1.6 5.8 5" />
      </>
    ),
  }[kind] || (
    <rect x="3.5" y="3.5" width="13" height="13" rx="3" />
  );

  return (
    <Tile x={x} y={y} color={color} hot={hot} size={size}>
      {icon}
    </Tile>
  );
}

function shortLabel(node) {
  const raw = String(node.name || node.id || "");
  if (node.kind === "vuln") {
    const ghsa = raw.match(/GHSA-([a-z0-9]{4})/i);
    if (ghsa) return `GHSA-${ghsa[1]}`;
    const cve = raw.match(/CVE-\d{4}-\d+/i);
    if (cve) return cve[0];
    return raw.length > 12 ? `${raw.slice(0, 10)}…` : raw;
  }
  if (node.kind === "package") {
    const leaf = raw.split("/").pop() || raw;
    return leaf.length > 14 ? `${leaf.slice(0, 12)}…` : leaf;
  }
  if (raw.length > 14) return `${raw.slice(0, 12)}…`;
  return raw;
}

function capKind(list, kind, max, hi) {
  const of = list.filter((n) => n.kind === kind);
  if (of.length <= max) return { list, hidden: 0 };
  const keep = new Set(of.filter((n) => hi.has(n.id)).map((n) => n.id));
  for (const n of of) {
    if (keep.size >= max) break;
    keep.add(n.id);
  }
  return {
    list: list.filter((n) => n.kind !== kind || keep.has(n.id)),
    hidden: of.length - keep.size,
  };
}

const LAYER_ORDER = [
  { key: "vuln", label: "Advisories" },
  { key: "package", label: "Packages" },
  { key: "repo", label: "Repositories" },
  { key: "maintainer", label: "Maintainers" },
  { key: "app", label: "Applications" },
  { key: "service", label: "Services" },
  { key: "env", label: "Environments" },
];

export default function GraphCanvas({
  nodes,
  catalog,
  rawEdges,
  highlight = [],
  dimOthers = false,
  onSelect,
  selected,
  compact = false,
}) {
  const [hover, setHover] = useState(null);
  const hi = useMemo(() => new Set(highlight.map((id) => disp(id, catalog))), [highlight, catalog]);

  const { visible, extras } = useMemo(() => {
    const ids = new Set(nodes.map((id) => disp(id, catalog)));
    let list = [...ids].map((id) => catalog?.[id] || nodeById(id)).filter(Boolean);
    const hidden = {};
    const caps = compact
      ? { vuln: 6, package: 7, app: 5, service: 5, env: 4, repo: 5, maintainer: 5 }
      : { vuln: 10, package: 12, app: 8, service: 8, env: 6, repo: 8, maintainer: 8 };
    for (const [kind, max] of Object.entries(caps)) {
      const next = capKind(list, kind, max, hi);
      list = next.list;
      if (next.hidden) hidden[kind] = next.hidden;
    }
    return { visible: list, extras: hidden };
  }, [nodes, catalog, hi, compact]);

  const colGap = compact ? 108 : 132;
  const rowGap = compact ? 78 : 96;
  const padX = compact ? 72 : 96;

  const { positions, width, height, layers } = useMemo(() => {
    const grouped = {};
    for (const n of visible) {
      const key = n.kind === "version" ? "package" : n.kind;
      (grouped[key] ||= []).push(n);
    }
    const plans = [];
    for (const layer of LAYER_ORDER) {
      const list = grouped[layer.key] || [];
      if (!list.length) continue;
      const cols = Math.max(1, Math.min(list.length, compact ? 6 : 8));
      plans.push({
        ...layer,
        list,
        cols,
        rows: Math.ceil(list.length / cols),
        extra: extras[layer.key] || 0,
      });
    }
    const maxW = Math.max(
      compact ? 900 : 1100,
      ...plans.map((p) => padX * 2 + (p.cols + 1) * colGap)
    );
    const pos = {};
    const laid = [];
    let y = compact ? 48 : 64;
    for (const plan of plans) {
      laid.push({ key: plan.key, label: plan.label, y, rows: plan.rows, extra: plan.extra });
      plan.list.forEach((n, i) => {
        const row = Math.floor(i / plan.cols);
        const col = i % plan.cols;
        const inRow = Math.min(plan.cols, plan.list.length - row * plan.cols);
        const span = (inRow + 1) * colGap;
        const x = (maxW - span) / 2 + (col + 1) * colGap;
        pos[n.id] = { x, y: y + row * rowGap, node: n, row };
      });
      y += plan.rows * rowGap + (compact ? 18 : 28);
    }
    return { positions: pos, width: maxW, height: Math.max(compact ? 360 : 520, y + 24), layers: laid };
  }, [visible, extras, compact, colGap, rowGap, padX]);

  const edges = useMemo(() => {
    const src = rawEdges || harborEdges();
    const collapsed = [];
    const seen = new Set();
    for (const [from, to, rel] of src) {
      const a = disp(from, catalog);
      const b = disp(to, catalog);
      if (a === b) continue;
      const key = `${a}>${b}>${rel}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collapsed.push([a, b, rel]);
    }
    return collapsed.filter(([a, b]) => positions[a] && positions[b]);
  }, [positions, rawEdges, catalog]);

  const neighbor = hover
    ? new Set(edges.flatMap(([a, b]) => (a === hover || b === hover ? [a, b] : [])))
    : null;

  return (
    <div className="canvas-scroll">
      <svg className="canvas" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Software graph">
        <defs>
          <filter id="label-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>
        {layers.map((l) => (
          <g key={l.key}>
            <text
              x="28"
              y={l.y - 28}
              fill="#5c5c63"
              fontSize="10"
              letterSpacing="0.16em"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {l.label.toUpperCase()}
              {l.extra ? `  +${l.extra}` : ""}
            </text>
          </g>
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
            <g key={a + b + rel} opacity={dim ? 0.07 : related || onPath ? 1 : 0.22}>
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
        {Object.values(positions).map(({ x, y, node, row }) => {
          const id = node.id;
          const active = hi.size ? hi.has(id) : selected === id;
          const dim = dimOthers && hi.size && !hi.has(id);
          const hot = node.kind === "vuln" || active || hover === id;
          const label = shortLabel(node);
          const showFull = hover === id || selected === id;
          const text = showFull ? String(node.name || label) : label;
          const clipped = text.length > 18 ? `${text.slice(0, 16)}…` : text;
          const pillW = Math.min(168, 18 + clipped.length * 6.4);
          const labelY = y + (compact ? 26 : 30) + (row % 2 === 1 ? 2 : 0);
          return (
            <g
              key={id}
              opacity={dim ? 0.18 : 1}
              onClick={() => onSelect?.(node)}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <Glyph kind={node.kind} x={x} y={y} hot={hot} compact={compact} />
              <g filter="url(#label-shadow)">
                <rect
                  x={x - pillW / 2}
                  y={labelY}
                  width={pillW}
                  height="16"
                  rx="8"
                  fill="#0d0d0f"
                  stroke="rgba(255,255,255,0.06)"
                />
                <text
                  x={x}
                  y={labelY + 11.5}
                  textAnchor="middle"
                  fill="#ececee"
                  fontSize="10"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                >
                  {clipped}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
