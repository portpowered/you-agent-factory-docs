/**
 * W20 story 011: final convergence evidence + upstream follow-ups.
 *
 * Owns the reviewer-followable §17 gate-family evidence map (commands / tests /
 * artifacts from stories 001–010) and the locked Worker/Workstation
 * discriminated-schema upstream follow-ups from plan §19 / baseline. Does not
 * invent unpublished schemas or reopen W00–W19 feature ownership.
 */

import { W20_A11Y_RESPONSIVE_SUITE_COMMAND } from "./w20-a11y-responsive-convergence";
import { W20_BUDGET_SUITE_COMMAND } from "./w20-budget-convergence";
import { W20_CLIENT_CHUNK_EXCLUSION_SUITE_COMMAND } from "./w20-client-chunk-exclusion-convergence";
import { W20_CONTENT_REGISTRY_SUITE_COMMAND } from "./w20-content-registry-convergence";
import { W20_CONTRACT_PROJECTION_SUITE_COMMAND } from "./w20-contract-projection-convergence";
import { W20_LINK_ANCHOR_SUITE_COMMAND } from "./w20-link-anchor-convergence";
import { W20_OWNERSHIP_MIGRATION_SUITE_COMMAND } from "./w20-ownership-migration-convergence";
import { W20_PAGES_PREFIXED_SUITE_COMMAND } from "./w20-pages-prefixed-export-convergence";
import { W20_SEARCH_FUNCTIONAL_SUITE_COMMAND } from "./w20-search-functional-convergence";
import {
  W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES,
  W20_STATIC_EXPORT_SUITE_COMMAND,
} from "./w20-static-export-convergence";

/**
 * §17 / PRD gate families that final evidence must record with pointers.
 */
export type W20FinalEvidenceGateFamily =
  | "contract"
  | "projection"
  | "content-registry"
  | "link-anchor"
  | "search"
  | "a11y-responsive"
  | "lint-typecheck"
  | "static-export"
  | "pages-guard"
  | "budgets"
  | "client-chunk-exclusion"
  | "ownership-map"
  | "migration-closure";

export type W20FinalEvidenceEntry = {
  /** §17 / PRD gate family id. */
  family: W20FinalEvidenceGateFamily;
  /** Human-readable gate label for evidence tables. */
  label: string;
  /** Maintainer reproduction command (Makefile / package script). */
  command: string;
  /** Primary catalog or suite path reviewers can open. */
  evidencePath: string;
  /** Owning W20 story that closed this gate family. */
  storyId: string;
};

export type W20UpstreamFollowUpScope =
  "worker-workstation-discriminated-schema";

export type W20UpstreamFollowUp = {
  /** Stable id for evidence locking (not a product surface). */
  id: string;
  /** Must stay within the allowed upstream scope. */
  scope: W20UpstreamFollowUpScope;
  /** Plan / baseline pointer (repo-relative when local). */
  source: string;
  /** Honest follow-up statement — no invented schema contracts. */
  summary: string;
  /** Example `$defs` names already documented as aspirational upstream. */
  exampleDefs: readonly string[];
};

export type W20FinalEvidenceBrowserProbe = {
  path: `/${string}`;
  family: "api" | "events" | "schema" | "factory" | "worker" | "workstation";
  corpusMarkers: readonly string[];
  noHostMarkers: readonly string[];
};

export type W20FinalEvidenceCommandGate = {
  makeTarget: string;
  packageScript: string;
  env: Readonly<Record<string, string>>;
  families: readonly W20FinalEvidenceGateFamily[];
};

/**
 * Ordered §17 gate-family evidence map. Each row points at an established
 * W20 binder command + catalog path — final evidence does not invent a second
 * verification pipeline per family.
 */
