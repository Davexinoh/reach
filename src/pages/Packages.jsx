import { packageStats } from "../data/engine";

export default function Packages({ go }) {
  const rows = packageStats();
  return (
    <div className="page">
      <h1>Packages</h1>
      <p className="sub">Inventory with production reach. Click a package to inspect.</p>
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
          {rows.map((r) => (
            <tr key={r.id} onClick={() => go("/app/packages/" + r.name)}>
              <td>{r.name}</td>
              <td className="tabular">{r.versions.join(", ")}</td>
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
