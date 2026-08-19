/** Parse npm lockfiles and requirements.txt into package version records. */

export function parsePackageLock(json, repoFullName) {
  const lock = typeof json === "string" ? JSON.parse(json) : json;
  const versions = [];
  const deps = []; // [fromVerId, toVerId]
  const direct = [];

  if (lock.packages) {
    const pkgs = lock.packages;
    const idForPath = {};
    for (const [p, meta] of Object.entries(pkgs)) {
      if (!p || p === "") continue;
      const name = packageNameFromPath(p, meta);
      const version = meta.version;
      if (!name || !version) continue;
      const id = `ver:${name}@${version}`;
      idForPath[p] = id;
      versions.push({ name, version, ecosystem: "npm" });
    }
    for (const [p, meta] of Object.entries(pkgs)) {
      if (!p || p === "") continue;
      const from = idForPath[p];
      if (!from || !meta.dependencies) continue;
      const dir = p === "" ? "" : p;
      for (const [depName] of Object.entries(meta.dependencies)) {
        const childPath = dir ? `${dir}/node_modules/${depName}` : `node_modules/${depName}`;
        const alt = `node_modules/${depName}`;
        const to = idForPath[childPath] || idForPath[alt];
        if (to && to !== from) deps.push([from, to]);
      }
    }
    const root = pkgs[""] || {};
    for (const name of Object.keys({ ...root.dependencies, ...root.devDependencies })) {
      const to = idForPath[`node_modules/${name}`];
      if (to) direct.push(to);
    }
  } else if (lock.dependencies) {
    walkV1(lock.dependencies, versions, deps, direct, true);
  }

  return { repo: repoFullName, versions, deps, direct, ecosystem: "npm" };
}

function packageNameFromPath(p, meta) {
  if (meta.name) return meta.name;
  const parts = p.split("node_modules/");
  return parts[parts.length - 1] || null;
}

function walkV1(tree, versions, deps, direct, isRoot, parentId) {
  for (const [name, meta] of Object.entries(tree || {})) {
    if (!meta?.version) continue;
    const id = `ver:${name}@${meta.version}`;
    versions.push({ name, version: meta.version, ecosystem: "npm" });
    if (isRoot) direct.push(id);
    if (parentId) deps.push([parentId, id]);
    if (meta.dependencies) walkV1(meta.dependencies, versions, deps, direct, false, id);
  }
}

export function parsePackageJson(json, repoFullName) {
  const pkg = typeof json === "string" ? JSON.parse(json) : json;
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const versions = names.map((name) => {
    const spec = (pkg.dependencies || {})[name] || (pkg.devDependencies || {})[name] || "0.0.0";
    const version = String(spec).replace(/^[~^>=<\s]+/, "") || "0.0.0";
    return { name, version, ecosystem: "npm" };
  });
  return {
    repo: repoFullName,
    versions,
    deps: [],
    direct: versions.map((v) => `ver:${v.name}@${v.version}`),
    ecosystem: "npm",
    unresolved: true,
  };
}

export function parseRequirements(text, repoFullName) {
  const versions = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("-")) continue;
    const m = t.match(/^([A-Za-z0-9_.-]+)\s*(?:==|>=|<=|~=)?\s*([0-9][^\s;]+)?/);
    if (!m) continue;
    versions.push({ name: m[1], version: m[2] || "0.0.0", ecosystem: "PyPI" });
  }
  return {
    repo: repoFullName,
    versions,
    deps: [],
    direct: versions.map((v) => `ver:${v.name}@${v.version}`),
    ecosystem: "PyPI",
    unresolved: true,
  };
}
