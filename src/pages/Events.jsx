import { events } from "../data/engine";

export default function Events({ go }) {
  const list = events();
  return (
    <div className="page">
      <h1>Reach events</h1>
      <p className="sub">Vulnerabilities with computed reach, not a CVE inbox.</p>
      <div className="metrics">
        <div className="metric"><span>Open events</span><strong className="tabular">{list.length}</strong></div>
        <div className="metric"><span>Production services</span><strong className="tabular">{list[0].counts.prodServices}</strong></div>
        <div className="metric"><span>Applications</span><strong className="tabular">{list[0].counts.apps}</strong></div>
        <div className="metric"><span>Paths</span><strong className="tabular">{list[0].counts.paths}</strong></div>
      </div>
      {list.map((e) => (
        <button key={e.id} className="choice" onClick={() => go("/app/events/cve-2026-4418")} style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div className="badge critical">Critical</div>
              <h3 style={{ margin: "8px 0 4px" }}>{e.name}</h3>
              <div className="k">{e.cve} · CVSS {e.cvss}</div>
            </div>
            <div className="tabular" style={{ color: "var(--muted)" }}>
              {e.counts.apps} apps · {e.counts.prodServices} production · {e.counts.paths} paths
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
