import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Repositories({ go }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.repos().then((d) => setRows(d.repos || []));
  }, []);
  if (!rows) return <div className="page">Loading repositories…</div>;
  if (!rows.length) {
    return (
      <div className="page">
        <h1>Your graph is empty.</h1>
        <p className="sub">Connect a GitHub repository to start tracing.</p>
        <button className="btn primary" onClick={() => go("/enter")}>Sign in with GitHub</button>
      </div>
    );
  }
  return (
    <div className="page">
      <h1>Repositories</h1>
      <p className="sub">Exposure is computed from OSV + reach, not a static list.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Repository</th>
            <th>Packages</th>
            <th>Dependencies</th>
            <th>Production</th>
            <th>Exposure</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => go("/app/map")}>
              <td>{r.name}</td>
              <td className="tabular">{r.packages}</td>
              <td className="tabular">{r.deps}</td>
              <td>{r.production ? "Yes" : "No"}</td>
              <td><span className={"badge " + r.exposure}>{r.exposure}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
