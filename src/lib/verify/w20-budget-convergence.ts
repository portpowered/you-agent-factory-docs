/**
 * W20 story 008: total-site and reference payload budget convergence.
 *
 * Owns the reviewer-followable inventory of `make budget` (total-site export
 * ceilings plus W19 focused API/events/factory-schema page payloads) on the
 * post-W19 tip. Does not silently raise `FACTORY_EXPORTED_SITE_BUDGET_BASELINES`
 * or redesign W19 harness ownership.
 */

import { FACTORY_EXPORTED_SITE_BUDGET_BASELINES } from "@/lib/build/exported-site-budget";
import {
  REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS,
  REFERENCE_PAYLOAD_PAGE_BUDGETS,
} from "./a11y-reference-payload-budget";

export type W20BudgetGateFamily =
  | "total-site-exported-budget"
  | "focused-reference-payload-budgets"
  | "budget-baseline-inventory"
  | "trusted-out-measurement";

export type W20BudgetCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** package.json script invoked by the Makefile target. */
  packageScript: string;
  /**
   * Env vars required for this gate. Budget reuses a trusted `out/` from a
   * prior `make build` and uses an empty env map (always present so `as const`
   * unions stay readable).
   */
  env: Readonly<Record<string, string>>;
  families: readonly W20BudgetGateFamily[];
};

export type W20BudgetSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / budget convergence. */
  families: readonly W20BudgetGateFamily[];
};

/**
 * Maintainer command gate: total-site + focused reference payload budgets
 * against a trusted `out/` (CI / prior story runs `make build` first).
 */
export const W20_BUDGET_COMMAND_GATES = [
  {
    makeTarget: "budget",
    packageScript: "budget",
    env: {},
    families: [
      "total-site-exported-budget",
      "focused-reference-payload-budgets",
      "trusted-out-measurement",
    ],
  },
] as const satisfies readonly W20BudgetCommandGate[];

/**
 * Focused suites catalogued for reviewer evidence. The live gate is
 * `make budget`; these suites lock baselines, fixture evaluation, and a live
 * `out/` verify without inventing a second budget pipeline.
 */
export const W20_BUDGET_SUITE_ENTRIES = [
  {
    path: "src/lib/build/exported-site-budget.test.ts",
    families: [
      "total-site-exported-budget",
      "budget-baseline-inventory",
      "trusted-out-measurement",
    ],
  },
  {
    path: "src/lib/verify/a11y-reference-payload-budget.test.ts",
    families: [
      "focused-reference-payload-budgets",
      "budget-baseline-inventory",
      "trusted-out-measurement",
    ],
  },
  {
    path: "src/lib/verify/w20-budget-out-verify.test.ts",
    families: [
      "total-site-exported-budget",
      "focused-reference-payload-budgets",
      "trusted-out-measurement",
    ],
  },
] as const satisfies readonly W20BudgetSuiteEntry[];

/**
 * Suites the W20 runner executes after `make budget`.
 * Requires a trusted `out/` from a prior static export.
 */
export const W20_BUDGET_POST_COMMAND_SUITE_PATHS = [
  "src/lib/build/exported-site-budget.test.ts",
  "src/lib/verify/a11y-reference-payload-budget.test.ts",
  "src/lib/verify/w20-budget-out-verify.test.ts",
] as const;

/** Focused W19 heavy surfaces that must remain under per-page ceilings. */
export const W20_BUDGET_FOCUSED_PAYLOAD_ROUTE_IDS =
  REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS;

/** Focused page budget inventory (HTML + attributable JS ceilings). */
export const W20_BUDGET_FOCUSED_PAYLOAD_PAGE_BUDGETS =
  REFERENCE_PAYLOAD_PAGE_BUDGETS;

/** Total-site ceilings locked for convergence (raise only with evidence). */
export const W20_BUDGET_TOTAL_SITE_BASELINES =
  FACTORY_EXPORTED_SITE_BUDGET_BASELINES;

export const W20_BUDGET_REQUIRED_TEST_PATHS = W20_BUDGET_SUITE_ENTRIES.map(
  (entry) => entry.path,
);

export const W20_BUDGET_REQUIRED_FAMILIES = [
  "total-site-exported-budget",
  "focused-reference-payload-budgets",
  "budget-baseline-inventory",
  "trusted-out-measurement",
] as const satisfies readonly W20BudgetGateFamily[];

export const W20_BUDGET_SUITE_COMMAND = "make test-w20-budget";

/**
 * Maintainer reproduction of the live budget gate sequence.
 * Budget reuses `out/` — run an unprefixed `make build` first when `out/` is
 * missing or stale (CI already does this before `make budget`).
 */
export const W20_BUDGET_LIVE_GATE_COMMANDS = [
  "make build",
  "make budget",
] as const;

export function listW20BudgetCoveredFamilies(): W20BudgetGateFamily[] {
  const covered = new Set<W20BudgetGateFamily>();
  for (const gate of W20_BUDGET_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  for (const entry of W20_BUDGET_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
