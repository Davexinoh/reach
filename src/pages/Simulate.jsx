import { useMemo } from "react";
import { simulateUpgrade } from "../data/engine";

export default function Simulate() {
  const sim = useMemo(
    () => simulateUpgrade("ver:payments-lib@5.2.0", "ver:payments-lib@5.2.1"),
    []
  );
  return (
    <div className="page">
      <h1>Simulate change</h1>
      <p className="sub">What happens if you upgrade payments-lib 5.2.0 → 5.2.1?</p>
      <div className="split">
        <div className="card">
          <div className="k">Before</div>
          <div className="metric" style={{ marginTop: 12 }}>
            <span>Production services</span>
            <strong className="tabular">{sim.before.counts.prodServices}</strong>
          </div>
          <p className="sub">vulnerable-lib@2.4.1 still sits under Payments, Checkout, and Orders.</p>
        </div>
        <div className="card">
          <div className="k">After</div>
          <div className="metric" style={{ marginTop: 12 }}>
            <span>Production services</span>
            <strong className="tabular">{sim.after.counts.prodServices}</strong>
          </div>
          <p className="sub">
            {sim.after.counts.prodServices === 0
              ? "No production path remains on this event."
              : "Some production paths remain via other packages."}
          </p>
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="k">Exposure</div>
        <p>
          {sim.before.exposure.toUpperCase()} → {sim.after.exposure.toUpperCase()}
        </p>
        <p className="sub">http-client@3.1.0 on Analytics may still carry the library in development.</p>
      </div>
    </div>
  );
}
