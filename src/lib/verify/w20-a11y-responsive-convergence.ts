/**
 * W20 story 005: accessibility / responsive / focused-payload-budget convergence
 * catalog.
 *
 * Owns the reviewer-followable inventory of `make a11y` and W19 representative
 * reference-surface proofs that must stay green on the post-W19 tip. Focused
 * reference payload budgets remain enforced here; total-site budget close-out
 * is story 008. Does not redesign W19 harness ownership.
 */

import { REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS } from "./a11y-reference-payload-budget";
import {
  getReferenceSurfaceViewport,
  REFERENCE_SURFACE_ROUTES,
} from "./a11y-reference-surface-contract";

export type W20A11yResponsiveGateFamily =
  | "critical-route-a11y"
  | "reference-surface-contract"
  | "reference-responsive-overflow"
  | "reference-keyboard"
  | "reference-screen-reader"
  | "reference-hash-focus"
  | "reference-copy-announcements"
  | "reference-reduced-motion"
  | "reference-long-token-overflow"
  | "reference-no-js-html"
  | "reference-browser-closeout"
  | "focused-reference-payload-budgets"
  | "narrow-keyboard-browser-path";

export type W20A11yResponsiveCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** package.json script invoked by the Makefile target. */
  packageScript: string;
  families: readonly W20A11yResponsiveGateFamily[];
};

export type W20A11yResponsiveSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / FR convergence. */
  families: readonly W20A11yResponsiveGateFamily[];
};

/**
 * Maintainer command gate: full a11y / responsive / W19 reference-surface suite.
 */
export const W20_A11Y_RESPONSIVE_COMMAND_GATES = [
  {
    makeTarget: "a11y",
    packageScript: "test:a11y",
    families: [
      "critical-route-a11y",
      "reference-surface-contract",
      "reference-responsive-overflow",
      "reference-keyboard",
      "reference-screen-reader",
      "reference-hash-focus",
      "reference-copy-announcements",
      "reference-reduced-motion",
      "reference-long-token-overflow",
      "reference-no-js-html",
      "reference-browser-closeout",
      "focused-reference-payload-budgets",
    ],
  },
] as const satisfies readonly W20A11yResponsiveCommandGate[];

/**
 * Focused W19 / W20 suites catalogued for reviewer evidence. `make a11y` already
 * runs the always-on set; the W20 binder re-runs only the browser-path proof
 * after the command gate so convergence does not double the full a11y matrix.
 */
export const W20_A11Y_RESPONSIVE_SUITE_ENTRIES = [
  {
    path: "src/lib/verify/a11y-reference-surface-contract.test.ts",
    families: ["reference-surface-contract"],
  },
  {
    path: "src/lib/verify/a11y-reference-payload-budget.test.ts",
    families: ["focused-reference-payload-budgets"],
  },
  {
    path: "src/lib/verify/a11y-reference-keyboard-contract.test.ts",
    families: ["reference-keyboard"],
  },
  {
    path: "src/tests/a11y/reference-responsive-overflow.a11y.test.tsx",
    families: ["reference-responsive-overflow"],
  },
  {
    path: "src/tests/a11y/reference-keyboard-navigation.a11y.test.tsx",
    families: ["reference-keyboard"],
  },
  {
    path: "src/lib/verify/a11y-reference-screen-reader-contract.test.ts",
    families: ["reference-screen-reader"],
  },
  {
    path: "src/lib/verify/a11y-reference-hash-focus-contract.test.ts",
    families: ["reference-hash-focus"],
  },
  {
    path: "src/lib/verify/a11y-reference-copy-announcement-contract.test.ts",
    families: ["reference-copy-announcements"],
  },
  {
    path: "src/lib/verify/a11y-reference-reduced-motion-contract.test.ts",
    families: ["reference-reduced-motion"],
  },
  {
    path: "src/lib/verify/a11y-reference-long-token-overflow-contract.test.ts",
    families: ["reference-long-token-overflow"],
  },
  {
    path: "src/lib/verify/a11y-reference-no-js-html-contract.test.ts",
    families: ["reference-no-js-html"],
  },
  {
    path: "src/lib/verify/a11y-reference-browser-closeout-contract.test.ts",
    families: ["reference-browser-closeout"],
  },
  {
    path: "src/lib/verify/a11y-responsive-contract.test.ts",
    families: ["critical-route-a11y"],
  },
  {
    path: "src/lib/verify/w20-a11y-responsive-browser-verify.test.tsx",
    families: ["narrow-keyboard-browser-path", "reference-keyboard"],
  },
] as const satisfies readonly W20A11yResponsiveSuiteEntry[];

/**
 * Suites the W20 runner executes after `make a11y` (not already fully covered
 * as a distinct W20 browser-path acceptance proof).
 */
export const W20_A11Y_RESPONSIVE_POST_COMMAND_SUITE_PATHS = [
  "src/lib/verify/w20-a11y-responsive-browser-verify.test.tsx",
] as const;

export const W20_A11Y_RESPONSIVE_REQUIRED_TEST_PATHS =
  W20_A11Y_RESPONSIVE_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_A11Y_RESPONSIVE_REQUIRED_FAMILIES = [
  "critical-route-a11y",
  "reference-surface-contract",
  "reference-responsive-overflow",
  "reference-keyboard",
  "reference-screen-reader",
  "reference-hash-focus",
  "reference-copy-announcements",
  "reference-reduced-motion",
  "reference-long-token-overflow",
  "reference-no-js-html",
  "reference-browser-closeout",
  "focused-reference-payload-budgets",
  "narrow-keyboard-browser-path",
] as const satisfies readonly W20A11yResponsiveGateFamily[];

/**
 * Representative surface + narrow layout used for the W20 browser-path
 * acceptance: usable at narrow width with keyboard focus visible on a primary
 * control. Reuses W19 route / viewport ids — do not hard-code widths.
 */
export const W20_A11Y_RESPONSIVE_BROWSER_VERIFY = {
  routeId: "references-api" as const,
  routePath: REFERENCE_SURFACE_ROUTES.find(
    (route) => route.id === "references-api",
  )?.path,
  viewportId: "mobile" as const,
  /** Primary keyboard control on the API representative surface. */
  primaryControlSelector: '[data-api-operation-filter="input"]',
  primaryControlLabel: "API operation filter input",
} as const;

export function getW20A11yResponsiveBrowserVerifyViewport(): {
  id: string;
  label: string;
  width: number;
  height: number;
} {
  const viewport = getReferenceSurfaceViewport(
    W20_A11Y_RESPONSIVE_BROWSER_VERIFY.viewportId,
  );
  if (!viewport || viewport.id !== "mobile") {
    throw new Error(
      `Missing W19 mobile viewport for W20 browser verify: ${W20_A11Y_RESPONSIVE_BROWSER_VERIFY.viewportId}`,
    );
  }
  return viewport;
}

/**
 * Focused W19 payload budget routes that must remain catalogued (total-site
 * budget is intentionally out of scope for story 005 / owned by story 008).
 */
export const W20_A11Y_RESPONSIVE_FOCUSED_PAYLOAD_BUDGET_ROUTE_IDS =
  REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS;

export const W20_A11Y_RESPONSIVE_SUITE_COMMAND =
  "make test-w20-a11y-responsive";

export function listW20A11yResponsiveCoveredFamilies(): W20A11yResponsiveGateFamily[] {
  const covered = new Set<W20A11yResponsiveGateFamily>();
  for (const gate of W20_A11Y_RESPONSIVE_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  for (const entry of W20_A11Y_RESPONSIVE_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
