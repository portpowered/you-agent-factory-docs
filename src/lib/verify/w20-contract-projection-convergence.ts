/**
 * W20 story 001: focused contract + projection convergence catalog.
 *
 * Owns the reviewer-followable inventory of package-acquisition contract tests
 * and normalized reference projection tests that must stay green on the
 * post-W19 tip. Does not reopen W03–W10 renderer or package ownership.
 */

export type W20ContractProjectionGateFamily =
  | "contract-public-subpaths"
  | "contract-manifest-membership"
  | "contract-format-versions"
  | "contract-consumed-hashes"
  | "contract-missing-ref-rejection"
  | "projection-openapi-operations"
  | "projection-schema-fields"
  | "projection-cli-commands"
  | "projection-mcp-tools"
  | "projection-javascript-symbols"
  | "projection-event-variants"
  | "projection-anchors"
  | "projection-search-documents";

export type W20ContractProjectionSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / FR convergence. */
  families: readonly W20ContractProjectionGateFamily[];
};

/**
 * Focused contract suites: public API-package subpaths, manifest membership /
 * hashes / format versions, completeness ledger, and missing-ref rejection.
 */
export const W20_CONTRACT_SUITE_ENTRIES = [
  {
    path: "src/lib/references/api-package-artifact-resolver.test.ts",
    families: ["contract-public-subpaths"],
  },
  {
    path: "src/lib/references/api-package-manifest-membership.test.ts",
    families: ["contract-manifest-membership"],
  },
  {
    path: "src/lib/references/api-package-format-version-gate.test.ts",
    families: ["contract-format-versions"],
  },
  {
    path: "src/lib/references/api-package-consumed-hash-ledger.test.ts",
    families: ["contract-consumed-hashes"],
  },
  {
    path: "src/lib/references/reference-cross-link-resolver.test.ts",
    families: ["contract-missing-ref-rejection"],
  },
] as const satisfies readonly W20ContractProjectionSuiteEntry[];

/**
 * Focused projection suites: OpenAPI ops, schema fields, CLI/MCP/JS/events,
 * anchors, and search-document projections (plus fixture-backed integration).
 */
export const W20_PROJECTION_SUITE_ENTRIES = [
  {
    path: "src/lib/references/reference-item.test.ts",
    families: ["projection-schema-fields"],
  },
  {
    path: "src/lib/references/schema-model.test.ts",
    families: ["projection-schema-fields"],
  },
  {
    path: "src/lib/references/family-normalized-models.test.ts",
    families: [
      "projection-openapi-operations",
      "projection-cli-commands",
      "projection-mcp-tools",
      "projection-javascript-symbols",
      "projection-event-variants",
    ],
  },
  {
    path: "src/lib/references/normalize-family-artifacts.test.ts",
    families: [
      "projection-openapi-operations",
      "projection-cli-commands",
      "projection-mcp-tools",
      "projection-javascript-symbols",
      "projection-event-variants",
    ],
  },
  {
    path: "src/lib/references/reference-anchor-registry.test.ts",
    families: ["projection-anchors"],
  },
  {
    path: "src/lib/references/reference-display-projection.test.ts",
    families: ["projection-schema-fields"],
  },
  {
    path: "src/lib/references/reference-search-projection.test.ts",
    families: ["projection-search-documents"],
  },
  {
    path: "src/lib/references/reference-model-fixtures.test.ts",
    families: [
      "contract-missing-ref-rejection",
      "projection-anchors",
      "projection-search-documents",
      "projection-schema-fields",
    ],
  },
  {
    path: "src/lib/references/mcp-input-schema-projection.test.ts",
    families: ["projection-mcp-tools", "projection-schema-fields"],
  },
  {
    path: "src/features/references/api/single-page-projection.test.ts",
    families: ["projection-openapi-operations"],
  },
  {
    path: "src/lib/references/family-inventory-contract-drift.test.ts",
    families: [
      "projection-cli-commands",
      "projection-mcp-tools",
      "projection-javascript-symbols",
    ],
  },
] as const satisfies readonly W20ContractProjectionSuiteEntry[];

export const W20_CONTRACT_PROJECTION_SUITE_ENTRIES = [
  ...W20_CONTRACT_SUITE_ENTRIES,
  ...W20_PROJECTION_SUITE_ENTRIES,
] as const;

export const W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS =
  W20_CONTRACT_PROJECTION_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_CONTRACT_PROJECTION_REQUIRED_FAMILIES = [
  "contract-public-subpaths",
  "contract-manifest-membership",
  "contract-format-versions",
  "contract-consumed-hashes",
  "contract-missing-ref-rejection",
  "projection-openapi-operations",
  "projection-schema-fields",
  "projection-cli-commands",
  "projection-mcp-tools",
  "projection-javascript-symbols",
  "projection-event-variants",
  "projection-anchors",
  "projection-search-documents",
] as const satisfies readonly W20ContractProjectionGateFamily[];

export const W20_CONTRACT_PROJECTION_SUITE_COMMAND =
  "make test-w20-contract-projection";

export function listW20ContractProjectionCoveredFamilies(): W20ContractProjectionGateFamily[] {
  const covered = new Set<W20ContractProjectionGateFamily>();
  for (const entry of W20_CONTRACT_PROJECTION_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
