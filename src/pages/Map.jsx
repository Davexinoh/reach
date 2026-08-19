import { useEffect, useMemo, useState } from "react";
import Field from "../components/Field";
import GraphCanvas from "../components/GraphCanvas";
import { displayId, NODES } from "../data/graph.js";
import { traceVulnerability } from "../data/engine.js";

const LENSES = [
  ["dependencies", "Dependencies"],
  ["production", "Production Reach"],
  ["vulnerabilities", "Vulnerabilities"],
  ["repositories", "Repositories"],
  ["maintainers", "Maintainers"],
  ["infrastructure", "Infrastructure"],
];

export default function Map({ go }) {
  const trace = useMemo(() => traceVulnerability(), []);
  const [lens, setLens] = useState("dependencies");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("map");
  const [pathI, setPathI] = useState(0);
  const [reveal, setReveal] = useState(0);

  const path = trace.paths[pathI];

  useEffect(() => {
    if (mode !== "trace" || !path) return;
    setReveal(1);
    let i = 1;
    const t = setInterval(() => {
      i += 1;
      setReveal(i);
      if (i >= path.chain.length) clearInterval(t);
    }, 160);
    return () => clearInterval(t);
  }, [mode, pathI, path]);

  const all = useMemo(() => {
    const by = (kinds) => NODES.filter((n) => kinds.includes(n.kind)).map((n) => n.id);
    if (lens === "maintainers") return by(["package", "maintainer", "org"]);
    if (lens === "repositories") return by(["repo", "app", "package"]);
    if (lens === "infrastructure") return by(["service", "env", "app"]);
    if (lens === "production") {
      const ids = new Set(
        trace.paths.filter((p) => p.env && p.env.includes("prod")).flatMap((p) => p.chain.map(displayId))
      );
      ids.add(trace.vulnId);
      return [...ids];
    }
    if (lens === "vulnerabilities") {
      return [trace.vulnId, ...trace.paths.flatMap((p) => p.chain.map(displayId))];
    }
    return by(["vuln", "package", "app", "service", "env"]);
  }, [lens, trace]);

  const highlight =
    mode === "trace" && path
      ? path.chain.slice(0, reveal).map(displayId)
      : lens === "vulnerabilities" || lens === "production"
        ? [trace.vulnId, ...trace.paths.flatMap((p) => p.chain.map(displayId))]
        : [];

  const done = mode === "trace" && path && reveal >= path.chain.length;

  return (
    <div className="map-wrap">
      <Field />
      <div className="lenses" role="tablist" aria-label="Lens">
        {LENSES.map(([k, l]) => (
          <button key={k} className={lens === k ? "on" : ""} onClick={() => { setLens(k); setMode("map"); }}>
            {l}
          </button>
        ))}
      </div>
      <GraphCanvas
        nodes={all}
        selected={selected?.id}
        highlight={highlight}
        dimOthers={mode === "trace" || lens === "production" || lens === "vulnerabilities"}
        onSelect={setSelected}
      />
      {mode === "trace" && (
        <div className="pathbar">
          <span className={"badge " + (done ? "critical" : "")}>{done ? "Reach complete" : "Tracing…"}</span>
          <span className="tabular">
            {trace.counts.paths} paths · {trace.counts.apps} apps · {trace.counts.prodServices} production
          </span>
          <button className="btn ghost" onClick={() => setPathI((i) => (i + trace.paths.length - 1) % trace.paths.length)}>
            Previous path
          </button>
          <span className="tabular">Path {pathI + 1} of {trace.paths.length}</span>
          <button className="btn ghost" onClick={() => setPathI((i) => (i + 1) % trace.paths.length)}>
            Next path
          </button>
        </div>
      )}
      {selected && (
        <aside className="panel" aria-label="Inspection">
          <h2>
            {selected.name}
            {selected.version ? "@" + selected.version : ""}
          </h2>
          <div className="meta">
            {selected.kind} · {selected.id}
          </div>
          <div className="row">
            <span>Exposure</span>
            <b>{trace.paths.some((p) => p.chain.map(displayId).includes(displayId(selected.id))) ? "In reach" : "Not on this event"}</b>
          </div>
          <div className="row">
            <span>Production services</span>
            <b className="tabular">{trace.prodServices.length}</b>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            <button
              className="btn primary"
              onClick={() => {
                setMode("trace");
                setSelected(null);
              }}
            >
              Trace reach
            </button>
            <button className="btn" onClick={() => go("/app/simulate")}>
              Simulate change
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
