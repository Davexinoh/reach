import GraphCanvas from "../components/GraphCanvas";

const MINI = [
  "repo:payments-api",
  "app:payments",
  "ver:payments-lib@5.2.0",
  "ver:vulnerable-lib@2.4.1",
  "vuln:cve-2026-4418",
  "svc:payments-api",
  "env:prod-us",
];

export default function Landing({ go }) {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-top">
          <div className="brand">REACH</div>
          <button className="btn ghost" onClick={() => go("/enter")}>Connect GitHub</button>
        </div>
        <h1>Point at anything.<br />Trace its reach.</h1>
        <p>
          Reach maps your software supply chain as a graph, showing exactly how
          vulnerabilities propagate through dependencies, services, applications, and production.
        </p>
        <div className="hero-cta">
          <button className="btn primary" onClick={() => go("/enter")}>Explore the Graph</button>
          <button className="btn" onClick={() => go("/enter")}>Connect GitHub</button>
        </div>
        <div className="mini-graph">
          <GraphCanvas
            nodes={MINI}
            highlight={["vuln:cve-2026-4418", "ver:vulnerable-lib@2.4.1", "ver:payments-lib@5.2.0", "app:payments", "svc:payments-api", "env:prod-us"]}
            dimOthers
          />
          <div style={{ position: "absolute", right: 16, top: 16 }} className="card">
            <span className="badge critical">Critical</span>
            <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 12 }}>vulnerable-lib@2.4.1</div>
            <div className="tabular" style={{ marginTop: 8, color: "var(--muted)" }}>3 applications · 2 production · 11 paths</div>
          </div>
        </div>
      </section>

      <section className="story">
        <h2>A vulnerability is only the beginning.</h2>
        <p>Existing tools stop at the package. Reach asks the question that matters.</p>
        <div className="mono-block">
          package-x@1.4.2 is vulnerable — CVSS 9.8
          <br />
          <span className="hit">What can it reach?</span>
        </div>
      </section>

      <section className="story">
        <h2>Software is a graph. Security should be too.</h2>
        <p>A flat dependency list cannot tell you whether a CVE lands in production. Relationships can.</p>
      </section>

      <section className="story">
        <h2>Trace</h2>
        <div className="mono-block">
          Vulnerability<br />→ Package version<br />→ Internal library<br />→ Service<br />→ Production
        </div>
      </section>

      <section className="story">
        <h2>Don't just find the vulnerability.</h2>
        <p>Find its reach.</p>
        <button className="btn primary" onClick={() => go("/enter")}>Enter Reach</button>
      </section>
    </div>
  );
}
