import { useMemo, useState } from "react";
import { nodeById } from "../data/graph";
import { traceVulnerability } from "../data/engine";

export default function EventDetail({ go }) {
  const t = useMemo(() => traceVulnerability(), []);
  const [i, setI] = useState(0);
  const path = t.paths[i];
  return (
    <div className="page">
      <div className="k">Reach event</div>
      <h1>vulnerable-lib@2.4.1</h1>
      <p className="sub">CVE-2026-4418 · CVSS 9.8 · {t.exposure}</p>
      <div className="metrics">
        <div className="metric"><span>Reachable applications</span><strong className="tabular">{t.counts.apps}</strong></div>
        <div className="metric"><span>Production services</span><strong className="tabular">{t.counts.prodServices}</strong></div>
        <div className="metric"><span>Repositories</span><strong className="tabular">{t.counts.repos}</strong></div>
        <div className="metric"><span>Dependency paths</span><strong className="tabular">{t.counts.paths}</strong></div>
      </div>
      <div className="split">
        <div className="card">
          <div className="k">How it reaches production</div>
          <div className="path" style={{ marginTop: 12 }}>
            {path?.chain.map((id) => {
              const n = nodeById(id);
              return <div key={id} className="active">{n?.name}{n?.version ? "@" + n.version : ""}</div>;
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn" onClick={() => setI((x) => (x + t.paths.length - 1) % t.paths.length)}>Previous path</button>
            <span className="tabular" style={{ alignSelf: "center" }}>{i + 1} / {t.paths.length}</span>
            <button className="btn" onClick={() => setI((x) => (x + 1) % t.paths.length)}>Next path</button>
          </div>
        </div>
        <div className="card">
          <div className="k">Recommended action</div>
          <h2 style={{ fontSize: 18, margin: "10px 0" }}>Upgrade payments-lib</h2>
          <p className="sub">5.2.0 → 5.2.1 removes vulnerable-lib@2.4.1 from the Payments and Checkout paths.</p>
          <button className="btn primary" onClick={() => go("/app/simulate")}>Simulate upgrade</button>
        </div>
      </div>
    </div>
  );
}
