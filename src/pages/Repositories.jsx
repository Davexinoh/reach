import { repoStats } from "../data/engine";

export default function Repositories({ go }) {
  const rows = repoStats();
  return (
    <div className="page">
      <h1>Repositories</h1>
      <p className="sub">Lockfiles mapped into the graph. Exposure is computed from production reach.</p>
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
