# Reach

**Point at anything. Trace its reach.**

Hack Hydra 2026 · Track 02A · Supply-chain blast radius  
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

## How HydraDB is used

The product model is a graph: `affects`, `depends_on`, `uses`, `runs`, `contains`, `deployed_to`. Trace is reverse traversal from a CVE through versions to production.

The UI computes reach from that model so the demo works without Docker. Optional: run the OS node and point `VITE_HYDRA_URL` at `http://127.0.0.1:8443` (`src/hydra.js`).

```bash
mkdir hydradb-data\store hydradb-data\cache
echo local-development-token-32-bytes> hydradb-data\auth-token
docker compose up
```

Without HydraDB there is no durable shared graph for a real org. The traversal would have nowhere to live.

## What to demo (under 3 minutes)

1. Landing: “Point at anything. Trace its reach.”
2. Build the demo graph.
3. Map → CVE node → Trace reach → Path 1 of N.
4. Events → vulnerable-lib@2.4.1 → production counts.
5. Simulate upgrade payments-lib 5.2.0 → 5.2.1.

## License

MIT
