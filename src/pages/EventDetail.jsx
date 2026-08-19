import { useMemo, useState } from "react";
import { nodeById } from "../data/graph.js";
import { traceVulnerability } from "../data/engine.js";

export default function EventDetail({ go }) {
  const t = useMemo(() => traceVulnerability(), []);
  const [i, setI] = useState(0);
  const [plan, setPlan] = useState(false);
  const path = t.paths[i];
  const prod = t.paths.filter((p) => nodeById(p.env)?.production).length;
  const staging = t.paths.filter((p) => p.env?.includes("staging")).length;
  const dev = t.paths.filter((p) => p.env?.includes("dev")).length;

  return (
    <div className="page">
      <div className="k">Reach event</div>
      <h1>vulnerable-lib@2.4.1</h1>
      <p className="sub">
        <span className="badge critical">Critical</span>{" "}
        CVE-2026-4418 · CVSS 9.8 · {t.exposure}
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
            {path?.chain.map((id) => {
              const n = nodeById(id);
              return (
                <div key={id} className="active">
                  {n?.name}
                  {n?.version ? "@" + n.version : ""}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
            <button className="btn" onClick={() => setI((x) => (x + t.paths.length - 1) % t.paths.length)}>Previous path</button>
            <span className="tabular">{i + 1} / {t.paths.length}</span>
            <button className="btn" onClick={() => setI((x) => (x + 1) % t.paths.length)}>Next path</button>
          </div>
        </div>
        <div className="card">
          <div className="k">Exposure</div>
          <div className="row"><span>Production</span><b className="tabular">{prod} paths</b></div>
          <div className="row"><span>Internal / staging</span><b className="tabular">{staging} paths</b></div>
          <div className="row"><span>Development</span><b className="tabular">{dev} paths</b></div>
          <div className="k" style={{ marginTop: 18 }}>Recommended action</div>
          <h2 style={{ fontSize: 18, margin: "10px 0" }}>Upgrade payments-lib</h2>
          <p className="sub">5.2.0 → 5.2.1 drops vulnerable-lib@2.4.1 from Payments and Checkout.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => go("/app/simulate")}>Simulate upgrade</button>
            <button className="btn" onClick={() => setPlan(true)}>Create remediation plan</button>
          </div>
          {plan && (
            <p className="sub" style={{ marginTop: 12 }}>
              Plan: bump payments-lib in payments-api, checkout-web, orders-service, then re-trace. Analytics still uses http-client@3.1.0 in Development only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
