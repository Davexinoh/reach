export default function Settings() {
  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="sub">Integrations for this demo are local. HydraDB ingest is optional.</p>
      <div className="card">
        <h3>GitHub</h3>
        <p className="sub">Not connected. Use the Harborline demo graph.</p>
        <button className="btn">Connect GitHub</button>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>HydraDB</h3>
        <p className="sub">Open-source graph node. Map and trace run locally; ingest writes the same model over HTTP.</p>
        <code className="k">HYDRA_URL=http://127.0.0.1:8443</code>
      </div>
    </div>
  );
}
