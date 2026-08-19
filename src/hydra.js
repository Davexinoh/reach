const BASE = import.meta.env.VITE_HYDRA_URL || "http://127.0.0.1:8443";
const TOKEN = import.meta.env.VITE_HYDRA_TOKEN || "local-development-token-32-bytes";

export async function hydraReady() {
  try {
    const r = await fetch("http://127.0.0.1:9090/readyz");
    return r.ok;
  } catch {
    return false;
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
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
