import { parsePackageJson, parsePackageLock, parseRequirements } from "./lockfile.mjs";
import { githubFile } from "./github.mjs";
import { queryOsv } from "./osv.mjs";

const CAP = 500;

export async function buildWorkspaceGraph(token, repoNames, { production = true } = {}) {
  const nodes = [];
  const edges = [];
  const errors = [];
  const allVersions = [];
  const add = (n) => {
    if (!nodes.some((x) => x.id === n.id)) nodes.push(n);
  };
  const edge = (a, b, rel) => {
    if (!edges.some((e) => e[0] === a && e[1] === b && e[2] === rel)) edges.push([a, b, rel]);
  };

  for (const full of repoNames.slice(0, 8)) {
    const repoId = `repo:${full}`;
    const appId = `app:${full}`;
    const svcId = `svc:${full}`;
    const envId = production ? `env:prod:${full}` : `env:unmapped:${full}`;
    add({ id: repoId, kind: "repo", name: full });
    add({ id: appId, kind: "app", name: full.split("/")[1] || full });
    add({ id: svcId, kind: "service", name: full.split("/")[1] || full, criticality: production ? "high" : "low" });
    add({ id: envId, kind: "env", name: production ? "Production" : "Unmapped", production: !!production });
    edge(repoId, appId, "contains");
    edge(svcId, appId, "runs");
    edge(svcId, envId, "deployed_to");

    let parsed = null;
    try {
      const lock = await githubFile(token, full, "package-lock.json");
      if (lock) parsed = parsePackageLock(lock, full);
      if (!parsed) {
        const req = await githubFile(token, full, "requirements.txt");
        if (req) parsed = parseRequirements(req, full);
      }
      if (!parsed) {
        const pkg = await githubFile(token, full, "package.json");
        if (pkg) parsed = parsePackageJson(pkg, full);
      }
    } catch (err) {
      errors.push({ repo: full, message: String(err.message || err) });
      continue;
    }
    if (!parsed) {
      errors.push({
        repo: full,
        message: "No package-lock.json, package.json, or requirements.txt at repo root.",
      });
      continue;
    }
    if (parsed.unresolved) {
      errors.push({
        repo: full,
        message: "Lockfile missing — used direct dependencies only. Transitive reach is incomplete.",
      });
    }

    const slice = parsed.versions.slice(0, CAP);
    for (const v of slice) {
      const pkgId = `pkg:${v.name}`;
      const verId = `ver:${v.name}@${v.version}`;
      add({ id: pkgId, kind: "package", name: v.name });
      add({ id: verId, kind: "version", name: v.name, version: v.version, package: v.name });
      edge(pkgId, verId, "has_version");
      allVersions.push(v);
    }
    for (const [from, to] of parsed.deps) {
      if (nodes.some((n) => n.id === from) && nodes.some((n) => n.id === to)) edge(from, to, "depends_on");
    }
    for (const verId of parsed.direct) {
      if (nodes.some((n) => n.id === verId)) edge(appId, verId, "uses");
    }
  }

  let vulns = [];
  try {
    vulns = await queryOsv(allVersions.slice(0, 400));
  } catch (err) {
    errors.push({ repo: "*", message: `OSV lookup failed: ${err.message}` });
  }
  for (const v of vulns) {
    add(v);
    if (v.versionId) edge(v.id, v.versionId, "affects");
  }

  return { nodes, edges, errors, stats: { repos: repoNames.length, packages: nodes.filter((n) => n.kind === "package").length, vulns: vulns.length, relationships: edges.length } };
}