export const W20_FINAL_EVIDENCE_ENTRIES = [
  {
    family: "contract",
    label: "Focused contract tests",
    command: W20_CONTRACT_PROJECTION_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-contract-projection-convergence.ts",
    storyId: "refs-w20-static-export-convergence-001",
  },
  {
    family: "projection",
    label: "Focused projection tests",
    command: W20_CONTRACT_PROJECTION_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-contract-projection-convergence.ts",
    storyId: "refs-w20-static-export-convergence-001",
  },
  {
    family: "content-registry",
    label: "Content / registry validation",
    command: W20_CONTENT_REGISTRY_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-content-registry-convergence.ts",
    storyId: "refs-w20-static-export-convergence-002",
  },
  {
    family: "link-anchor",
    label: "Link and anchor validation",
    command: W20_LINK_ANCHOR_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-link-anchor-convergence.ts",
    storyId: "refs-w20-static-export-convergence-003",
  },
  {
    family: "search",
    label: "Search functional verification",
    command: W20_SEARCH_FUNCTIONAL_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-search-functional-convergence.ts",
    storyId: "refs-w20-static-export-convergence-004",
  },
  {
    family: "a11y-responsive",
    label: "Accessibility and responsive suites",
    command: W20_A11Y_RESPONSIVE_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-a11y-responsive-convergence.ts",
    storyId: "refs-w20-static-export-convergence-005",
  },
  {
    family: "lint-typecheck",
    label: "Lint and typecheck (make check)",
    command: "make check",
    evidencePath: "Makefile",
    storyId: "refs-w20-static-export-convergence-011",
  },
  {
    family: "static-export",
    label: "Full static export (FR-33 / FR-34)",
    command: W20_STATIC_EXPORT_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-static-export-convergence.ts",
    storyId: "refs-w20-static-export-convergence-006",
  },
  {
    family: "pages-guard",
    label: "Pages-prefixed export + deployed-artifact guard",
    command: W20_PAGES_PREFIXED_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-pages-prefixed-export-convergence.ts",
    storyId: "refs-w20-static-export-convergence-007",
  },
  {
    family: "budgets",
    label: "Total-site and reference payload budgets",
    command: W20_BUDGET_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-budget-convergence.ts",
    storyId: "refs-w20-static-export-convergence-008",
  },
  {
    family: "client-chunk-exclusion",
    label: "Package resolver client-chunk exclusion",
    command: W20_CLIENT_CHUNK_EXCLUSION_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-client-chunk-exclusion-convergence.ts",
    storyId: "refs-w20-static-export-convergence-009",
  },
  {
    family: "ownership-map",
    label: "Plan §9 / §11 ownership and test-surface map",
    command: W20_OWNERSHIP_MIGRATION_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-ownership-migration-convergence.ts",
    storyId: "refs-w20-static-export-convergence-010",
  },
  {
    family: "migration-closure",
    label: "W18 migration ledger closure",
    command: W20_OWNERSHIP_MIGRATION_SUITE_COMMAND,
    evidencePath: "src/lib/verify/w20-ownership-migration-convergence.ts",
    storyId: "refs-w20-static-export-convergence-010",
  },
] as const satisfies readonly W20FinalEvidenceEntry[];

/**
 * Allowed upstream follow-ups only: Worker/Workstation discriminated-schema
 * (and related already-documented upstream contract items). Do not invent
 * unpublished schemas or new product surfaces here.
 */
export const W20_UPSTREAM_FOLLOW_UPS = [
  {
    id: "worker-workstation-discriminated-defs",
    scope: "worker-workstation-discriminated-schema",
    source:
      "docs/temp/references/plan.md#19-open-questions-and-upstream-follow-ups",
    summary:
      "Upstream Factory schema generation should consider publishing explicit discriminated `$defs` (for example AgentWorker, RepeaterWorkstation, ClassifierWorkstation) instead of broad Worker/Workstation objects; overlays remain the docs-side applicability layer until that lands.",
    exampleDefs: [
      "AgentWorker",
      "RepeaterWorkstation",
      "ClassifierWorkstation",
    ],
  },
  {
    id: "worker-workstation-broad-object-baseline",
    scope: "worker-workstation-discriminated-schema",
    source: "docs/temp/references/baseline.md#shape-limitation-explicit",
    summary:
      "Installed `$defs.Worker` and `$defs.Workstation` remain broad `type: object` definitions without `oneOf` discrimination; authored pages and overlays must not assume a machine-enforced per-variant subschema tree exists yet.",
    exampleDefs: ["Worker", "Workstation"],
  },
] as const satisfies readonly W20UpstreamFollowUp[];

/** Allowed upstream follow-up scopes for this lane. */
export const W20_UPSTREAM_FOLLOW_UP_ALLOWED_SCOPES = [
  "worker-workstation-discriminated-schema",
] as const satisfies readonly W20UpstreamFollowUpScope[];

/**
 * Representative exported surfaces for browser-path close-out without a
 * Factory host (API, events, one schema, one authored factory/worker/
 * workstation page). Markers reuse the FR-33 / FR-34 probe inventory.
 */
function browserProbeFromStaticExport(
  path: (typeof W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES)[number]["path"],
): W20FinalEvidenceBrowserProbe {
  const probe = W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES.find(
    (entry) => entry.path === path,
  );
  if (!probe) {
    throw new Error(
      `W20 final-evidence browser probe missing static-export inventory for ${path}`,
    );
  }
  const family = probe.family;
  if (
    family !== "api" &&
    family !== "events" &&
    family !== "schema" &&
    family !== "factory" &&
    family !== "worker" &&
    family !== "workstation"
  ) {
    throw new Error(
      `W20 final-evidence browser probe family "${family}" is not in the story-011 surface set`,
    );
  }
  return {
    path: probe.path,
    family,
    corpusMarkers: probe.corpusMarkers,
    noHostMarkers: probe.noHostMarkers,
  };
}

