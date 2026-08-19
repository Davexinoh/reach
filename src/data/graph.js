/** Consistent Harborline graph. Numbers come from traversal, not captions. */

export const NODES = [
  { id: "vuln:cve-2026-4418", kind: "vuln", name: "CVE-2026-4418", title: "Prototype pollution in cookie parse", cvss: 9.8, exposure: "critical" },

  { id: "pkg:vulnerable-lib", kind: "package", name: "vulnerable-lib" },
  { id: "ver:vulnerable-lib@2.4.1", kind: "version", name: "vulnerable-lib", version: "2.4.1", package: "vulnerable-lib" },
  { id: "ver:vulnerable-lib@2.5.0", kind: "version", name: "vulnerable-lib", version: "2.5.0", package: "vulnerable-lib" },

  { id: "pkg:payments-lib", kind: "package", name: "payments-lib" },
  { id: "ver:payments-lib@5.2.0", kind: "version", name: "payments-lib", version: "5.2.0", package: "payments-lib" },
  { id: "ver:payments-lib@5.2.1", kind: "version", name: "payments-lib", version: "5.2.1", package: "payments-lib" },

  { id: "pkg:checkout-sdk", kind: "package", name: "checkout-sdk" },
  { id: "ver:checkout-sdk@3.8.1", kind: "version", name: "checkout-sdk", version: "3.8.1", package: "checkout-sdk" },
  { id: "ver:checkout-sdk@3.9.0", kind: "version", name: "checkout-sdk", version: "3.9.0", package: "checkout-sdk" },

  { id: "pkg:auth-core", kind: "package", name: "auth-core" },
  { id: "ver:auth-core@1.4.0", kind: "version", name: "auth-core", version: "1.4.0", package: "auth-core" },

  { id: "pkg:http-client", kind: "package", name: "http-client" },
  { id: "ver:http-client@3.1.0", kind: "version", name: "http-client", version: "3.1.0", package: "http-client" },
  { id: "ver:http-client@3.2.0", kind: "version", name: "http-client", version: "3.2.0", package: "http-client" },

  { id: "app:payments", kind: "app", name: "Payments" },
  { id: "app:checkout", kind: "app", name: "Checkout" },
  { id: "app:orders", kind: "app", name: "Orders" },
  { id: "app:identity", kind: "app", name: "Identity" },
  { id: "app:analytics", kind: "app", name: "Analytics" },

  { id: "svc:payments-api", kind: "service", name: "payments-api", criticality: "critical" },
  { id: "svc:orders-service", kind: "service", name: "orders-service", criticality: "critical" },
  { id: "svc:checkout-web", kind: "service", name: "checkout-web", criticality: "high" },
  { id: "svc:identity-core", kind: "service", name: "identity-core", criticality: "high" },
  { id: "svc:analytics", kind: "service", name: "analytics-platform", criticality: "low" },
  { id: "svc:billing-worker", kind: "service", name: "billing-worker", criticality: "medium" },
  { id: "svc:merchant-portal", kind: "service", name: "merchant-portal", criticality: "medium" },
  { id: "svc:mobile-api", kind: "service", name: "mobile-api", criticality: "high" },

  { id: "repo:payments-api", kind: "repo", name: "payments-api" },
  { id: "repo:checkout-web", kind: "repo", name: "checkout-web" },
  { id: "repo:orders-service", kind: "repo", name: "orders-service" },
  { id: "repo:identity-core", kind: "repo", name: "identity-core" },
  { id: "repo:analytics-platform", kind: "repo", name: "analytics-platform" },
  { id: "repo:billing-worker", kind: "repo", name: "billing-worker" },
  { id: "repo:merchant-portal", kind: "repo", name: "merchant-portal" },
  { id: "repo:mobile-api", kind: "repo", name: "mobile-api" },

  { id: "env:prod-us", kind: "env", name: "Production-US", production: true },
  { id: "env:prod-eu", kind: "env", name: "Production-EU", production: true },
  { id: "env:staging", kind: "env", name: "Staging", production: false },
  { id: "env:dev", kind: "env", name: "Development", production: false },
];

/** Directed toward production impact. */
export const EDGES = [
  ["vuln:cve-2026-4418", "ver:vulnerable-lib@2.4.1", "affects"],

  ["ver:payments-lib@5.2.0", "ver:vulnerable-lib@2.4.1", "depends_on"],
  ["ver:payments-lib@5.2.1", "ver:vulnerable-lib@2.5.0", "depends_on"],
  ["ver:checkout-sdk@3.8.1", "ver:payments-lib@5.2.0", "depends_on"],
  ["ver:checkout-sdk@3.9.0", "ver:payments-lib@5.2.1", "depends_on"],
  ["ver:http-client@3.1.0", "ver:vulnerable-lib@2.4.1", "depends_on"],
  ["ver:http-client@3.2.0", "ver:vulnerable-lib@2.5.0", "depends_on"],

  ["app:payments", "ver:payments-lib@5.2.0", "uses"],
  ["app:checkout", "ver:checkout-sdk@3.8.1", "uses"],
  ["app:orders", "ver:checkout-sdk@3.8.1", "uses"],
  ["app:identity", "ver:auth-core@1.4.0", "uses"],
  ["app:analytics", "ver:http-client@3.1.0", "uses"],

  ["svc:payments-api", "app:payments", "runs"],
  ["svc:orders-service", "app:orders", "runs"],
  ["svc:checkout-web", "app:checkout", "runs"],
  ["svc:identity-core", "app:identity", "runs"],
  ["svc:analytics", "app:analytics", "runs"],
  ["svc:billing-worker", "app:payments", "runs"],
  ["svc:merchant-portal", "app:checkout", "runs"],
  ["svc:mobile-api", "app:orders", "runs"],

  ["repo:payments-api", "app:payments", "contains"],
  ["repo:checkout-web", "app:checkout", "contains"],
  ["repo:orders-service", "app:orders", "contains"],
  ["repo:identity-core", "app:identity", "contains"],
  ["repo:analytics-platform", "app:analytics", "contains"],
  ["repo:billing-worker", "app:payments", "contains"],
  ["repo:merchant-portal", "app:checkout", "contains"],
  ["repo:mobile-api", "app:orders", "contains"],

  ["svc:payments-api", "env:prod-us", "deployed_to"],
  ["svc:payments-api", "env:prod-eu", "deployed_to"],
  ["svc:orders-service", "env:prod-us", "deployed_to"],
  ["svc:checkout-web", "env:prod-us", "deployed_to"],
  ["svc:identity-core", "env:prod-us", "deployed_to"],
  ["svc:analytics", "env:dev", "deployed_to"],
  ["svc:billing-worker", "env:staging", "deployed_to"],
  ["svc:merchant-portal", "env:staging", "deployed_to"],
  ["svc:mobile-api", "env:prod-us", "deployed_to"],
];

export function nodeById(id) {
  return NODES.find((n) => n.id === id);
}
