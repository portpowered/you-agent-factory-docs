/**
 * W20 story 004: search functional / static-search convergence catalog.
 *
 * Owns the reviewer-followable inventory of static-search bootstrap gates and
 * W16 item-level deep-link proofs that must stay green on the post-W19 tip.
 * Does not redesign search ranking or reopen W16 projection ownership.
 */

export type W20SearchFunctionalGateFamily =
  | "static-search-bootstrap"
  | "export-search-bootstrap-consumers"
  | "item-deep-link-operations"
  | "item-deep-link-schema-fields"
  | "item-deep-link-cli"
  | "item-deep-link-mcp"
  | "item-deep-link-javascript"
  | "item-deep-link-events"
  | "item-hits-above-page-crowding"
  | "representative-item-queries";

export type W20SearchFunctionalCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** package.json script invoked by the Makefile target. */
  packageScript: string;
  families: readonly W20SearchFunctionalGateFamily[];
};

export type W20SearchFunctionalSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / FR convergence. */
  families: readonly W20SearchFunctionalGateFamily[];
};

/**
 * Maintainer command gate: static-search bootstrap + export consumer path proofs.
 */
export const W20_SEARCH_FUNCTIONAL_COMMAND_GATES = [
  {
    makeTarget: "test-website-static-search",
    packageScript: "test:website:static-search",
    families: ["static-search-bootstrap", "export-search-bootstrap-consumers"],
  },
] as const satisfies readonly W20SearchFunctionalCommandGate[];

/**
 * Focused search suites that prove reference item deep-links for operations,
 * schema fields, CLI/MCP/JS, and events — including collapse/rerank and
 * representative live `docsSearchApi.search` queries from W16.
 */
export const W20_SEARCH_FUNCTIONAL_SUITE_ENTRIES = [
  {
    path: "src/lib/content/factory-search-reference-shape-adaptation.test.ts",
    families: ["item-deep-link-events"],
  },
  {
    path: "src/lib/content/factory-search-api-schema-indexing.test.ts",
    families: ["item-deep-link-operations", "item-deep-link-schema-fields"],
  },
  {
    path: "src/lib/content/factory-search-cli-mcp-js-event-indexing.test.ts",
    families: [
      "item-deep-link-cli",
      "item-deep-link-mcp",
      "item-deep-link-javascript",
      "item-deep-link-events",
    ],
  },
  {
    path: "src/lib/content/factory-search-item-hits-above-page-crowding.test.ts",
    families: [
      "item-hits-above-page-crowding",
      "item-deep-link-operations",
      "item-deep-link-cli",
      "item-deep-link-events",
    ],
  },
  {
    path: "src/lib/content/factory-search-payload-gate-representative-queries.test.ts",
    families: [
      "representative-item-queries",
      "item-deep-link-operations",
      "item-deep-link-schema-fields",
      "item-deep-link-cli",
      "item-deep-link-mcp",
      "item-deep-link-events",
    ],
  },
  {
    path: "src/lib/verify/w20-search-functional-browser-verify.test.tsx",
    families: [
      "representative-item-queries",
      "item-deep-link-operations",
      "item-deep-link-cli",
      "item-deep-link-events",
    ],
  },
] as const satisfies readonly W20SearchFunctionalSuiteEntry[];

export const W20_SEARCH_FUNCTIONAL_REQUIRED_TEST_PATHS =
  W20_SEARCH_FUNCTIONAL_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_SEARCH_FUNCTIONAL_REQUIRED_FAMILIES = [
  "static-search-bootstrap",
  "export-search-bootstrap-consumers",
  "item-deep-link-operations",
  "item-deep-link-schema-fields",
  "item-deep-link-cli",
  "item-deep-link-mcp",
  "item-deep-link-javascript",
  "item-deep-link-events",
  "item-hits-above-page-crowding",
  "representative-item-queries",
] as const satisfies readonly W20SearchFunctionalGateFamily[];

/**
 * Representative W16 item deep-link contracts used for browser / live-API
 * verification that search still addresses anchors, not only owning pages.
 */
export const W20_SEARCH_FUNCTIONAL_REPRESENTATIVE_ITEM_QUERIES = [
  {
    query: "submitWorkBySessionId",
    expectedUrl: "/docs/references/api#submitWorkBySessionId",
    family: "item-deep-link-operations",
  },
  {
    query: "RUN_REQUEST",
    expectedUrl: "/docs/references/events#RUN_REQUEST",
    family: "item-deep-link-events",
  },
  {
    query: "you config init",
    expectedUrl: "/docs/references/cli#you-config-init",
    family: "item-deep-link-cli",
  },
] as const;

export const W20_SEARCH_FUNCTIONAL_SUITE_COMMAND =
  "make test-w20-search-functional";

export function listW20SearchFunctionalCoveredFamilies(): W20SearchFunctionalGateFamily[] {
  const covered = new Set<W20SearchFunctionalGateFamily>();
  for (const gate of W20_SEARCH_FUNCTIONAL_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  for (const entry of W20_SEARCH_FUNCTIONAL_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