export const W20_FINAL_EVIDENCE_BROWSER_PROBES = [
  browserProbeFromStaticExport("/docs/references/api"),
  browserProbeFromStaticExport("/docs/references/events"),
  browserProbeFromStaticExport("/docs/references/factory-schema"),
  browserProbeFromStaticExport("/docs/factories/packaged"),
  browserProbeFromStaticExport("/docs/workers/hosted"),
  browserProbeFromStaticExport("/docs/workstations/standard"),
] as const satisfies readonly W20FinalEvidenceBrowserProbe[];

/**
 * Story 011 command gate: lint + typecheck via shared `make check`.
 */
export const W20_FINAL_EVIDENCE_COMMAND_GATES = [
  {
    makeTarget: "check",
    packageScript: "check",
    env: {},
    families: ["lint-typecheck"],
  },
] as const satisfies readonly W20FinalEvidenceCommandGate[];

export const W20_FINAL_EVIDENCE_REQUIRED_FAMILIES = [
  "contract",
  "projection",
  "content-registry",
  "link-anchor",
  "search",
  "a11y-responsive",
  "lint-typecheck",
  "static-export",
  "pages-guard",
  "budgets",
  "client-chunk-exclusion",
  "ownership-map",
  "migration-closure",
] as const satisfies readonly W20FinalEvidenceGateFamily[];

export const W20_FINAL_EVIDENCE_SUITE_ENTRIES = [
  {
    path: "src/lib/verify/w20-final-evidence-convergence.test.ts",
    families: W20_FINAL_EVIDENCE_REQUIRED_FAMILIES,
  },
  {
    path: "src/lib/verify/w20-final-evidence-browser-verify.test.ts",
    families: ["static-export", "lint-typecheck"] as const,
  },
] as const;

export const W20_FINAL_EVIDENCE_POST_COMMAND_SUITE_PATHS = [
  "src/lib/verify/w20-final-evidence-browser-verify.test.ts",
] as const;

export const W20_FINAL_EVIDENCE_REQUIRED_TEST_PATHS =
  W20_FINAL_EVIDENCE_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_FINAL_EVIDENCE_SUITE_COMMAND = "make test-w20-final-evidence";

export type W20FinalEvidenceEvaluation = {
  ok: boolean;
  coveredFamilies: W20FinalEvidenceGateFamily[];
  missingFamilies: W20FinalEvidenceGateFamily[];
  upstreamScopeViolations: string[];
  emptyPointers: string[];
  reasons: string[];
};

/**
 * Pure completeness check for the final evidence catalog + upstream follow-ups.
 */
export function evaluateFinalEvidenceConvergence(): W20FinalEvidenceEvaluation {
  const covered = new Set<W20FinalEvidenceGateFamily>(
    W20_FINAL_EVIDENCE_ENTRIES.map((entry) => entry.family),
  );
  const missingFamilies = W20_FINAL_EVIDENCE_REQUIRED_FAMILIES.filter(
    (family) => !covered.has(family),
  );
  const emptyPointers: string[] = [];
  for (const entry of W20_FINAL_EVIDENCE_ENTRIES) {
    if (entry.command.trim() === "") {
      emptyPointers.push(`${entry.family}: empty command`);
    }
    if (entry.evidencePath.trim() === "") {
      emptyPointers.push(`${entry.family}: empty evidencePath`);
    }
  }

  const allowedScopes = new Set<string>(W20_UPSTREAM_FOLLOW_UP_ALLOWED_SCOPES);
  const upstreamScopeViolations: string[] = [];
  for (const followUp of W20_UPSTREAM_FOLLOW_UPS) {
    if (!allowedScopes.has(followUp.scope)) {
      upstreamScopeViolations.push(
        `${followUp.id}: scope "${followUp.scope}" is not an allowed W20 upstream follow-up`,
      );
    }
    // Read through a widened view so empty-exampleDefs stays a runtime guard
    // even when the locked catalog literals always include names.
    const exampleDefs: readonly string[] = followUp.exampleDefs;
    if (exampleDefs.length === 0) {
      upstreamScopeViolations.push(
        `${followUp.id}: exampleDefs must name documented defs (do not invent schemas)`,
      );
    }
  }

  const reasons = [
    ...missingFamilies.map(
      (family) => `missing evidence for gate family ${family}`,
    ),
    ...emptyPointers,
    ...upstreamScopeViolations,
  ];

  return {
    ok: reasons.length === 0,
    coveredFamilies: [...covered].sort() as W20FinalEvidenceGateFamily[],
    missingFamilies: [...missingFamilies],
    upstreamScopeViolations,
    emptyPointers,
    reasons,
  };
}

export function listW20FinalEvidenceCoveredFamilies(): W20FinalEvidenceGateFamily[] {
  const covered = new Set<W20FinalEvidenceGateFamily>();
  for (const entry of W20_FINAL_EVIDENCE_ENTRIES) {
    covered.add(entry.family);
  }
  for (const gate of W20_FINAL_EVIDENCE_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  return [...covered].sort() as W20FinalEvidenceGateFamily[];
}
