import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Events({ go }) {
  const [list, setList] = useState(null);

  useEffect(() => {
    api.events().then((d) => setList(d.events || []));
  }, []);

  if (!list) return <div className="page">Loading events…</div>;
  if (!list.length) {
    return (
      <div className="page">
        <h1>Nothing dangerous is within reach.</h1>
        <p className="sub">OSV found no known vulnerabilities in the versions we resolved — or no graph is loaded.</p>
        <button className="btn" onClick={() => go("/enter")}>Connect GitHub</button>
      </div>
    );
  }

  const top = list[0];
  return (
    <div className="page">
      <h1>Reach events</h1>
      <p className="sub">Vulnerabilities from OSV, with computed reach — not a CVE inbox.</p>
      <div className="metrics">
        <div className="metric"><span>Open events</span><strong className="tabular">{list.length}</strong></div>
        <div className="metric"><span>Production services</span><strong className="tabular">{top.counts?.prodServices || 0}</strong></div>
        <div className="metric"><span>Applications</span><strong className="tabular">{top.counts?.apps || 0}</strong></div>
        <div className="metric"><span>Paths</span><strong className="tabular">{top.counts?.paths || 0}</strong></div>
      </div>
      {list.slice(0, 20).map((e) => (
        <button key={e.id} className="choice" onClick={() => go("/app/events/" + encodeURIComponent(e.id))} style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div className={"badge " + (e.exposure || "low")}>{e.exposure || "event"}</div>
              <h3 style={{ margin: "8px 0 4px" }}>{e.name}</h3>
              <div className="k">{e.cve} · CVSS {e.cvss}</div>
            </div>
            <div className="tabular" style={{ color: "var(--muted)" }}>
              {e.counts?.apps || 0} apps · {e.counts?.prodServices || 0} production · {e.counts?.paths || 0} paths
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
