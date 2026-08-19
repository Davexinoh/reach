import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setHealth({ ok: false, message: e.message }));
  }, []);

  async function ingest() {
    setMsg("Ingesting…");
    try {
      const r = await api.ingest();
      setMsg(`Wrote ${r.statements} relationships. Bookmark ${r.bookmark || "n/a"}.`);
      const h = await api.health();
      setHealth(h);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="sub">Workspace is the Harborline demo. HydraDB stays on the server.</p>
      <div className="card">
        <h3>GitHub</h3>
        <p className="sub">Not connected. Use Explore demo graph from onboarding.</p>
        <button className="btn" disabled>
          Sign in with GitHub
        </button>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>HydraDB</h3>
        <p className="sub">
          {health?.hydra
            ? "Node reachable. Ingest writes MAY_BE-style supply-chain edges via OpenCypher."
            : "Node not reachable. Reach still traces the seeded graph in the Reach engine."}
        </p>
        <p className="k">{health ? `store: ${health.store}` : "checking…"}</p>
        <button className="btn" onClick={ingest} style={{ marginTop: 10 }}>
          Ingest demo graph
        </button>
        {msg && <p className="sub">{msg}</p>}
      </div>
    </div>
  );
}
