import { useState } from "react";

const STEPS = [
  "12 repositories",
  "642 packages",
  "2,841 dependency relationships",
  "8 applications",
  "5 production environments",
];

export default function Onboarding({ go }) {
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(0);

  function start() {
    setPhase(1);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setDone(i);
      if (i >= STEPS.length) {
        clearInterval(t);
        setTimeout(() => setPhase(2), 400);
      }
    }, 380);
  }

  if (phase === 0) {
    return (
      <div className="onboard">
        <div className="brand">REACH</div>
        <h1>Connect your software graph</h1>
        <p className="sub">Build from GitHub, a lockfile, or the Harborline demo.</p>
        <button className="choice" onClick={start}>GitHub</button>
        <button className="choice" onClick={start}>Upload repository</button>
        <button className="choice" onClick={start}>Demo dataset</button>
        <button className="btn primary" style={{ marginTop: 16 }} onClick={start}>Build my graph</button>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="onboard">
        <h1>Building graph</h1>
        <ul className="progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i < done ? "done" : ""}>
              {i < done ? "✓" : "…"} {s}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="onboard">
      <h1>Your graph is ready.</h1>
      <p className="sub">Harborline · 8 repositories · 1 critical reach event</p>
      <button className="btn primary" onClick={() => go("/app/map")}>Explore Reach</button>
    </div>
  );
}
