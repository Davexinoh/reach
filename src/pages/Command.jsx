export default function Command({ onCommand }) {
  return (
    <div className="page">
      <h1>Command</h1>
      <p className="sub">Ask Reach. Results are graph operations, not chat.</p>
      <button className="search-btn" onClick={onCommand} style={{ minWidth: 320 }}>
        What do you want to trace? <span className="k">⌘K</span>
      </button>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="k">Examples</div>
        <p>What critical vulnerabilities can reach production?</p>
        <p>Trace CVE-2026-4418</p>
        <p>What breaks if I upgrade payments-lib?</p>
      </div>
    </div>
  );
}
