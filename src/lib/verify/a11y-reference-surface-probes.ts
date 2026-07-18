/**
 * W19 probe helpers that bind representative reference surfaces to the
 * existing a11y / responsive / reduced-motion / page-session harnesses.
 *
 * Do not invent parallel axe, overflow, motion, or session frameworks — re-use
 * the critical-route modules and pass contract viewports/paths through.
 */

import { expectNoSeriousAxeViolations, runAxeOnElement } from "./a11y-axe";
import {
  evaluateReducedMotionChromeInBrowser,
  isEffectivelyInstantMotion,
  probeMotionDurationsFromStyle,
  REDUCED_MOTION_CHROME_SELECTOR,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
} from "./a11y-reduced-motion";
import {
  getReferenceSurfaceRoute,
  getReferenceSurfaceViewport,
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  listReferenceOverflowMatrixCases,
  PAGE_OVERFLOW_TOLERANCE_PX,
  type ReferenceSurfaceRoute,
  type ReferenceSurfaceRouteId,
  type ReferenceSurfaceViewport,
} from "./a11y-reference-surface-contract";
import {
  type A11yResponsiveBrowserSession,
  type A11yResponsiveBrowserSessionOptions,
  type A11yResponsivePageProbeOptions,
  type A11yResponsivePageProbeSession,
  openA11yResponsiveBrowserSession,
  openA11yResponsivePageProbe,
  resolveA11yResponsiveProbeUrl,
} from "./a11y-responsive-page-session";
import {
  collectResponsiveOverflowProbe,
  type DocumentLike,
  evaluateResponsiveOverflowInBrowser,
  findIntentionalHorizontalScrollContainers,
  measurePageLevelOverflow,
  pageOverflowAllowsIntentionalScrollers,
  type ResponsiveOverflowProbeResult,
} from "./a11y-responsive-probes";

export {
  collectResponsiveOverflowProbe,
  evaluateReducedMotionChromeInBrowser,
  evaluateResponsiveOverflowInBrowser,
  expectNoSeriousAxeViolations,
  findIntentionalHorizontalScrollContainers,
  isEffectivelyInstantMotion,
  measurePageLevelOverflow,
  openA11yResponsiveBrowserSession,
  openA11yResponsivePageProbe,
  pageOverflowAllowsIntentionalScrollers,
  probeMotionDurationsFromStyle,
  REDUCED_MOTION_CHROME_SELECTOR,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
  resolveA11yResponsiveProbeUrl,
  runAxeOnElement,
};

/** Shared overflow args for Playwright `page.evaluate` on reference surfaces. */
export function referenceSurfaceOverflowEvaluateArgs(): {
  selectors: readonly string[];
  tolerancePx: number;
} {
  return {
    selectors: INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
    tolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
  };
}

/**
 * Runs the shared page-level overflow probe with the W19 intentional-scroller
 * contract defaults.
 */
export function collectReferenceSurfaceOverflowProbe(
  doc: DocumentLike,
  root: ParentNode,
): ResponsiveOverflowProbeResult {
  return collectResponsiveOverflowProbe(
    doc,
    root,
    INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
    PAGE_OVERFLOW_TOLERANCE_PX,
  );
}

/**
 * Opens one representative reference route at a contracted W19 viewport using
 * the existing page-session helper (verify server + Playwright Chromium).
 */
export async function openReferenceSurfacePageProbe(options: {
  routeId: ReferenceSurfaceRouteId;
  viewportId: ReferenceSurfaceViewport["id"];
  basePath?: string;
  projectRoot?: string;
  verifySession?: A11yResponsivePageProbeOptions["verifySession"];
  pageGotoTimeoutMs?: number;
}): Promise<A11yResponsivePageProbeSession> {
  const route = getReferenceSurfaceRoute(options.routeId);
  const viewport = getReferenceSurfaceViewport(options.viewportId);
  if (!route) {
    throw new Error(`Unknown reference surface route: ${options.routeId}`);
  }
  if (!viewport) {
    throw new Error(
      `Unknown reference surface viewport: ${options.viewportId}`,
    );
  }

  return openA11yResponsivePageProbe({
    path: route.path,
    viewport: { width: viewport.width, height: viewport.height },
    basePath: options.basePath,
    projectRoot: options.projectRoot,
    verifySession: options.verifySession,
    pageGotoTimeoutMs: options.pageGotoTimeoutMs,
  });
}

/**
 * One verify server + Chromium for iterating the W19 reference overflow matrix.
 */
export async function openReferenceSurfaceBrowserSession(
  options: A11yResponsiveBrowserSessionOptions = {},
): Promise<A11yResponsiveBrowserSession> {
  return openA11yResponsiveBrowserSession(options);
}

export type ReferenceSurfaceProbeBinding = {
  route: ReferenceSurfaceRoute;
  viewport: ReferenceSurfaceViewport;
  /** Documented harness entrypoints later stories should call. */
  harness: {
    overflow: "collectReferenceSurfaceOverflowProbe";
    axe: "expectNoSeriousAxeViolations";
    reducedMotion: "evaluateReducedMotionChromeInBrowser";
    pageSession: "openReferenceSurfacePageProbe";
  };
};

/**
 * Enumerates route × viewport bindings with the shared harness names so later
 * W19 stories stay on one contract instead of inventing parallel frameworks.
 */
export function listReferenceSurfaceProbeBindings(): ReferenceSurfaceProbeBinding[] {
  return listReferenceOverflowMatrixCases().map(({ route, viewport }) => ({
    route,
    viewport,
    harness: {
      overflow: "collectReferenceSurfaceOverflowProbe",
      axe: "expectNoSeriousAxeViolations",
      reducedMotion: "evaluateReducedMotionChromeInBrowser",
      pageSession: "openReferenceSurfacePageProbe",
    },
  }));
}

/**
 * Hash-focus scroll behavior for reference surfaces. Matches the API W08
 * contract (`auto` when reduced motion is preferred, otherwise `smooth`)
 * without importing the components-layer helper into verify/.
 */
export function referenceHashFocusScrollBehavior(
  reduceMotion: boolean,
): ScrollBehavior {
  return reduceMotion ? "auto" : "smooth";
}
