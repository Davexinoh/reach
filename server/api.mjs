import crypto from "node:crypto";
import { command, events, packageStats, repoStats, simulateUpgrade, traceVulnerability } from "../src/data/engine.js";
import { EDGES, NODES } from "../src/data/graph.js";
import { hydraBase, hydraReady, hydraStats, ingestGraph, reverseReach } from "./hydra.mjs";
import { createSession, destroySession, getSession, publicUrl, saveSession } from "./session.mjs";
import { exchangeCode, githubRepos, githubUser } from "./github.mjs";
import { buildWorkspaceGraph } from "./build-graph.mjs";

const pending = new Map();

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}

function readJson(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => {
      d += c;
    });
    req.on("end", () => {
      try {
        resolve(d ? JSON.parse(d) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function parseUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "/", `http://${host}`);
}

function graphOf(session) {
  if (session?.graph) return session.graph;
  return null;
}

function ctx(session) {
  if (session?.graph) return session.graph;
  if (session?.demo) return { nodes: NODES, edges: EDGES, source: "demo", errors: [] };
  return { nodes: [], edges: [], source: null, errors: [] };
}

export function reachApi() {
  return async (req, res, next) => {
    const u = parseUrl(req);
    const path = u.pathname;
    if (!path.startsWith("/api")) return next();
    const session = getSession(req);
    const origin = publicUrl(req);

    try {
      if (req.method === "GET" && path === "/api/health") {
        const hydra = await hydraReady();
        let hydraNodes = null;
        if (hydra) {
          try {
            hydraNodes = (await hydraStats()).nodes;
          } catch {
            hydraNodes = null;
          }
        }
        return send(res, 200, {
          ok: true,
          hydra,
          hydraUrl: hydraBase(),
          hydraNodes,
          ingested: Boolean(session?.graph?.hydra || session?.demo && hydra),
          engine: "reach",
          githubConfigured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
          user: session?.user || null,
          graph: session?.graph ? "github" : session?.demo ? "demo" : null,
        });
      }

      if (req.method === "GET" && path === "/api/me") {
        if (!session?.user) return send(res, 200, { user: null, githubConfigured: Boolean(process.env.GITHUB_CLIENT_ID) });
        return send(res, 200, { user: session.user, repos: session.selectedRepos || [], graph: Boolean(session.graph || session.demo) });
      }

      if (req.method === "POST" && path === "/api/logout") {
        destroySession(req, res);
        return send(res, 200, { ok: true });
      }

      if (req.method === "GET" && path === "/api/auth/github") {
        const id = process.env.GITHUB_CLIENT_ID;
        if (!id || !process.env.GITHUB_CLIENT_SECRET) {
          return send(res, 503, {
            error: "GITHUB_NOT_CONFIGURED",
            message: "Create a GitHub OAuth App and set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
            callback: `${origin}/api/auth/github/callback`,
          });
        }
        const state = crypto.randomBytes(12).toString("hex");
        pending.set(state, Date.now());
        const redirectUri = `${origin}/api/auth/github/callback`;
        const url =
          "https://github.com/login/oauth/authorize" +
          `?client_id=${encodeURIComponent(id)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&scope=${encodeURIComponent("read:user repo")}` +
          `&state=${state}`;
        return redirect(res, url);
      }

      if (req.method === "GET" && path === "/api/auth/github/callback") {
        const code = u.searchParams.get("code");
        const state = u.searchParams.get("state");
        if (!code || !state || !pending.has(state)) {
          return redirect(res, "/enter?error=oauth");
        }
        pending.delete(state);
        const redirectUri = `${origin}/api/auth/github/callback`;
        const token = await exchangeCode(code, redirectUri);
        const profile = await githubUser(token);
        const user = { login: profile.login, name: profile.name, avatar: profile.avatar_url, html: profile.html_url };
        createSession(res, { user, token, graph: null, demo: false }, { secure: origin.startsWith("https") });
        return redirect(res, "/enter/repos");
      }

      if (req.method === "GET" && path === "/api/github/repos") {
        if (!session?.token) return send(res, 401, { error: "AUTH_REQUIRED", message: "Sign in with GitHub first." });
        const repos = await githubRepos(session.token);
        return send(res, 200, { repos });
      }

      if (req.method === "POST" && path === "/api/github/connect") {
        if (!session?.token) return send(res, 401, { error: "AUTH_REQUIRED" });
        const body = await readJson(req);
        const names = (body.repos || []).slice(0, 8);
        if (!names.length) return send(res, 400, { error: "NO_REPOS", message: "Select at least one repository." });
        const graph = await buildWorkspaceGraph(session.token, names, { production: body.production !== false });
        session.graph = graph;
        session.demo = false;
        session.selectedRepos = names;
        saveSession(session);
        if (await hydraReady()) {
          try {
            graph.hydra = await ingestGraph(graph.nodes, graph.edges);
          } catch (err) {
            graph.errors.push({ repo: "*", message: `HydraDB ingest: ${err.message}` });
          }
        }
        return send(res, 200, {
          ok: true,
          stats: graph.stats,
          errors: graph.errors,
          vulns: graph.nodes.filter((n) => n.kind === "vuln").length,
        });
      }

      if (req.method === "POST" && path === "/api/demo") {
        const s =
          session ||
          createSession(res, { user: null, token: null }, { secure: origin.startsWith("https") });
        s.graph = { nodes: NODES, edges: EDGES, errors: [], stats: { source: "harborline" } };
        s.demo = true;
        saveSession(s);
        return send(res, 200, { ok: true, source: "demo" });
      }

      const g = ctx(session);
      const usingDemo = !session?.graph;

      if (req.method === "GET" && path === "/api/graph") {
        if (!session?.graph && !session?.demo) {
          return send(res, 200, { nodes: [], edges: [], empty: true, source: null });
        }
        return send(res, 200, {
          nodes: g.nodes,
          edges: g.edges,
          errors: g.errors || [],
          stats: g.stats || {},
          source: session?.graph && !session?.demo ? "github" : "demo",
        });
      }

      if (req.method === "GET" && path === "/api/trace") {
        const vulns = g.nodes.filter((n) => n.kind === "vuln");
        const id = u.searchParams.get("vuln") || vulns[0]?.id;
        if (!id) return send(res, 200, { empty: true, paths: [], counts: { paths: 0, apps: 0, repos: 0, prodServices: 0 } });
        const local = traceVulnerability(id, g.edges, g.nodes);
        if (await hydraReady()) {
          try {
            local.hydra = await reverseReach(id);
          } catch (err) {
            local.hydra = { source: "hydradb", error: err.message };
          }
        }
        return send(res, 200, local);
      }

      if (req.method === "GET" && path === "/api/events") {
        return send(res, 200, { events: events(g.nodes, g.edges), source: usingDemo && !session?.demo ? "none" : session?.demo ? "demo" : "github" });
      }

      if (req.method === "GET" && path === "/api/repos") {
        return send(res, 200, { repos: repoStats(g.nodes, g.edges) });
      }

      if (req.method === "GET" && path === "/api/packages") {
        return send(res, 200, { packages: packageStats(g.nodes, g.edges) });
      }

      if (req.method === "POST" && path === "/api/simulate") {
        const body = await readJson(req);
        const from = body.from || g.nodes.find((n) => n.kind === "version" && g.edges.some((e) => e[2] === "affects" && e[1] === n.id))?.id;
        const alt = from && g.nodes.find((n) => n.kind === "version" && n.package === g.nodes.find((x) => x.id === from)?.package && n.id !== from);
        if (!from) return send(res, 200, { empty: true });
        return send(res, 200, simulateUpgrade(from, body.to || alt?.id || from, g.edges, g.nodes));
      }

      if (req.method === "POST" && path === "/api/command") {
        const body = await readJson(req);
        return send(res, 200, command(body.q || "", g.edges, g.nodes));
      }

      if (req.method === "POST" && path === "/api/ingest") {
        const up = await hydraReady();
        if (!up) {
          return send(res, 503, {
            error: "HYDRADB_UNAVAILABLE",
            message: "HydraDB node is not reachable at HYDRA_URL.",
          });
        }
        const result = await ingestGraph(g.nodes, g.edges);
        if (session?.graph) {
          session.graph.hydra = result;
          saveSession(session);
        }
        return send(res, 200, result);
      }

      send(res, 404, { error: "NOT_FOUND", message: `No Reach API at ${path}` });
    } catch (err) {
      send(res, 500, {
        error: "REACH_ENGINE",
        message: String(err.message || err),
      });
    }
  };
}
