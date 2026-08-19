const OSV = "https://api.osv.dev/v1/querybatch";

export async function queryOsv(versions) {
  const unique = [];
  const seen = new Set();
  for (const v of versions) {
    const key = `${v.ecosystem}:${v.name}@${v.version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(v);
  }
  const vulns = [];
  for (let i = 0; i < unique.length; i += 80) {
    const chunk = unique.slice(i, i + 80);
    const r = await fetch(OSV, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: chunk.map((v) => ({
          version: v.version,
          package: { name: v.name, ecosystem: v.ecosystem || "npm" },
        })),
      }),
    });
    if (!r.ok) continue;
    const data = await r.json();
    (data.results || []).forEach((res, idx) => {
      const pkg = chunk[idx];
      for (const vuln of res.vulns || []) {
        vulns.push({
          id: `vuln:${vuln.id}`,
          cve: vuln.id,
          name: vuln.id,
          title: vuln.summary || vuln.id,
          cvss: cvssOf(vuln),
          kind: "vuln",
          affected: `${pkg.name}@${pkg.version}`,
          package: pkg.name,
          version: pkg.version,
          versionId: `ver:${pkg.name}@${pkg.version}`,
        });
      }
    });
  }
  return vulns;
}

function cvssOf(vuln) {
  const sev = (vuln.severity || []).find((s) => s.type && s.score);
  if (sev?.score) {
    const n = parseFloat(String(sev.score).split("/").pop());
    if (!Number.isNaN(n) && n <= 10) return n;
    const m = String(sev.score).match(/([0-9]+\.[0-9]+)/);
    if (m) return parseFloat(m[1]);
  }
  const db = vuln.database_specific?.severity;
  if (db === "CRITICAL") return 9.8;
  if (db === "HIGH") return 8.1;
  if (db === "MEDIUM") return 5.5;
  return 7.5;
}
