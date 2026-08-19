import { useEffect, useState } from "react";
import GraphCanvas from "../components/GraphCanvas";
import { api } from "../api.js";

export default function Simulate() {
  const [sim, setSim] = useState(null);
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    Promise.all([api.simulate(), api.graph()]).then(([s, g]) => {
      setSim(s);
      setGraph(g);
    });
  }, []);

  if (!sim || !graph) return <div className="page">Computing simulation…</div>;
  if (sim.empty) {
    return (
      <div className="page">
        <h1>Nothing to simulate</h1>
        <p className="sub">Load a graph with a known vulnerable version first.</p>
      </div>
    );
  }

  const catalog = Object.fromEntries((graph.nodes || []).map((n) => [n.id, n]));
  const nodes = (graph.nodes || [])
    .filter((n) => ["vuln", "package", "app", "service", "env"].includes(n.kind))
    .map((n) => n.id)
    .slice(0, 40);
  const beforeHi = (sim.before?.paths?.[0]?.chain || []).map((id) => catalog[id]?.kind === "version" ? `pkg:${catalog[id].package}` : id);
  const afterHi = (sim.after?.paths || [])
    .filter((p) => catalog[p.env]?.production)
    .flatMap((p) => p.chain.map((id) => catalog[id]?.kind === "version" ? `pkg:${catalog[id].package}` : id));

  return (
    <div className="page">
      <h1>Simulate change</h1>
      <p className="sub">What happens if the affected version is upgraded or dropped.</p>
      <div className="split">
        <div className="card">
          <div className="k">Before · {sim.before.exposure}</div>
          <div className="metric" style={{ marginTop: 12 }}>
            <span>Production services</span>
            <strong className="tabular">{sim.before.counts.prodServices}</strong>
          </div>
          <GraphCanvas nodes={nodes} catalog={catalog} rawEdges={graph.edges} highlight={beforeHi} dimOthers compact />
        </div>
        <div className="card">
          <div className="k">After · {sim.after.exposure}</div>
          <div className="metric" style={{ marginTop: 12 }}>
            <span>Production services</span>
            <strong className="tabular">{sim.after.counts.prodServices}</strong>
          </div>
          <GraphCanvas nodes={nodes} catalog={catalog} rawEdges={graph.edges} highlight={afterHi} dimOthers compact />
        </div>
      </div>
    </div>
  );
}
