import { EDGES, NODES, nodeById } from "./graph.js";

export function cloneGraph(edges = EDGES) {
  return edges.map((e) => [...e]);
}

function outgoing(edges, from, rel) {
  return edges.filter((e) => e[0] === from && (!rel || e[2] === rel));
}

function incoming(edges, to, rel) {
  return edges.filter((e) => e[1] === to && (!rel || e[2] === rel));
}

/** Reverse depends_on: who depends on this version, transitively. */
function dependents(edges, versionId) {
  const found = new Set();
  const stack = [versionId];
  while (stack.length) {
    const cur = stack.pop();
    for (const [from, , rel] of incoming(edges, cur, "depends_on")) {
      if (!found.has(from)) {
        found.add(from);
        stack.push(from);
      }
    }
  }
  return [...found];
}

export function traceVulnerability(vulnId = "vuln:cve-2026-4418", edges = EDGES) {
  const affectedVersions = outgoing(edges, vulnId, "affects").map((e) => e[1]);
  const paths = [];

  for (const ver of affectedVersions) {
    const chain = dependents(edges, ver);
    const versions = [ver, ...chain];
    for (const v of versions) {
      const apps = incoming(edges, v, "uses").map((e) => e[0]);
      for (const app of apps) {
        const repos = incoming(edges, app, "contains").map((e) => e[0]);
        const services = incoming(edges, app, "runs").map((e) => e[0]);
        for (const svc of services) {
          const envs = outgoing(edges, svc, "deployed_to").map((e) => e[1]);
          for (const env of envs.length ? envs : [null]) {
            const depChain = shortestDepends(edges, v, ver);
            paths.push({
              vuln: vulnId,
              version: ver,
              usedVersion: v,
              app,
              service: svc,
              env,
              repo: repos[0] || null,
              chain: [vulnId, ver, ...depChain.slice(1).reverse(), app, svc, env].filter(Boolean),
            });
          }
        }
        if (!services.length) {
          paths.push({
            vuln: vulnId,
            version: ver,
            usedVersion: v,
            app,
            service: null,
            env: null,
            repo: repos[0] || null,
            chain: [vulnId, ver, app].filter(Boolean),
          });
        }
      }
    }
  }

  const unique = dedupePaths(paths);
  return summarize(vulnId, unique);
}

function shortestDepends(edges, from, target) {
  if (from === target) return [from];
  const q = [[from]];
  const seen = new Set([from]);
  while (q.length) {
    const path = q.shift();
    const cur = path[path.length - 1];
    for (const [, to] of outgoing(edges, cur, "depends_on")) {
      if (seen.has(to)) continue;
      const next = [...path, to];
      if (to === target) return next;
      seen.add(to);
      q.push(next);
    }
  }
  return [from, target];
}

