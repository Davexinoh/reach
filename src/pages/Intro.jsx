import { useEffect } from "react";

export default function Intro({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="intro">
      <svg viewBox="0 0 280 160" aria-hidden>
        <circle cx="40" cy="80" r="4" fill="#ececee">
          <animate attributeName="r" values="1;4" dur="0.4s" fill="freeze" />
        </circle>
        <circle cx="110" cy="50" r="4" fill="#ececee">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.3s" fill="freeze" />
        </circle>
        <circle cx="180" cy="90" r="4" fill="#ececee">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.55s" fill="freeze" />
        </circle>
        <circle cx="240" cy="60" r="4" fill="#e5484d">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.9s" fill="freeze" />
        </circle>
        <line x1="40" y1="80" x2="110" y2="50" stroke="#3a3a42" strokeWidth="1">
          <animate attributeName="opacity" from="0" to="1" begin="0.35s" fill="freeze" />
        </line>
        <line x1="110" y1="50" x2="180" y2="90" stroke="#3a3a42" strokeWidth="1">
          <animate attributeName="opacity" from="0" to="1" begin="0.6s" fill="freeze" />
        </line>
        <line x1="180" y1="90" x2="240" y2="60" stroke="#e5484d" strokeWidth="1">
          <animate attributeName="opacity" from="0" to="1" begin="1s" fill="freeze" />
        </line>
        <text x="40" y="140" fill="#8b8b92" fontSize="11" letterSpacing="0.2em">REACH</text>
      </svg>
      <button className="skip" onClick={onDone}>Skip</button>
    </div>
  );
}
