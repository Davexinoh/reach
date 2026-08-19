/**
 * Server-side HydraDB OS client.
 * Real HTTP API from hydra-db/hydradb: POST /v1/graphs/{graph}/query
 * Node ids must be non-negative integers. Credentials stay here.
 */
const BASE = process.env.HYDRA_URL || "http://127.0.0.1:8443";
const TOKEN = process.env.HYDRA_TOKEN || "local-development-token-32-bytes";

export function nid(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return (h % 800000) + 1;
}

export async function hydraReady() {
  try {
    const r = await fetch("http://127.0.0.1:9090/readyz");
    return r.ok;
  } catch {
    try {
      const r = await fetch(`${BASE}/healthz`);
      return r.ok;
    } catch {
      return false;
    }
  }
}

export async function hydraQuery(cypher, parameters = {}) {
  const r = await fetch(`${BASE}/v1/graphs/default/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "X-Graph-Namespace": "default",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cell_id: "cell-0", query: cypher, parameters }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`HydraDB ${r.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
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

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function ingestGraph(nodes, edges) {
  let statements = 0;
  let last = null;
  for (const [from, to, rel] of edges) {
    const type = REL[rel];
    if (!type) continue;
    const a = nodes.find((n) => n.id === from);
    const b = nodes.find((n) => n.id === to);
    if (!a || !b) continue;
    last = await hydraQuery(
      `CREATE (s:Node {id: ${nid(from)}, kind: '${esc(a.kind)}', name: '${esc(a.name)}'})-[:${type}]->(t:Node {id: ${nid(to)}, kind: '${esc(b.kind)}', name: '${esc(b.name)}'})`
    );
    statements += 1;
  }
  return {
    statements,
    bookmark: last?.bookmark || null,
    read_epoch: last?.read_epoch ?? null,
  };
}

export async function queryDepends(fromId) {
  return hydraQuery(
    "MATCH (a:Node {id: $id})-[:DEPENDS_ON*1..6]->(b:Node) RETURN b.id, b.name",
    { id: nid(fromId) }
  );
}
