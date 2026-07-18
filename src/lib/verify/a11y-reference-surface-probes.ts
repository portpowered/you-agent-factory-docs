/**
 * W19 probe helpers that bind representative reference surfaces to the
 * existing a11y / responsive / reduced-motion / page-session harnesses.
 *
 * Do not invent parallel axe, overflow, motion, or session frameworks — re-use
 * the critical-route modules and pass contract viewports/paths through.
 */

import { expectNoSeriousAxeViolations, runAxeOnElement } from "./a11y-axe";
import {
  evaluateReferenceCopyAnnouncementsInBrowser,
  expectReferenceCopyAnnouncementChrome,
  expectReferenceCopyAnnouncements,
  listReferenceCopyAnnouncementsForRoute,
  listRequiredReferenceCopyAnnouncements,
  probeReferenceCopyAnnouncement,
  probeReferenceCopyAnnouncementChrome,
  probeReferenceCopyAnnouncementsForRoute,
  REFERENCE_COPY_ANNOUNCEMENTS,
  type ReferenceCopyAnnouncementChromeProbe,
  type ReferenceCopyAnnouncementKind,
  type ReferenceCopyAnnouncementProbe,
  type ReferenceCopyAnnouncementSpec,
  referenceCopyAnnouncementEvaluateArgs,
} from "./a11y-reference-copy-announcement-contract";
import {
  collectStickyChromeRects,
  expectReferenceHashFocus,
  expectReferenceHashFocusAndMobileCollapse,
  expectReferenceMobileNav,
  focusReferenceHashTarget,
  hasReferenceHashScrollMargin,
  isHashTargetFullyObscuredBySticky,
  listReferenceHashTargetsForRoute,
  listReferenceMobileNavsForRoute,
  listRequiredReferenceHashTargets,
  listRequiredReferenceMobileNavs,
  probeReferenceMobileNav,
  probeReferenceStickyVisibility,
  REFERENCE_HASH_TARGETS,
  REFERENCE_MOBILE_NAVS,
  REFERENCE_STICKY_CHROME_SELECTOR,
  type ReferenceHashFocusResult,
  type ReferenceHashTargetSpec,
  type ReferenceMobileNavProbe,
  type ReferenceMobileNavSpec,
  type ReferenceStickyVisibilityProbe,
} from "./a11y-reference-hash-focus-contract";
import {
  expectReferenceKeyboardChrome,
  hasReferenceVisibleFocusRingClass,
  isKeyboardFocusableElement,
  isPointerOnlyInteractiveElement,
  listReferenceKeyboardControlsForRoute,
  listRequiredReferenceKeyboardControls,
  probeReferenceKeyboardControl,
  probeReferenceKeyboardControlsForRoute,
  REFERENCE_KEYBOARD_CONTROLS,
  type ReferenceKeyboardControlProbe,
  type ReferenceKeyboardControlSpec,
} from "./a11y-reference-keyboard-contract";
import {
  evaluateReducedMotionChromeInBrowser,
  evaluateReferenceReducedMotionInBrowser,
  expectReferenceReducedMotionChrome,
  expectReferenceReducedMotionHashFocus,
  isEffectivelyInstantMotion,
  listReferenceMotionChromeForRoute,
  listRequiredReferenceMotionChrome,
  MOBILE_DRAWER_MOTION_CHROME,
  probeMotionDurationsFromStyle,
  probeReferenceMotionChrome,
  probeReferenceReducedMotionHashFocus,
  REDUCED_MOTION_CHROME_SELECTOR,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
  REFERENCE_MOTION_CHROME,
  REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS,
  type ReferenceMotionChromeProbe,
  type ReferenceMotionChromeSpec,
  type ReferenceReducedMotionEvaluateResult,
  type ReferenceReducedMotionHashProbe,
  referenceHashFocusScrollBehavior,
  referenceReducedMotionEvaluateArgs,
} from "./a11y-reference-reduced-motion-contract";
import {
  accessibleNameOf,
  expectCoherentReferenceHeadingHierarchy,
  expectReferenceLabeledChrome,
  expectReferenceNonColorStatus,
  expectReferenceScreenReaderChrome,
  listReferenceLabeledControlsForRoute,
  listReferenceNonColorStatusForRoute,
  listRequiredReferenceLabeledControls,
  listRequiredReferenceNonColorStatus,
  probeReferenceHeadingHierarchy,
  probeReferenceLabeledControl,
  probeReferenceNonColorStatus,
  REFERENCE_LABELED_CONTROLS,
  REFERENCE_NON_COLOR_STATUS,
  type ReferenceHeadingHierarchyProbe,
  type ReferenceLabeledControlProbe,
  type ReferenceLabeledControlSpec,
  type ReferenceNonColorStatusProbe,
  type ReferenceNonColorStatusSpec,
} from "./a11y-reference-screen-reader-contract";
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

