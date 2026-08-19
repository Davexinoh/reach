import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function RepoSelect({ go }) {
  const [repos, setRepos] = useState([]);
  const [picked, setPicked] = useState(() => new Set());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    api
      .githubRepos()
      .then((d) => setRepos(d.repos || []))
      .catch((e) => {
        if (e.status === 401) go("/enter");
        else setErr(e.message);
      });
  }, [go]);

  function toggle(name) {
    const next = new Set(picked);
    if (next.has(name)) next.delete(name);
    else if (next.size < 8) next.add(name);
    setPicked(next);
  }

  async function build() {
    if (!picked.size) {
      setErr("Select at least one repository.");
      return;
    }
    setBusy(true);
    setErr("");
    setProgress("Fetching lockfiles and querying OSV…");
    try {
      const r = await api.connect([...picked], true);
      setProgress(
        `${r.stats?.packages || 0} packages · ${r.vulns || 0} vulns · ${r.stats?.relationships || 0} edges`
      );
      go("/app/map");
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="onboard" style={{ maxWidth: 640 }}>
      <div className="brand">REACH</div>
      <h1>Select repositories</h1>
      <p className="sub">Up to 8. Reach reads package-lock.json, package.json, or requirements.txt, then asks OSV for known vulns.</p>
      {err && <p className="sub" style={{ color: "var(--critical)" }}>{err}</p>}
      {busy && <p className="sub">{progress}</p>}
      <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        {repos.map((r) => (
          <label key={r.full_name} className="choice" style={{ display: "flex", gap: 10, alignItems: "center", margin: 0, borderRadius: 0 }}>
            <input
              type="checkbox"
              checked={picked.has(r.full_name)}
              onChange={() => toggle(r.full_name)}
              disabled={busy}
            />
            <span>
              {r.full_name}
              <div className="k">{r.language || "—"} · {r.private ? "private" : "public"}</div>
            </span>
          </label>
        ))}
      </div>
      <button className="btn primary" style={{ marginTop: 16 }} onClick={build} disabled={busy}>
        {busy ? "Building graph…" : `Build graph · ${picked.size} selected`}
      </button>
    </div>
  );
}
