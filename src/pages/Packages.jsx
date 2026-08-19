import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Packages({ go }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.packages().then((d) => setRows(d.packages || []));
  }, []);
  if (!rows) return <div className="page">Loading packages…</div>;
  if (!rows.length) {
    return (
      <div className="page">
        <h1>No packages mapped</h1>
        <p className="sub">Connect GitHub and build a graph first.</p>
        <button className="btn primary" onClick={() => go("/enter")}>Sign in with GitHub</button>
      </div>
    );
  }
  return (
    <div className="page">
      <h1>Packages</h1>
      <p className="sub">From your lockfiles. Click a package to inspect.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Package</th>
            <th>Versions</th>
            <th>Dependents</th>
            <th>Production reach</th>
            <th>Exposure</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 80).map((r) => (
            <tr key={r.id} onClick={() => go("/app/packages/" + encodeURIComponent(r.name))}>
              <td>{r.name}</td>
              <td className="tabular">{(r.versions || []).slice(0, 3).join(", ")}</td>
              <td className="tabular">{r.dependents}</td>
              <td>{r.production ? "Yes" : "No"}</td>
              <td><span className={"badge " + r.exposure}>{r.exposure}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
