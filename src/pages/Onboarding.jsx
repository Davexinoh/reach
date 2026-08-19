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
  const [note, setNote] = useState("");
  const [hydra, setHydra] = useState(null);

  function start(kind) {
    if (kind === "github") {
      setNote("GitHub OAuth is not configured for this hackathon build. Loading the Harborline demo graph.");
    } else if (kind === "upload") {
      setNote("Lockfile upload uses the same Harborline seed for this demo.");
    } else {
      setNote("");
    }
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
        <p className="sub">Judges: use the demo. GitHub sign-in is stubbed for this event.</p>
        <button className="choice" onClick={() => start("github")}>Sign in with GitHub</button>
        <button className="choice" onClick={() => start("upload")}>Upload repository</button>
        <button className="choice" onClick={() => start("demo")}>Explore demo graph</button>
        <button className="btn primary" style={{ marginTop: 16 }} onClick={() => start("demo")}>
          Build my graph
        </button>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="onboard">
        <h1>Building graph</h1>
        {note && <p className="sub">{note}</p>}
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
        Harborline demo · {hydra === true ? "written to HydraDB" : "local engine (HydraDB node not running)"}
      </p>
      <button className="btn primary" onClick={() => go("/app/map")}>Explore Reach</button>
    </div>
  );
}
