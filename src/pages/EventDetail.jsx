import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function EventDetail({ go, id }) {
  const [t, setT] = useState(null);
  const [i, setI] = useState(0);
  const [plan, setPlan] = useState(false);

  useEffect(() => {
    api.trace(id).then(setT);
  }, [id]);

  if (!t) return <div className="page">Loading event…</div>;
  if (t.empty || !t.paths) {
    return (
      <div className="page">
        <h1>No reach event</h1>
        <p className="sub">Connect repositories and scan before tracing.</p>
      </div>
    );
  }

  const path = t.paths[i];
  const prod = t.counts?.prodServices || 0;

  return (
    <div className="page">
      <div className="k">Reach event</div>
      <h1>{t.vuln?.affected || t.vuln?.name}</h1>
      <p className="sub">
        <span className={"badge " + (t.exposure || "low")}>{t.exposure}</span>{" "}
        {t.vuln?.cve || t.vulnId} · CVSS {t.vuln?.cvss}
      </p>
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
            {path?.chain.map((cid) => (
              <div key={cid} className="active">{cid.replace(/^[^:]+:/, "")}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
            <button className="btn" onClick={() => setI((x) => (x + t.paths.length - 1) % t.paths.length)}>Previous path</button>
            <span className="tabular">{i + 1} / {t.paths.length}</span>
            <button className="btn" onClick={() => setI((x) => (x + 1) % t.paths.length)}>Next path</button>
          </div>
        </div>
        <div className="card">
          <div className="k">Exposure</div>
          <div className="row"><span>Production services</span><b className="tabular">{prod}</b></div>
          <div className="k" style={{ marginTop: 18 }}>Recommended action</div>
          <p className="sub">Upgrade or replace the affected version, then re-trace.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => go("/app/simulate")}>Simulate change</button>
            <button className="btn" onClick={() => setPlan(true)}>Create remediation plan</button>
          </div>
          {plan && <p className="sub" style={{ marginTop: 12 }}>Bump the resolved version in the lockfile of each listed repo, then rebuild the graph.</p>}
        </div>
      </div>
    </div>
  );
}
