import { useEffect, useMemo, useState } from "react";
import Field from "../components/Field";
import GraphCanvas from "../components/GraphCanvas";
import { api } from "../api.js";

const LENSES = [
  ["dependencies", "Dependencies"],
  ["production", "Production Reach"],
  ["vulnerabilities", "Vulnerabilities"],
  ["repositories", "Repositories"],
  ["maintainers", "Maintainers"],
  ["infrastructure", "Infrastructure"],
];

function disp(id, catalog) {
  const n = catalog[id];
  if (!n) return id;
  if (n.kind === "version") return `pkg:${n.package}`;
  return n.id;
}

export default function Map({ go }) {
  const [graph, setGraph] = useState(null);
  const [trace, setTrace] = useState(null);
  const [lens, setLens] = useState("dependencies");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("map");
  const [pathI, setPathI] = useState(0);
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    Promise.all([api.graph(), api.trace()]).then(([g, t]) => {
      setGraph(g);
      setTrace(t);
    });
  }, []);

  const catalog = useMemo(() => Object.fromEntries((graph?.nodes || []).map((n) => [n.id, n])), [graph]);
  const path = trace?.paths?.[pathI];

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

  if (!graph) return <div className="page">Loading graph…</div>;
  if (graph.empty) {
    return (
      <div className="page">
        <h1>Your graph is empty.</h1>
        <p className="sub">Connect a GitHub repository to start tracing your software supply chain.</p>
        <button className="btn primary" onClick={() => go("/enter")}>Sign in with GitHub</button>
      </div>
    );
  }

  const kinds = (ks) => (graph.nodes || []).filter((n) => ks.includes(n.kind)).map((n) => n.id);
  let all = kinds(["vuln", "package", "app", "service", "env"]);
  if (lens === "maintainers") all = kinds(["package", "maintainer", "org"]);
  if (lens === "repositories") all = kinds(["repo", "app", "package"]);
  if (lens === "infrastructure") all = kinds(["service", "env", "app"]);
  if (lens === "production" || lens === "vulnerabilities") {
    const ids = new Set((trace?.paths || []).flatMap((p) => p.chain.map((id) => disp(id, catalog))));
    if (trace?.vulnId) ids.add(trace.vulnId);
    all = [...ids];
  }

  const highlight =
    mode === "trace" && path
      ? path.chain.slice(0, reveal).map((id) => disp(id, catalog))
      : lens === "vulnerabilities" || lens === "production"
        ? (trace?.paths || []).flatMap((p) => p.chain.map((id) => disp(id, catalog)))
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
        catalog={catalog}
        rawEdges={graph.edges}
        selected={selected?.id}
        highlight={highlight}
        dimOthers={mode === "trace" || lens === "production" || lens === "vulnerabilities"}
        onSelect={setSelected}
      />
      {mode === "trace" && trace && (
        <div className="pathbar">
          <span className={"badge " + (done ? "critical" : "")}>{done ? "Reach complete" : "Tracing…"}</span>
          <span className="tabular">
            {trace.counts?.paths || 0} paths · {trace.counts?.apps || 0} apps · {trace.counts?.prodServices || 0} production
          </span>
          <button className="btn ghost" onClick={() => setPathI((i) => (i + trace.paths.length - 1) % trace.paths.length)}>Previous path</button>
          <span className="tabular">Path {pathI + 1} of {trace.paths.length}</span>
          <button className="btn ghost" onClick={() => setPathI((i) => (i + 1) % trace.paths.length)}>Next path</button>
        </div>
      )}
      {selected && (
        <aside className="panel">
          <h2>{selected.name}{selected.version ? "@" + selected.version : ""}</h2>
          <div className="meta">{selected.kind}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => { setMode("trace"); setSelected(null); }}>Trace reach</button>
            <button className="btn" onClick={() => go("/app/simulate")}>Simulate change</button>
          </div>
        </aside>
      )}
    </div>
  );
}
