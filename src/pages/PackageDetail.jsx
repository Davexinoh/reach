import { NODES } from "../data/graph.js";
import { packageStats, traceVulnerability } from "../data/engine";

export default function PackageDetail({ name, go }) {
  const pkg = packageStats().find((p) => p.name === name) || packageStats()[0];
  const versions = NODES.filter((n) => n.kind === "version" && n.package === pkg.name);
  const t = traceVulnerability();
  return (
    <div className="page">
      <button className="btn ghost" onClick={() => go("/app/packages")}>← Packages</button>
      <h1>{pkg.name}</h1>
      <p className="sub">Versions {pkg.versions.join(", ")}</p>
      <div className="metrics">
        <div className="metric"><span>Dependents</span><strong className="tabular">{pkg.dependents}</strong></div>
        <div className="metric"><span>Production reach</span><strong>{pkg.production ? "Yes" : "No"}</strong></div>
        <div className="metric"><span>Exposure</span><strong>{pkg.exposure}</strong></div>
      </div>
      <div className="card">
        <div className="k">Versions</div>
        {versions.map((v) => (
          <div key={v.id} className="row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
            <span>{v.version}</span>
            <span className="tabular">{t.paths.some((p) => p.chain.includes(v.id)) ? "on reach paths" : "not on this event"}</span>
          </div>
        ))}
      </div>
      <button className="btn primary" style={{ marginTop: 16 }} onClick={() => go("/app/map")}>Trace reach</button>
    </div>
  );
}
