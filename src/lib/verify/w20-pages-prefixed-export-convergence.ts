/**
 * W20 story 007: Pages-prefixed export and deployed-artifact guard.
 *
 * Owns the reviewer-followable inventory of
 * `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build` followed
 * immediately by `make guard-pages-deployed-artifact` on the same `out/`.
 * Does not redesign product IA, nav, search, or renderer ownership.
 */

import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  PAGES_DEPLOYED_ARTIFACT_PROBE_NAV_HREFS,
  PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES,
} from "@/lib/build/guard-pages-deployed-artifact";

export type W20PagesPrefixedGateFamily =
  | "pages-prefixed-rebuild"
  | "deployed-artifact-guard"
  | "search-bootstrap-prefix"
  | "css-js-asset-prefix"
  | "probe-inventory"
  | "deploy-pages-workflow";

export type W20PagesPrefixedCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** package.json script invoked by the Makefile target. */
  packageScript: string;
  /**
   * Env vars required for this gate. Prefixed rebuild must set
   * `GITHUB_PAGES_BASE_PATH`; the guard reuses that same `out/` and uses an
   * empty env map (always present so `as const` unions stay readable).
   */
  env: Readonly<Record<string, string>>;
  families: readonly W20PagesPrefixedGateFamily[];
};

export type W20PagesPrefixedSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / Pages convergence. */
  families: readonly W20PagesPrefixedGateFamily[];
};

/** Canonical project-site base path for Pages-prefixed export. */
export const W20_PAGES_PREFIXED_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;

/**
 * Maintainer command gates: prefixed rebuild then deployed-artifact guard
 * against that same `out/` (no intervening unprefixed rebuild).
 */
export const W20_PAGES_PREFIXED_COMMAND_GATES = [
  {
    makeTarget: "build",
    packageScript: "build:export",
    env: {
      GITHUB_PAGES_BASE_PATH: W20_PAGES_PREFIXED_BASE_PATH,
    },
    families: ["pages-prefixed-rebuild"],
  },
  {
    makeTarget: "guard-pages-deployed-artifact",
    packageScript: "guard:pages-deployed-artifact",
    env: {},
    families: [
      "deployed-artifact-guard",
      "search-bootstrap-prefix",
      "css-js-asset-prefix",
      "probe-inventory",
    ],
  },
] as const satisfies readonly W20PagesPrefixedCommandGate[];

/**
 * Focused suites catalogued for reviewer evidence. The live gate is the
 * prefixed rebuild + guard sequence; these suites lock the probe inventory,
 * evaluation helpers, and deploy-pages.yml contract without inventing a
 * second Pages export pipeline.
 */
export const W20_PAGES_PREFIXED_SUITE_ENTRIES = [
  {
    path: "src/lib/verify/pages-prefixed-rebuild-r02-convergence.test.ts",
    families: [
      "pages-prefixed-rebuild",
      "deployed-artifact-guard",
      "search-bootstrap-prefix",
      "css-js-asset-prefix",
      "probe-inventory",
    ],
  },
  {
    path: "src/lib/build/guard-pages-deployed-artifact.test.ts",
    families: [
      "deployed-artifact-guard",
      "search-bootstrap-prefix",
      "css-js-asset-prefix",
      "probe-inventory",
    ],
  },
  {
    path: "src/lib/build/deploy-pages-workflow-contract.test.ts",
    families: ["deploy-pages-workflow", "pages-prefixed-rebuild"],
  },
  {
    path: "src/lib/build/verify-export-base-path.test.ts",
    families: ["css-js-asset-prefix", "pages-prefixed-rebuild"],
  },
  {
    path: "src/lib/build/verify-project-site-export-consumers.test.ts",
    families: [
      "search-bootstrap-prefix",
      "css-js-asset-prefix",
      "pages-prefixed-rebuild",
    ],
  },
  {
    path: "src/lib/verify/w20-pages-prefixed-export-out-verify.test.ts",
    families: [
      "pages-prefixed-rebuild",
      "deployed-artifact-guard",
      "search-bootstrap-prefix",
      "css-js-asset-prefix",
    ],
  },
] as const satisfies readonly W20PagesPrefixedSuiteEntry[];

/**
 * Suites the W20 runner executes after the prefixed rebuild + guard.
 * Requires a trusted project-site `out/` from the command gates.
 */
export const W20_PAGES_PREFIXED_POST_COMMAND_SUITE_PATHS = [
  "src/lib/verify/pages-prefixed-rebuild-r02-convergence.test.ts",
  "src/lib/build/guard-pages-deployed-artifact.test.ts",
  "src/lib/build/deploy-pages-workflow-contract.test.ts",
  "src/lib/build/verify-export-base-path.test.ts",
  "src/lib/build/verify-project-site-export-consumers.test.ts",
  "src/lib/verify/w20-pages-prefixed-export-out-verify.test.ts",
] as const;

/** Representative probe routes the Pages guard must cover (home + docs + blog). */
export const W20_PAGES_PREFIXED_REQUIRED_PROBE_ROUTES =
  PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES;

/** Navigation hrefs that must stay under the project-site prefix. */
export const W20_PAGES_PREFIXED_REQUIRED_PROBE_NAV_HREFS =
  PAGES_DEPLOYED_ARTIFACT_PROBE_NAV_HREFS;

export const W20_PAGES_PREFIXED_REQUIRED_TEST_PATHS =
  W20_PAGES_PREFIXED_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_PAGES_PREFIXED_REQUIRED_FAMILIES = [
  "pages-prefixed-rebuild",
  "deployed-artifact-guard",
  "search-bootstrap-prefix",
  "css-js-asset-prefix",
  "probe-inventory",
  "deploy-pages-workflow",
] as const satisfies readonly W20PagesPrefixedGateFamily[];

export const W20_PAGES_PREFIXED_SUITE_COMMAND =
  "make test-w20-pages-prefixed-export";

/**
 * Maintainer reproduction of the live Pages-prefixed gate sequence.
 * Guard must run immediately against the same `out/` — no intervening
 * unprefixed `make build`.
 */
export const W20_PAGES_PREFIXED_LIVE_GATE_COMMANDS = [
  `GITHUB_PAGES_BASE_PATH=${W20_PAGES_PREFIXED_BASE_PATH} make build`,
  "make guard-pages-deployed-artifact",
] as const;

export function listW20PagesPrefixedCoveredFamilies(): W20PagesPrefixedGateFamily[] {
  const covered = new Set<W20PagesPrefixedGateFamily>();
  for (const gate of W20_PAGES_PREFIXED_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  for (const entry of W20_PAGES_PREFIXED_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
