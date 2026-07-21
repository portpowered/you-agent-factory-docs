/**
 * W20 story 003: link + anchor validation convergence catalog.
 *
 * Owns the reviewer-followable inventory of linkcheck and reference-anchor
 * gates that must stay green on the post-W19 tip. Does not redesign nav
 * topology or reopen W08/W09 renderer ownership.
 */

export type W20LinkAnchorGateFamily =
  | "linkcheck"
  | "link-validation-helpers"
  | "anchor-operations"
  | "anchor-schema-fields"
  | "anchor-cli"
  | "anchor-mcp"
  | "anchor-javascript"
  | "anchor-events";

export type W20LinkAnchorCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** package.json script invoked by the Makefile target. */
  packageScript: string;
  families: readonly W20LinkAnchorGateFamily[];
};

export type W20LinkAnchorSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / FR convergence. */
  families: readonly W20LinkAnchorGateFamily[];
};

/**
 * Maintainer command gate: full documentation link + heading-anchor validation.
 */
export const W20_LINK_ANCHOR_COMMAND_GATES = [
  {
    makeTarget: "linkcheck",
    packageScript: "linkcheck",
    families: ["linkcheck"],
  },
] as const satisfies readonly W20LinkAnchorCommandGate[];

/**
 * Focused link/anchor suites that prove in-site href validation and reference
 * deep-link anchors for operations, schema fields, CLI/MCP/JS, and events.
 */
export const W20_LINK_ANCHOR_SUITE_ENTRIES = [
  {
    path: "src/lib/build/validate-links.test.ts",
    families: ["link-validation-helpers", "linkcheck"],
  },
  {
    path: "src/lib/references/reference-anchor-registry.test.ts",
    families: [
      "anchor-operations",
      "anchor-schema-fields",
      "anchor-cli",
      "anchor-mcp",
      "anchor-javascript",
      "anchor-events",
    ],
  },
  {
    path: "src/lib/references/assign-family-reference-anchors.test.ts",
    families: ["anchor-cli", "anchor-mcp", "anchor-javascript"],
  },
  {
    path: "src/features/references/api/operation-anchors.test.ts",
    families: ["anchor-operations"],
  },
  {
    path: "src/features/references/schema/schema-composition.test.tsx",
    families: ["anchor-schema-fields"],
  },
] as const satisfies readonly W20LinkAnchorSuiteEntry[];

export const W20_LINK_ANCHOR_REQUIRED_TEST_PATHS =
  W20_LINK_ANCHOR_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_LINK_ANCHOR_REQUIRED_FAMILIES = [
  "linkcheck",
  "link-validation-helpers",
  "anchor-operations",
  "anchor-schema-fields",
  "anchor-cli",
  "anchor-mcp",
  "anchor-javascript",
  "anchor-events",
] as const satisfies readonly W20LinkAnchorGateFamily[];

export const W20_LINK_ANCHOR_SUITE_COMMAND = "make test-w20-link-anchor";

export function listW20LinkAnchorCoveredFamilies(): W20LinkAnchorGateFamily[] {
  const covered = new Set<W20LinkAnchorGateFamily>();
  for (const gate of W20_LINK_ANCHOR_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  for (const entry of W20_LINK_ANCHOR_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
