import { useState } from "react";
import { api } from "../api.js";

const STEPS = [
  "Repositories discovered",
  "Packages discovered",
  "Versions resolved",
  "Relationships mapped",
  "Vulnerabilities checked",
  "Production paths analyzed",
];

export default function Onboarding({ go }) {
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(0);
  const [hydra, setHydra] = useState(null);
  const [blocked, setBlocked] = useState(null);

  function startDemo() {
    setBlocked(null);
    setPhase(1);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setDone(i);
      if (i >= STEPS.length) {
        clearInterval(t);
        api
          .ingest()
          .then(() => setHydra(true))
          .catch(() => setHydra(false))
          .finally(() => setTimeout(() => setPhase(2), 350));
      }
    }, 320);
  }

  if (phase === 0) {
    return (
      <div className="onboard">
        <div className="brand">REACH</div>
        <h1>Connect your software graph</h1>
        <p className="sub">This build ships a seeded Harborline graph. GitHub OAuth is not implemented.</p>
        <button className="choice" onClick={() => setBlocked("github")}>
          Sign in with GitHub
          <div className="k">Not wired in this submission</div>
        </button>
        <button className="choice" onClick={() => setBlocked("upload")}>
          Upload lockfile
          <div className="k">Not wired in this submission</div>
        </button>
        <button className="choice" onClick={startDemo}>
          Explore demo graph
          <div className="k">Harborline seed · works without GitHub</div>
        </button>
        {blocked && (
          <p className="sub">
            {blocked === "github"
              ? "GitHub login is not connected. Same graph for every visitor because there is no OAuth. Use Explore demo graph."
              : "Lockfile upload is not connected. Use Explore demo graph."}
          </p>
        )}
        <button className="btn primary" style={{ marginTop: 16 }} onClick={startDemo}>
          Explore demo graph
        </button>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="onboard">
        <h1>Building graph</h1>
        <p className="sub">Loading the Harborline demo seed.</p>
        <ul className="progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i < done ? "done" : ""}>
              {i < done ? "✓" : "→"} {s}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="onboard">
      <h1>Your graph is ready.</h1>
      <p className="sub">
        Harborline demo · {hydra === true ? "also written to HydraDB" : "Reach engine (HydraDB node not running)"}
      </p>
      <button className="btn primary" onClick={() => go("/app/map")}>Explore Reach</button>
    </div>
  );
}
