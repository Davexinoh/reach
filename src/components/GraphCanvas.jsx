import { nodeById } from "../data/graph";

const LAYERS = [
  { key: "vuln", label: "Reach event", y: 36 },
  { key: "version", label: "Packages", y: 130 },
  { key: "app", label: "Applications", y: 230 },
  { key: "service", label: "Services", y: 330 },
  { key: "env", label: "Environments", y: 430 },
];

function shape(kind, x, y, active, dim) {
  const stroke = active ? "var(--accent)" : dim ? "#2a2a30" : "#3a3a42";
  const fill = "var(--bg-2)";
  if (kind === "vuln") {
    return <polygon points={`${x},${y - 14} ${x + 14},${y} ${x},${y + 14} ${x - 14},${y}`} fill={fill} stroke="#e5484d" strokeWidth="1.5" />;
  }
  if (kind === "version" || kind === "package") {
    return <circle cx={x} cy={y} r="12" fill={fill} stroke={stroke} />;
  }
  if (kind === "app") {
    return <rect x={x - 11} y={y - 11} width="22" height="22" fill={fill} stroke={stroke} />;
  }
  if (kind === "service") {
    return <rect x={x - 16} y={y - 10} width="32" height="20" rx="6" fill={fill} stroke={stroke} />;
  }
  if (kind === "env") {
    const s = 12;
    return <polygon points={`${x},${y - s} ${x + s},${y - s / 2} ${x + s},${y + s / 2} ${x},${y + s} ${x - s},${y + s / 2} ${x - s},${y - s / 2}`} fill={fill} stroke={stroke} />;
  }
  return <rect x={x - 12} y={y - 9} width="24" height="18" fill={fill} stroke={stroke} />;
}

export default function GraphCanvas({
  nodes,
  highlight = [],
  dimOthers = false,
  onSelect,
  selected,
  lens = "dependencies",
}) {
  const hi = new Set(highlight);
  const grouped = {};
  for (const id of nodes) {
    const n = nodeById(id);
    if (!n) continue;
    if (lens === "production" && n.kind === "version" && !hi.has(id) && dimOthers) continue;
    const key = n.kind === "package" ? "version" : n.kind;
    (grouped[key] ||= []).push(n);
  }

  const width = 1100;
  const positions = {};
  for (const layer of LAYERS) {
    const list = grouped[layer.key] || [];
    list.forEach((n, i) => {
      const x = 90 + ((i + 1) * (width - 140)) / (list.length + 1);
      positions[n.id] = { x, y: layer.y, node: n };
    });
  }

  return (
    <svg className="canvas" viewBox={`0 0 ${width} 480`} role="img" aria-label="Software graph">
      {LAYERS.map((l) => (
        <text key={l.key} x="16" y={l.y - 22} fill="#5c5c63" fontSize="10" letterSpacing="0.12em">
          {l.label.toUpperCase()}
        </text>
      ))}
      {Object.values(positions).map(({ x, y, node }) => {
        const active = hi.size ? hi.has(node.id) : selected === node.id;
        const dim = dimOthers && hi.size && !hi.has(node.id);
        return (
          <g key={node.id} opacity={dim ? 0.22 : 1} onClick={() => onSelect?.(node)} style={{ cursor: "pointer" }}>
            {shape(node.kind, x, y, active || selected === node.id, dim)}
            <text x={x} y={y + 28} textAnchor="middle" fill="#ececee" fontSize="11">
              {node.version ? `${node.name}@${node.version}` : node.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