export type {
  ReferenceCopyAnnouncementChromeProbe,
  ReferenceCopyAnnouncementKind,
  ReferenceCopyAnnouncementProbe,
  ReferenceCopyAnnouncementSpec,
  ReferenceHashFocusResult,
  ReferenceHashTargetSpec,
  ReferenceHeadingHierarchyProbe,
  ReferenceKeyboardControlProbe,
  ReferenceKeyboardControlSpec,
  ReferenceLabeledControlProbe,
  ReferenceLabeledControlSpec,
  ReferenceMobileNavProbe,
  ReferenceMobileNavSpec,
  ReferenceMotionChromeProbe,
  ReferenceMotionChromeSpec,
  ReferenceNonColorStatusProbe,
  ReferenceNonColorStatusSpec,
  ReferenceReducedMotionEvaluateResult,
  ReferenceReducedMotionHashProbe,
  ReferenceStickyVisibilityProbe,
};
export {
  accessibleNameOf,
  collectResponsiveOverflowProbe,
  collectStickyChromeRects,
  evaluateReducedMotionChromeInBrowser,
  evaluateReferenceCopyAnnouncementsInBrowser,
  evaluateReferenceReducedMotionInBrowser,
  evaluateResponsiveOverflowInBrowser,
  expectCoherentReferenceHeadingHierarchy,
  expectNoSeriousAxeViolations,
  expectReferenceCopyAnnouncementChrome,
  expectReferenceCopyAnnouncements,
  expectReferenceHashFocus,
  expectReferenceHashFocusAndMobileCollapse,
  expectReferenceKeyboardChrome,
  expectReferenceLabeledChrome,
  expectReferenceMobileNav,
  expectReferenceNonColorStatus,
  expectReferenceReducedMotionChrome,
  expectReferenceReducedMotionHashFocus,
  expectReferenceScreenReaderChrome,
  findIntentionalHorizontalScrollContainers,
  focusReferenceHashTarget,
  hasReferenceHashScrollMargin,
  hasReferenceVisibleFocusRingClass,
  isEffectivelyInstantMotion,
  isHashTargetFullyObscuredBySticky,
  isKeyboardFocusableElement,
  isPointerOnlyInteractiveElement,
  listReferenceCopyAnnouncementsForRoute,
  listReferenceHashTargetsForRoute,
  listReferenceKeyboardControlsForRoute,
  listReferenceLabeledControlsForRoute,
  listReferenceMobileNavsForRoute,
  listReferenceMotionChromeForRoute,
  listReferenceNonColorStatusForRoute,
  listRequiredReferenceCopyAnnouncements,
  listRequiredReferenceHashTargets,
  listRequiredReferenceKeyboardControls,
  listRequiredReferenceLabeledControls,
  listRequiredReferenceMobileNavs,
  listRequiredReferenceMotionChrome,
  listRequiredReferenceNonColorStatus,
  MOBILE_DRAWER_MOTION_CHROME,
  measurePageLevelOverflow,
  openA11yResponsiveBrowserSession,
  openA11yResponsivePageProbe,
  pageOverflowAllowsIntentionalScrollers,
  probeMotionDurationsFromStyle,
  probeReferenceCopyAnnouncement,
  probeReferenceCopyAnnouncementChrome,
  probeReferenceCopyAnnouncementsForRoute,
  probeReferenceHeadingHierarchy,
  probeReferenceKeyboardControl,
  probeReferenceKeyboardControlsForRoute,
  probeReferenceLabeledControl,
  probeReferenceMobileNav,
  probeReferenceMotionChrome,
  probeReferenceNonColorStatus,
  probeReferenceReducedMotionHashFocus,
  probeReferenceStickyVisibility,
  REDUCED_MOTION_CHROME_SELECTOR,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
  REFERENCE_COPY_ANNOUNCEMENTS,
  REFERENCE_HASH_TARGETS,
  REFERENCE_KEYBOARD_CONTROLS,
  REFERENCE_LABELED_CONTROLS,
  REFERENCE_MOBILE_NAVS,
  REFERENCE_MOTION_CHROME,
  REFERENCE_NON_COLOR_STATUS,
  REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS,
  REFERENCE_STICKY_CHROME_SELECTOR,
  referenceCopyAnnouncementEvaluateArgs,
  referenceHashFocusScrollBehavior,
  referenceReducedMotionEvaluateArgs,
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
    keyboard: "expectReferenceKeyboardChrome";
    screenReader: "expectReferenceScreenReaderChrome";
    hashFocus: "expectReferenceHashFocusAndMobileCollapse";
    copyAnnouncement: "expectReferenceCopyAnnouncements";
    reducedMotion: "evaluateReferenceReducedMotionInBrowser";
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
      keyboard: "expectReferenceKeyboardChrome",
      screenReader: "expectReferenceScreenReaderChrome",
      hashFocus: "expectReferenceHashFocusAndMobileCollapse",
      copyAnnouncement: "expectReferenceCopyAnnouncements",
      reducedMotion: "evaluateReferenceReducedMotionInBrowser",
      pageSession: "openReferenceSurfacePageProbe",
    },
  }));
}

