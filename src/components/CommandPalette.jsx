import { useEffect, useMemo, useState } from "react";
import { command, searchAll } from "../data/engine";

const SUGGEST = [
  "What critical vulnerabilities can reach production?",
  "Trace CVE-2026-4418",
  "What depends on payments-lib?",
  "What breaks if I upgrade payments-lib?",
  "Find shared vulnerable dependencies",
];

export default function CommandPalette({ open, onClose, onResult }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const results = useMemo(() => {
    if (!q) return SUGGEST.map((s) => ({ type: "suggest", title: s }));
    const hits = searchAll(q).map((n) => ({ type: "node", title: n.name + (n.version ? "@" + n.version : ""), id: n.id, kind: n.kind }));
    return hits.length ? hits : [{ type: "run", title: q }];
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setI((v) => Math.min(v + 1, results.length - 1));
      if (e.key === "ArrowUp") setI((v) => Math.max(v - 1, 0));
      if (e.key === "Enter") run(results[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, i]);

  if (!open) return null;

  function run(item) {
    if (!item) return;
    const text = item.type === "suggest" || item.type === "run" ? item.title : item.title;
    onResult(command(text));
    onClose();
  }

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ask Reach">
        <input autoFocus placeholder="What do you want to trace?" value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} />
        <ul>
          {results.map((r, idx) => (
            <li key={r.title + idx} className={idx === i ? "on" : ""} onMouseEnter={() => setI(idx)} onClick={() => run(r)}>
              {r.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
