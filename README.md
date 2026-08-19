# Reach

**Point at anything. Trace its reach.**

Hack Hydra 2026 · Track 02A · Supply-chain blast radius  
Live: [reach-production-0725.up.railway.app](https://reach-production-0725.up.railway.app)  
Graph layer: [HydraDB](https://github.com/hydra-db/hydradb)

A scanner tells you a package is vulnerable. Reach tells you **what that vulnerability can reach** — applications, services, repositories, production — and **the path**.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://127.0.0.1:5173).

Demo dataset is Harborline. Onboarding → **Demo dataset** → Map → pick the red diamond → **Trace reach**.

⌘K opens Command. Try: `What critical vulnerabilities can reach production?`

## Architecture

```
Browser  →  Reach API (/api)  →  Reach engine
                              →  HydraDB (optional, server-side only)
```

HydraDB credentials never leave `server/hydra.mjs`. The browser calls `/api/trace`, `/api/simulate`, `/api/ingest`.

Reach owns reachability and exposure. HydraDB stores the same relationships via the real OS HTTP API (`POST /v1/graphs/default/query`, integer node ids, OpenCypher). If the node is down, the seeded engine still traces — ingest returns `HYDRADB_UNAVAILABLE`.

```bash
mkdir hydradb-data\store hydradb-data\cache
echo local-development-token-32-bytes> hydradb-data\auth-token
docker compose up
```

Without HydraDB there is no durable shared graph for a real org. The traversal would have nowhere to live.

## How this uses the HydraDB OS repo

The supply chain is a graph: `AFFECTS`, `DEPENDS_ON`, `USES`, `RUNS`, `CONTAINS`, `DEPLOYED_TO`, `MAINTAINED_BY`.

- `server/hydra.mjs` talks to the real node API: `POST /v1/graphs/default/query` with Bearer auth and integer ids (OpenCypher). Credentials never go to the browser.
- `POST /api/ingest` writes the Harborline graph into HydraDB.
- Reach’s engine (`src/data/engine.js`) does reverse reachability and exposure. That logic stays in Reach; HydraDB is the relationship store.

Without a running node, ingest returns `HYDRADB_UNAVAILABLE` and the demo still traces the same seeded model so judges can click through. Locally: `docker compose up` then Settings → Ingest demo graph.

## What to demo (under 3 minutes)

1. Landing: “Point at anything. Trace its reach.”
2. Build the demo graph.
3. Map → CVE node → Trace reach → Path 1 of N.
4. Events → vulnerable-lib@2.4.1 → production counts.
5. Simulate upgrade payments-lib 5.2.0 → 5.2.1.

## License

MIT