/**
 * Playwright `page.evaluate` helper: probe keyboard chrome using control specs
 * passed as plain args (no Node-module closures — Playwright serializes the
 * function into the browser).
 */
export function evaluateReferenceKeyboardChromeInBrowser(args: {
  controls: ReadonlyArray<{
    id: string;
    selector: string;
    label: string;
    required: boolean;
  }>;
}): {
  ok: boolean;
  error: string | null;
  probes: Array<{
    id: string;
    label: string;
    required: boolean;
    found: boolean;
    hitCount: number;
    allHitsKeyboardFocusable: boolean;
    allHitsHaveFocusRing: boolean;
    pointerOnlyHitCount: number;
  }>;
} {
  const nativeFocusable = new Set([
    "a",
    "button",
    "input",
    "select",
    "textarea",
    "summary",
  ]);

  function isFocusable(element: Element): boolean {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (element.hasAttribute("disabled")) {
      return false;
    }
    const tag = element.tagName.toLowerCase();
    if (tag === "a") {
      return element.hasAttribute("href");
    }
    if (nativeFocusable.has(tag)) {
      return true;
    }
    const tabIndex = element.getAttribute("tabindex");
    if (tabIndex === null || tabIndex === "") {
      return false;
    }
    const parsed = Number(tabIndex);
    return Number.isFinite(parsed) && parsed >= 0;
  }

  function hasFocusRing(className: string): boolean {
    return (
      className.includes("focus-visible:ring") ||
      className.includes("focus-visible:outline")
    );
  }

  const probes = args.controls.map((spec) => {
    const hits = Array.from(document.querySelectorAll(spec.selector));
    const activeHits = hits.filter(
      (hit) => !(hit instanceof HTMLElement && hit.hasAttribute("disabled")),
    );
    let pointerOnlyHitCount = 0;
    let keyboardOk = true;
    let focusRingOk = true;
    for (const hit of activeHits) {
      if (!isFocusable(hit)) {
        keyboardOk = false;
        pointerOnlyHitCount += 1;
      }
      if (!(hit instanceof HTMLElement) || !hasFocusRing(hit.className)) {
        focusRingOk = false;
      }
    }
    return {
      id: spec.id,
      label: spec.label,
      required: spec.required,
      found: hits.length > 0,
      hitCount: hits.length,
      allHitsKeyboardFocusable:
        activeHits.length === 0 ? hits.length > 0 : keyboardOk,
      allHitsHaveFocusRing:
        activeHits.length === 0 ? hits.length > 0 : focusRingOk,
      pointerOnlyHitCount,
    };
  });

  for (const probe of probes) {
    if (!probe.required) {
      if (
        probe.found &&
        (probe.pointerOnlyHitCount > 0 || !probe.allHitsKeyboardFocusable)
      ) {
        return {
          ok: false,
          error: `optional control "${probe.label}" (${probe.id}) is pointer-only / not keyboard focusable`,
          probes,
        };
      }
      if (probe.found && !probe.allHitsHaveFocusRing) {
        return {
          ok: false,
          error: `optional control "${probe.label}" (${probe.id}) is missing a visible focus-visible ring class`,
          probes,
        };
      }
      continue;
    }
    if (!probe.found) {
      return {
        ok: false,
        error: `required keyboard control "${probe.label}" (${probe.id}) was not found`,
        probes,
      };
    }
    if (probe.pointerOnlyHitCount > 0 || !probe.allHitsKeyboardFocusable) {
      return {
        ok: false,
        error: `required control "${probe.label}" (${probe.id}) is pointer-only / not keyboard focusable`,
        probes,
      };
    }
    if (!probe.allHitsHaveFocusRing) {
      return {
        ok: false,
        error: `required control "${probe.label}" (${probe.id}) is missing a visible focus-visible ring class`,
        probes,
      };
    }
  }

  return { ok: true, error: null, probes };
}

/** Plain control args for {@link evaluateReferenceKeyboardChromeInBrowser}. */
export function referenceKeyboardEvaluateArgs(
  routeId: ReferenceSurfaceRouteId,
): {
  controls: Array<{
    id: string;
    selector: string;
    label: string;
    required: boolean;
  }>;
} {
  return {
    controls: listReferenceKeyboardControlsForRoute(routeId).map((spec) => ({
      id: spec.id,
      selector: spec.selector,
      label: spec.label,
      required: spec.required,
    })),
  };
}
