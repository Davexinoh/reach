import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setHealth({ ok: false, message: e.message }));
    api.me().then(setMe).catch(() => setMe({ user: null }));
  }, []);

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="sub">GitHub is the source of truth. HydraDB is optional durable storage.</p>
      <div className="card">
        <h3>GitHub</h3>
        {me?.user ? (
          <>
            <p className="sub">Signed in as @{me.user.login}</p>
            <button className="btn" onClick={async () => { await api.logout(); window.location.href = "/"; }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="sub">Not connected.</p>
            <button className="btn primary" onClick={() => { window.location.href = "/api/auth/github"; }}>
              Sign in with GitHub
            </button>
          </>
        )}
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>HydraDB</h3>
        <p className="sub">
          {health?.hydra ? "Node reachable." : "Node not running. Graph still lives in the Reach workspace."}
        </p>
        <p className="k">graph: {health?.graph || "none"}</p>
        <button
          className="btn"
          style={{ marginTop: 10 }}
          onClick={async () => {
            setMsg("Ingesting…");
            try {
              const r = await api.ingest();
              setMsg(`Wrote ${r.statements} relationships.`);
            } catch (e) {
              setMsg(e.message);
            }
          }}
        >
          Ingest current graph
        </button>
        {msg && <p className="sub">{msg}</p>}
      </div>
    </div>
  );
}
