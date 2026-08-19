/** Browser client. Never talks to HydraDB or GitHub with secrets. */

async function req(url, opts = {}) {
  const r = await fetch(url, { credentials: "include", ...opts });
  const ct = r.headers.get("content-type") || "";
  const data = ct.includes("json") ? await r.json().catch(() => ({})) : {};
  if (!r.ok) {
    const err = new Error(data.message || data.error || r.statusText);
    err.code = data.error;
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => req("/api/health"),
  me: () => req("/api/me"),
  logout: () => req("/api/logout", { method: "POST" }),
  githubRepos: () => req("/api/github/repos"),
  connect: (repos, production = true) =>
    req("/api/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repos, production }),
    }),
  demo: () => req("/api/demo", { method: "POST" }),
  graph: () => req("/api/graph"),
  trace: (vuln) => req("/api/trace" + (vuln ? `?vuln=${encodeURIComponent(vuln)}` : "")),
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
