/**
 * Server-side HydraDB OS client.
 * Real HTTP API: POST /v1/graphs/{graph}/query
 * Node ids must be non-negative integers. Credentials stay here.
 */
const BASE = (process.env.HYDRA_URL || "http://127.0.0.1:8443").replace(/\/$/, "");
const ADMIN = (process.env.HYDRA_ADMIN_URL || "").replace(/\/$/, "");
const TOKEN = process.env.HYDRA_TOKEN || "local-development-token-32-bytes";

export function hydraBase() {
  return BASE;
}

export function nid(id) {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return (h % 800000) + 1;
}

function probeUrls() {
  const urls = [];
  if (ADMIN) urls.push(`${ADMIN}/readyz`);
  urls.push(`${BASE}/healthz`);
  urls.push(`${BASE}/readyz`);
  if (!process.env.HYDRA_URL && !ADMIN) {
    urls.push("http://127.0.0.1:9090/readyz");
  } else if (BASE.endsWith(":8443")) {
    urls.push(`${BASE.slice(0, -5)}9090/readyz`);
  }
  return [...new Set(urls)];
}

export async function hydraReady() {
  for (const url of probeUrls()) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (r.ok) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

export async function hydraQuery(cypher, parameters = {}) {
  const r = await fetch(`${BASE}/v1/graphs/default/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "X-Graph-Namespace": "default",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cell_id: "cell-0",
      query: cypher,
      parameters,
      consistency: "causal",
    }),
    signal: AbortSignal.timeout(45000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`HydraDB ${r.status}: ${text.slice(0, 400)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`HydraDB returned non-JSON: ${text.slice(0, 200)}`);
  }
}

const REL = {
  depends_on: "DEPENDS_ON",
  uses: "USES",
  runs: "RUNS",
  contains: "CONTAINS",
  deployed_to: "DEPLOYED_TO",
  affects: "AFFECTS",
  maintained_by: "MAINTAINED_BY",
  belongs_to: "BELONGS_TO",
};

function chunks(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export async function ingestGraph(nodes, edges) {
  const byId = new Map((nodes || []).map((n) => [n.id, n]));
  const nodeRows = (nodes || []).map((n) => ({
    id: nid(n.id),
    kind: String(n.kind || "node"),
    name: String(n.name || n.id),
  }));

  let last = null;
  for (const batch of chunks(nodeRows, 80)) {
    last = await hydraQuery(
      `UNWIND $rows AS row
       MERGE (n {id: row.id})
       SET n:Node, n.kind = row.kind, n.name = row.name`,
      { rows: batch }
    );
  }

  const grouped = new Map();
  for (const [from, to, rel] of edges || []) {
    const type = REL[rel];
    if (!type || !byId.has(from) || !byId.has(to)) continue;
    if (!grouped.has(type)) grouped.set(type, []);
    grouped.get(type).push({ sid: nid(from), tid: nid(to) });
  }

  let statements = 0;
  for (const [type, rows] of grouped) {
    for (const batch of chunks(rows, 80)) {
      last = await hydraQuery(
        `UNWIND $rows AS row
         MATCH (s {id: row.sid}), (t {id: row.tid})
         MERGE (s)-[:${type}]->(t)`,
        { rows: batch }
      );
      statements += batch.length;
    }
  }

  return {
    statements,
    nodes: nodeRows.length,
    bookmark: last?.bookmark || null,
    read_epoch: last?.read_epoch ?? null,
  };
}

export async function hydraStats() {
  const res = await hydraQuery("MATCH (n) RETURN count(n) AS nodes");
  const rows = res?.rows || res?.data || res?.result || [];
  const first = Array.isArray(rows) ? rows[0] : null;
  const raw = first?.nodes ?? first?.[0] ?? first?.value ?? 0;
  const nodes = typeof raw === "object" && raw && "value" in raw ? Number(raw.value) : Number(raw) || 0;
  return { nodes, raw: res };
}

/** Reverse-traverse from a vulnerability through HydraDB OpenCypher. */
export async function reverseReach(vulnId) {
  const res = await hydraQuery(
    `MATCH (v {id: $id})<-[:AFFECTS]-(ver)
     OPTIONAL MATCH (src)-[:DEPENDS_ON*0..6]->(ver)
     RETURN ver.id AS version, ver.name AS versionName,
            src.id AS source, src.name AS sourceName, src.kind AS sourceKind
     LIMIT 200`,
    { id: nid(vulnId) }
  );
  return {
    source: "hydradb",
    vuln: vulnId,
    query: "MATCH (v)<-[:AFFECTS]-(ver) OPTIONAL MATCH (src)-[:DEPENDS_ON*0..6]->(ver)",
    rows: res?.rows || res?.data || [],
    bookmark: res?.bookmark || null,
  };
}
