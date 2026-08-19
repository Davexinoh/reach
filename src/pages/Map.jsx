import { useMemo, useState } from "react";
import GraphCanvas from "../components/GraphCanvas";
import { NODES } from "../data/graph";
import { traceVulnerability } from "../data/engine";

const LENSES = [
  ["dependencies", "Dependencies"],
  ["production", "Production Reach"],
  ["vulnerabilities", "Vulnerabilities"],
  ["repositories", "Repositories"],
];

export default function Map({ go }) {
  const trace = useMemo(() => traceVulnerability(), []);
  const [lens, setLens] = useState("dependencies");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("map");
  const [pathI, setPathI] = useState(0);

  const all = NODES.filter((n) => ["vuln", "version", "app", "service", "env", "repo"].includes(n.kind)).map((n) => n.id);
  const path = trace.paths[pathI];
  const highlight = mode === "trace" && path ? path.chain : lens === "vulnerabilities" ? [trace.vulnId, ...trace.paths.flatMap((p) => p.chain)].slice(0, 20) : [];

  return (
    <div className="map-wrap">
      <div className="lenses" role="tablist" aria-label="Lens">
        {LENSES.map(([k, l]) => (
          <button key={k} className={lens === k ? "on" : ""} onClick={() => setLens(k)}>{l}</button>
        ))}
      </div>
      <GraphCanvas
        nodes={all}
        lens={lens}
        selected={selected?.id}
        highlight={highlight}
        dimOthers={mode === "trace"}
        onSelect={setSelected}
      />
      <div className="float">
        <button aria-label="Fit">⊕</button>
        <button aria-label="Center">⊙</button>
      </div>
      {mode === "trace" && (
        <div className="pathbar">
          <span className="badge critical">Reach complete</span>
          <span className="tabular">{trace.counts.paths} paths · {trace.counts.apps} apps · {trace.counts.prodServices} production</span>
          <button className="btn ghost" onClick={() => setPathI((i) => (i + trace.paths.length - 1) % trace.paths.length)}>Prev</button>
          <span className="tabular">Path {pathI + 1} of {trace.paths.length}</span>
          <button className="btn ghost" onClick={() => setPathI((i) => (i + 1) % trace.paths.length)}>Next</button>
        </div>
      )}
      {selected && (
        <aside className="panel">
          <h2>{selected.name}{selected.version ? "@" + selected.version : ""}</h2>
          <div className="meta">{selected.kind} · {selected.id}</div>
          <div className="row"><span>Exposure</span><b>{trace.paths.some((p) => p.chain.includes(selected.id)) ? "In reach" : "Not on this event"}</b></div>
          <div className="row"><span>Production paths</span><b className="tabular">{trace.prodServices.length}</b></div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button className="btn primary" onClick={() => { setMode("trace"); setSelected(null); }}>Trace reach</button>
            <button className="btn" onClick={() => go("/app/simulate")}>Simulate change</button>
          </div>
        </aside>
      )}
    </div>
  );
}
