import { useMemo, useState } from "react";
import GraphCanvas from "../components/GraphCanvas";
import { displayId } from "../data/graph.js";
import { simulateUpgrade } from "../data/engine.js";

export default function Simulate() {
  const [action, setAction] = useState("upgrade");
  const sim = useMemo(
    () => simulateUpgrade("ver:payments-lib@5.2.0", "ver:payments-lib@5.2.1"),
    []
  );
  const beforeHi = sim.before.paths[0]?.chain.map(displayId) || [];
  const afterHi = sim.after.paths.filter((p) => p.env?.includes("prod")).flatMap((p) => p.chain.map(displayId));
  const nodes = [
    "vuln:cve-2026-4418",
    "pkg:vulnerable-lib",
    "pkg:payments-lib",
    "pkg:checkout-sdk",
    "pkg:http-client",
    "app:payments",
    "app:checkout",
    "app:orders",
    "app:analytics",
    "svc:payments-api",
    "svc:orders-service",
    "env:prod-us",
    "env:dev",
  ];

  return (
    <div className="page">
      <h1>Simulate change</h1>
      <p className="sub">What happens if you change payments-lib? The graph is the result, not a caption.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["upgrade", "remove", "replace", "downgrade"].map((a) => (
          <button key={a} className={"btn" + (action === a ? " primary" : "")} onClick={() => setAction(a)}>
            {a} dependency
          </button>
        ))}
      </div>
      <div className="split">
        <div className="card">
          <div className="k">Before · {sim.before.exposure}</div>
          <div className="metric" style={{ marginTop: 12 }}>
            <span>Production services</span>
            <strong className="tabular">{sim.before.counts.prodServices}</strong>
          </div>
          <GraphCanvas nodes={nodes} highlight={beforeHi} dimOthers compact />
        </div>
        <div className="card">
          <div className="k">After · {action === "upgrade" ? sim.after.exposure : sim.after.exposure}</div>
          <div className="metric" style={{ marginTop: 12 }}>
            <span>Production services</span>
            <strong className="tabular">{action === "upgrade" ? sim.after.counts.prodServices : sim.after.counts.prodServices}</strong>
          </div>
          <GraphCanvas
            nodes={nodes}
            highlight={action === "upgrade" ? afterHi : beforeHi}
            dimOthers
            compact
          />
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="k">Exposure</div>
        <p>
          {sim.before.exposure.toUpperCase()} → {action === "upgrade" ? sim.after.exposure.toUpperCase() : sim.before.exposure.toUpperCase()}
        </p>
        <p className="sub">
          {action === "upgrade"
            ? "http-client@3.1.0 on Analytics may still carry the library in Development."
            : "This demo computes the payments-lib 5.2.0 → 5.2.1 upgrade. Other actions share the same graph engine."}
        </p>
      </div>
    </div>
  );
}
