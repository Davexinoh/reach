import { useEffect } from "react";
import Field from "../components/Field";
import GraphCanvas from "../components/GraphCanvas";

const MINI = [
  "vuln:cve-2026-4418",
  "pkg:vulnerable-lib",
  "pkg:payments-lib",
  "pkg:checkout-sdk",
  "app:payments",
  "app:checkout",
  "svc:payments-api",
  "env:prod-us",
];

const HI = [
  "vuln:cve-2026-4418",
  "pkg:vulnerable-lib",
  "pkg:payments-lib",
  "app:payments",
  "svc:payments-api",
  "env:prod-us",
];

export default function Landing({ go }) {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("reveal");
      },
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing">
      <section className="hero" style={{ position: "relative" }}>
        <Field />
        <div className="hero-top" style={{ position: "relative", zIndex: 1 }}>
          <div className="brand">REACH</div>
          <button className="btn ghost" onClick={() => go("/enter")}>Connect GitHub</button>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="reveal">
            <span>Point at anything.</span>
            <span>Trace its reach.</span>
          </h1>
          <p className="reveal d2">
            Reach maps your software supply chain as a graph, showing exactly how
            vulnerabilities propagate through dependencies, services, applications, and production.
          </p>
          <div className="hero-cta reveal d3">
            <button className="btn primary" onClick={() => go("/enter")}>Explore the Graph</button>
            <button className="btn" onClick={() => go("/enter")}>Connect GitHub</button>
          </div>
          <div className="mini-graph reveal d3">
            <GraphCanvas nodes={MINI} highlight={HI} dimOthers compact />
            <div style={{ position: "absolute", right: 16, top: 16, zIndex: 2 }} className="card">
              <span className="badge critical">Critical</span>
              <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 12 }}>vulnerable-lib@2.4.1</div>
              <div className="tabular" style={{ marginTop: 8, color: "var(--muted)" }}>
                3 applications · 2 production
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="story" data-reveal>
        <h2>A vulnerability is only the beginning.</h2>
        <p>Existing tools stop at the package. Reach asks the question that matters.</p>
        <div className="mono-block">
          package-x@1.4.2 is vulnerable — CVSS 9.8
          <br />
          <span className="hit">What can it reach?</span>
        </div>
      </section>

      <section className="story" data-reveal>
        <h2>Software is a graph. Security should be too.</h2>
        <p>A flat list cannot tell you whether a CVE lands in production. The path can.</p>
      </section>

      <section className="story" data-reveal>
        <h2>Trace</h2>
        <div className="story-path">
          <span>Vulnerability</span>
          <span>→ vulnerable-lib</span>
          <span>→ payments-lib</span>
          <span>→ Payments → payments-api</span>
          <span>→ Production-US</span>
        </div>
      </section>

      <section className="story" data-reveal>
        <h2>Don't just find the vulnerability.</h2>
        <p>Find its reach.</p>
        <button className="btn primary" onClick={() => go("/enter")}>Enter Reach</button>
      </section>
    </div>
  );
}
