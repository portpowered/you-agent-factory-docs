/**
 * W20 story 002: content + registry validation convergence catalog.
 *
 * Owns the reviewer-followable inventory of content-runtime / registry gates
 * and published Factory-reference route presence proofs that must stay green
 * on the post-W19 tip. Does not rewrite authored page corpora or reopen
 * nav / search / locale / migration ownership.
 */

export type W20ContentRegistryGateFamily =
  | "validate-data"
  | "content-runtime-completeness"
  | "published-docs-section-contract"
  | "published-route-presence-references"
  | "published-route-presence-factories"
  | "published-route-presence-workers"
  | "published-route-presence-workstations"
  | "static-params-route-families";

export type W20ContentRegistryCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** package.json script invoked by the Makefile target. */
  packageScript: string;
  families: readonly W20ContentRegistryGateFamily[];
};

export type W20ContentRegistrySuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / FR convergence. */
  families: readonly W20ContentRegistryGateFamily[];
};

/**
 * Maintainer command gates: registry validation + content-runtime completeness.
 */
export const W20_CONTENT_REGISTRY_COMMAND_GATES = [
  {
    makeTarget: "validate-data",
    packageScript: "validate-data",
    families: ["validate-data"],
  },
  {
    makeTarget: "verify-content-runtime-completeness",
    packageScript: "verify:content-runtime-completeness",
    families: ["content-runtime-completeness"],
  },
] as const satisfies readonly W20ContentRegistryCommandGate[];

/**
 * Focused content/registry suites that prove published section contracts and
 * catch-all static params for Factory-reference route families.
 */
export const W20_CONTENT_REGISTRY_SUITE_ENTRIES = [
  {
    path: "src/lib/content/published-docs-registry-contract.test.ts",
    families: [
      "published-docs-section-contract",
      "published-route-presence-factories",
      "published-route-presence-workers",
      "published-route-presence-workstations",
    ],
  },
  {
    path: "src/lib/content/docs-catch-all-static-params.test.ts",
    families: [
      "static-params-route-families",
      "published-route-presence-references",
      "published-route-presence-factories",
      "published-route-presence-workers",
      "published-route-presence-workstations",
    ],
  },
] as const satisfies readonly W20ContentRegistrySuiteEntry[];

/**
 * Required published page URLs under Factory-reference families that must remain
 * present in the published-docs registry after convergence.
 */
export const W20_REQUIRED_PUBLISHED_ROUTE_URLS = [
  // references
  "/docs/references/api",
  "/docs/references/events",
  "/docs/references/factory-schema",
  "/docs/references/system-config-schema",
  "/docs/references/mock-workers-schema",
  "/docs/references/cli",
  "/docs/references/mcp",
  "/docs/references/javascript-runtime",
  // factories
  "/docs/factories/configuration",
  "/docs/factories/global-configuration",
  "/docs/factories/packaged",
  "/docs/factories/dynamic-workflows",
  "/docs/factories/sessions",
  // workers
  "/docs/workers/agent",
  "/docs/workers/inference",
  "/docs/workers/script",
  "/docs/workers/poller",
  "/docs/workers/model",
  "/docs/workers/hosted",
  "/docs/workers/mock",
  // workstations
  "/docs/workstations/agent-run",
  "/docs/workstations/classifier",
  "/docs/workstations/cron",
  "/docs/workstations/inference-run",
  "/docs/workstations/logical-move",
  "/docs/workstations/model-invoke",
  "/docs/workstations/model-workstation",
  "/docs/workstations/poller",
  "/docs/workstations/poller-run",
  "/docs/workstations/repeater",
  "/docs/workstations/script-run",
  "/docs/workstations/standard",
] as const;

export const W20_CONTENT_REGISTRY_REQUIRED_TEST_PATHS =
  W20_CONTENT_REGISTRY_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_CONTENT_REGISTRY_REQUIRED_FAMILIES = [
  "validate-data",
  "content-runtime-completeness",
  "published-docs-section-contract",
  "published-route-presence-references",
  "published-route-presence-factories",
  "published-route-presence-workers",
  "published-route-presence-workstations",
  "static-params-route-families",
] as const satisfies readonly W20ContentRegistryGateFamily[];

export const W20_CONTENT_REGISTRY_SUITE_COMMAND =
  "make test-w20-content-registry";

export function listW20ContentRegistryCoveredFamilies(): W20ContentRegistryGateFamily[] {
  const covered = new Set<W20ContentRegistryGateFamily>();
  for (const gate of W20_CONTENT_REGISTRY_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  for (const entry of W20_CONTENT_REGISTRY_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  // Route-presence families are also proved by the catalog route-presence test.
  covered.add("published-route-presence-references");
  covered.add("published-route-presence-factories");
  covered.add("published-route-presence-workers");
  covered.add("published-route-presence-workstations");
  return [...covered].sort();
}

export function publishedRoutePrefix(url: string): string | null {
  for (const prefix of [
    "/docs/references/",
    "/docs/factories/",
    "/docs/workers/",
    "/docs/workstations/",
  ] as const) {
    if (url.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}
