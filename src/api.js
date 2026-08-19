/** Browser client. Never talks to HydraDB directly. */

async function req(url, opts) {
  const r = await fetch(url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.message || data.error || r.statusText);
    err.code = data.error;
    err.status = r.status;
    throw err;
  }
  return data;
}

export const api = {
  health: () => req("/api/health"),
  trace: () => req("/api/trace"),
  events: () => req("/api/events"),
  repos: () => req("/api/repos"),
  packages: () => req("/api/packages"),
  simulate: (from, to) =>
    req("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    }),
  command: (q) =>
    req("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q }),
    }),
  ingest: () => req("/api/ingest", { method: "POST" }),
};