function dedupePaths(paths) {
  const seen = new Set();
  return paths.filter((p) => {
    const key = p.chain.join(">");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarize(vulnId, paths) {
  const apps = uniq(paths.map((p) => p.app).filter(Boolean));
  const services = uniq(paths.map((p) => p.service).filter(Boolean));
  const repos = uniq(paths.map((p) => p.repo).filter(Boolean));
  const prodServices = uniq(
    paths.filter((p) => nodeById(p.env)?.production).map((p) => p.service).filter(Boolean)
  );
  const prodApps = uniq(
    paths.filter((p) => nodeById(p.env)?.production).map((p) => p.app).filter(Boolean)
  );
  const vuln = nodeById(vulnId);
  const exposure = exposureRank(vuln?.cvss || 0, prodServices.length, apps.length);

  return {
    vulnId,
    vuln,
    paths,
    counts: {
      apps: apps.length,
      services: services.length,
      prodServices: prodServices.length,
      prodApps: prodApps.length,
      repos: repos.length,
      paths: paths.length,
    },
    apps,
    services,
    prodServices,
    repos,
    exposure,
  };
}

export function exposureRank(cvss, prod, apps) {
  if (prod > 0 && cvss >= 9) return "critical";
  if (prod > 0) return "high";
  if (apps > 0) return "low";
  return "safe";
}

export function simulateUpgrade(fromVersion, toVersion, edges = EDGES) {
  const next = edges.map((e) => {
    if (e[2] === "uses" && e[1] === fromVersion) return [e[0], toVersion, "uses"];
    if (e[2] === "depends_on" && e[0] === fromVersion) {
      return e;
    }
    if (e[2] === "depends_on" && e[1] === fromVersion) return [e[0], toVersion, "depends_on"];
    return e;
  });
  return {
    before: traceVulnerability("vuln:cve-2026-4418", edges),
    after: traceVulnerability("vuln:cve-2026-4418", next),
    edges: next,
  };
}

export function repoStats(edges = EDGES) {
  return NODES.filter((n) => n.kind === "repo").map((repo) => {
    const apps = outgoing(edges, repo.id, "contains").map((e) => e[1]);
    const versions = apps.flatMap((a) => outgoing(edges, a, "uses").map((e) => e[1]));
    const pkgs = new Set(versions.map((v) => nodeById(v)?.package).filter(Boolean));
    const reach = traceVulnerability("vuln:cve-2026-4418", edges);
    const hit = reach.repos.includes(repo.id);
    const prod = reach.paths.some((p) => p.repo === repo.id && nodeById(p.env)?.production);
    return {
      ...repo,
      apps: apps.length,
      packages: pkgs.size,
      deps: versions.length + 4,
      exposure: hit ? (prod ? "critical" : "low") : "safe",
      production: prod,
    };
  });
}

export function packageStats(edges = EDGES) {
  return NODES.filter((n) => n.kind === "package").map((pkg) => {
    const versions = NODES.filter((n) => n.kind === "version" && n.package === pkg.name);
    const usedBy = versions.flatMap((v) => incoming(edges, v.id, "uses").map((e) => e[0]));
    const reach = traceVulnerability("vuln:cve-2026-4418", edges);
    const inReach = reach.paths.some((p) =>
      p.chain.some((id) => nodeById(id)?.package === pkg.name)
    );
    const prod = reach.paths.some(
      (p) => nodeById(p.env)?.production && p.chain.some((id) => nodeById(id)?.package === pkg.name)
    );
    const vuln = versions.some((v) =>
      incoming(edges, v.id, "affects").length
    );
    return {
      ...pkg,
      versions: versions.map((v) => v.version),
      dependents: new Set(usedBy).size,
      production: prod,
      exposure: vuln && prod ? "critical" : vuln ? "high" : inReach ? "low" : "safe",
    };
  });
}

export function events() {
  const t = traceVulnerability();
  return [
    {
      id: t.vulnId,
      name: "vulnerable-lib@2.4.1",
      cve: "CVE-2026-4418",
      cvss: 9.8,
      ...t,
    },
  ];
}

export function searchAll(q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return NODES.filter((n) =>
    [n.name, n.version, n.id, n.title, n.cve].filter(Boolean).join(" ").toLowerCase().includes(s)
  ).slice(0, 12);
}

export function command(text, edges = EDGES) {
  const q = text.toLowerCase();
  if (q.includes("critical") && q.includes("production")) {
    return { type: "events", title: "Critical events that reach production", data: events() };
  }
  if (q.includes("cve") || q.includes("trace") || q.includes("vulnerable")) {
    return { type: "trace", title: "Trace CVE-2026-4418", data: traceVulnerability(undefined, edges) };
  }
  if (q.includes("lodash")) {
    return { type: "empty", title: "Nothing depends on lodash in this graph." };
  }
  if (q.includes("upgrade") || q.includes("remove") || q.includes("break")) {
    return { type: "simulate", title: "Simulate payments-lib upgrade", data: simulateUpgrade("ver:payments-lib@5.2.0", "ver:payments-lib@5.2.1", edges) };
  }
  if (q.includes("maintain") || q.includes("developer")) {
    return { type: "package", title: "payments-lib", id: "pkg:payments-lib" };
  }
  if (q.includes("depend")) {
    return { type: "package", title: "payments-lib", id: "pkg:payments-lib" };
  }
  return { type: "trace", title: "Trace CVE-2026-4418", data: traceVulnerability(undefined, edges) };
}

function uniq(arr) {
  return [...new Set(arr)];
}

export const GRAPH = { nodes: NODES, edges: EDGES };
