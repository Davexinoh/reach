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

function lookupIn(nodes, id) {
  return nodes.find((n) => n.id === id);
}

export function traceVulnerability(vulnId = "vuln:cve-2026-4418", edges = EDGES, nodes = NODES) {
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
  return summarize(vulnId, unique, nodes);
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

function summarize(vulnId, paths, nodes = NODES) {
  const apps = uniq(paths.map((p) => p.app).filter(Boolean));
  const services = uniq(paths.map((p) => p.service).filter(Boolean));
  const repos = uniq(paths.map((p) => p.repo).filter(Boolean));
  const prodServices = uniq(
    paths.filter((p) => lookupIn(nodes, p.env)?.production).map((p) => p.service).filter(Boolean)
  );
  const prodApps = uniq(
    paths.filter((p) => lookupIn(nodes, p.env)?.production).map((p) => p.app).filter(Boolean)
  );
  const vuln = lookupIn(nodes, vulnId);
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

export function simulateUpgrade(fromVersion, toVersion, edges = EDGES, nodes = NODES) {
  const hasTo = nodes.some((n) => n.id === toVersion);
  const next = edges
    .map((e) => {
      if (e[2] === "uses" && e[1] === fromVersion) {
        return hasTo ? [e[0], toVersion, "uses"] : null;
      }
      if (e[2] === "depends_on" && e[1] === fromVersion) {
        return hasTo ? [e[0], toVersion, "depends_on"] : e;
      }
      return e;
    })
    .filter(Boolean);
  const vulns = nodes.filter((n) => n.kind === "vuln");
  const vulnId = vulns[0]?.id;
  return {
    before: vulnId ? traceVulnerability(vulnId, edges, nodes) : emptyTrace(),
    after: vulnId ? traceVulnerability(vulnId, next, nodes) : emptyTrace(),
    edges: next,
  };
}

function emptyTrace() {
  return {
    vulnId: null,
    vuln: null,
    paths: [],
    counts: { apps: 0, services: 0, prodServices: 0, prodApps: 0, repos: 0, paths: 0 },
    apps: [],
    services: [],
    prodServices: [],
    repos: [],
    exposure: "safe",
  };
}

export function repoStats(nodes = NODES, edges = EDGES) {
  const vulns = nodes.filter((n) => n.kind === "vuln");
  return nodes.filter((n) => n.kind === "repo").map((repo) => {
    const apps = outgoing(edges, repo.id, "contains").map((e) => e[1]);
    const versions = apps.flatMap((a) => outgoing(edges, a, "uses").map((e) => e[1]));
    const pkgs = new Set(versions.map((v) => lookupIn(nodes, v)?.package).filter(Boolean));
    let exposure = "safe";
    let production = false;
    for (const v of vulns) {
      const reach = traceVulnerability(v.id, edges, nodes);
      if (reach.repos.includes(repo.id)) {
        const prod = reach.paths.some((p) => p.repo === repo.id && lookupIn(nodes, p.env)?.production);
        production = production || prod;
        exposure = prod ? (v.cvss >= 9 ? "critical" : "high") : "low";
      }
    }
    return {
      ...repo,
      apps: apps.length,
      packages: pkgs.size,
      deps: versions.length,
      exposure,
      production,
    };
  });
}

export function packageStats(nodes = NODES, edges = EDGES) {
  const vulns = nodes.filter((n) => n.kind === "vuln");
  return nodes.filter((n) => n.kind === "package").map((pkg) => {
    const versions = nodes.filter((n) => n.kind === "version" && n.package === pkg.name);
    const usedBy = versions.flatMap((v) => incoming(edges, v.id, "uses").map((e) => e[0]));
    let exposure = "safe";
    let production = false;
    const vulnHere = versions.some((v) => incoming(edges, v.id, "affects").length);
    for (const v of vulns) {
      const reach = traceVulnerability(v.id, edges, nodes);
      const inReach = reach.paths.some((p) =>
        p.chain.some((id) => lookupIn(nodes, id)?.package === pkg.name)
      );
      const prod = reach.paths.some(
        (p) => lookupIn(nodes, p.env)?.production && p.chain.some((id) => lookupIn(nodes, id)?.package === pkg.name)
      );
      if (prod) production = true;
      if (vulnHere && prod) exposure = "critical";
      else if (vulnHere) exposure = exposure === "safe" ? "high" : exposure;
      else if (inReach && exposure === "safe") exposure = "low";
    }
    return {
      ...pkg,
      versions: versions.map((v) => v.version),
      dependents: new Set(usedBy).size,
      production,
      exposure,
    };
  });
}

export function events(nodes = NODES, edges = EDGES) {
  return nodes
    .filter((n) => n.kind === "vuln")
    .map((v) => ({
      id: v.id,
      name: v.affected || v.name,
      cve: v.cve || v.name,
      cvss: v.cvss || 0,
      ...traceVulnerability(v.id, edges, nodes),
    }));
}

export function searchAll(q, nodes = NODES) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return nodes
    .filter((n) =>
      [n.name, n.version, n.id, n.title, n.cve].filter(Boolean).join(" ").toLowerCase().includes(s)
    )
    .slice(0, 12);
}

export function command(text, edges = EDGES, nodes = NODES) {
  const q = text.toLowerCase();
  const ev = events(nodes, edges);
  const first = ev[0];
  if (q.includes("critical") && q.includes("production")) {
    return { type: "events", title: "Critical events that reach production", data: ev };
  }
  if (q.includes("cve") || q.includes("trace") || q.includes("vulnerable")) {
    return { type: "trace", title: first ? `Trace ${first.cve}` : "No reach events", data: first || emptyTrace() };
  }
  if (q.includes("upgrade") || q.includes("remove") || q.includes("break")) {
    const from = nodes.find((n) => n.kind === "version" && incoming(edges, n.id, "affects").length);
    const alt = from && nodes.find((n) => n.kind === "version" && n.package === from.package && n.id !== from.id);
    return {
      type: "simulate",
      title: "Simulate change",
      data: from ? simulateUpgrade(from.id, alt?.id || from.id, edges, nodes) : null,
    };
  }
  if (q.includes("depend") || q.includes("maintain")) {
    const pkg = nodes.find((n) => n.kind === "package");
    return { type: "package", title: pkg?.name || "packages", id: pkg?.id };
  }
  return { type: first ? "trace" : "events", title: first ? `Trace ${first.cve}` : "No reach events", data: first || ev };
}

function uniq(arr) {
  return [...new Set(arr)];
}

export const GRAPH = { nodes: NODES, edges: EDGES };
