import { command, events, packageStats, repoStats, simulateUpgrade, traceVulnerability } from "../src/data/engine.js";
import { EDGES, NODES } from "../src/data/graph.js";
import { hydraReady, ingestGraph, queryDepends } from "./hydra.mjs";

function send(res, code, body) {
  const json = JSON.stringify(body);
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(json);
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

export function reachApi() {
  return async (req, res, next) => {
    const url = req.url?.split("?")[0] || "";
    if (!url.startsWith("/api")) return next();

    try {
      if (req.method === "GET" && url === "/api/health") {
        const hydra = await hydraReady();
        return send(res, 200, {
          ok: true,
          hydra,
          engine: "reach",
          store: hydra ? "hydradb" : "demo-seed",
        });
      }

      if (req.method === "GET" && url === "/api/trace") {
        const t = traceVulnerability();
        return send(res, 200, t);
      }

      if (req.method === "GET" && url === "/api/events") {
        return send(res, 200, { events: events() });
      }

      if (req.method === "GET" && url === "/api/repos") {
        return send(res, 200, { repos: repoStats() });
      }

      if (req.method === "GET" && url === "/api/packages") {
        return send(res, 200, { packages: packageStats() });
      }

      if (req.method === "POST" && url === "/api/simulate") {
        const body = await readJson(req);
        const from = body.from || "ver:payments-lib@5.2.0";
        const to = body.to || "ver:payments-lib@5.2.1";
        return send(res, 200, simulateUpgrade(from, to));
      }

      if (req.method === "POST" && url === "/api/command") {
        const body = await readJson(req);
        return send(res, 200, command(body.q || ""));
      }

      if (req.method === "POST" && url === "/api/ingest") {
        const up = await hydraReady();
        if (!up) {
          return send(res, 503, {
            error: "HYDRADB_UNAVAILABLE",
            message: "HydraDB node is not reachable at HYDRA_URL. Demo graph still traces locally.",
          });
        }
        const result = await ingestGraph(NODES, EDGES);
        return send(res, 200, result);
      }

      if (req.method === "GET" && url === "/api/hydra/depends") {
        const up = await hydraReady();
        if (!up) return send(res, 503, { error: "HYDRADB_UNAVAILABLE" });
        const data = await queryDepends("ver:payments-lib@5.2.0");
        return send(res, 200, data);
      }

      send(res, 404, { error: "NOT_FOUND", message: `No Reach API at ${url}` });
    } catch (err) {
      send(res, 500, {
        error: "REACH_ENGINE",
        message: String(err.message || err),
      });
    }
  };
}
