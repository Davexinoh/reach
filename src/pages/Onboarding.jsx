import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Onboarding({ go }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ githubConfigured: false }));
  }, []);

  function github() {
    if (health && health.githubConfigured === false) return;
    window.location.href = "/api/auth/github";
  }

  return (
    <div className="onboard">
      <div className="brand">REACH</div>
      <h1>Connect your software graph</h1>
      <p className="sub">Sign in with GitHub, pick repositories, Reach reads lockfiles and traces real CVEs from OSV.</p>
      <button className="choice" onClick={github} disabled={health && health.githubConfigured === false}>
        Sign in with GitHub
        <div className="k">
          {health?.githubConfigured === false
            ? "OAuth app not configured on the server"
            : "Read-only access to repos you choose"}
        </div>
      </button>
      <button className="choice" onClick={() => go("/enter/repos")}>
        I already signed in
        <div className="k">Choose repositories</div>
      </button>
      <p className="sub" style={{ marginTop: 24 }}>
        Sample graph is available for UI walkthrough only — it is not your GitHub data.
      </p>
      <button
        className="btn ghost"
        onClick={async () => {
          await api.demo();
          go("/app/map");
        }}
      >
        Load Harborline sample
      </button>
    </div>
  );
}
