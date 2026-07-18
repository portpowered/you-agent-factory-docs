/**
 * W19 browser close-out evidence contract.
 *
 * Enumerates the route × layout × probe combinations that must be proven in
 * browser (or script-stripped static export for no-JS) before W20 convergence.
 * Extends existing `src/lib/verify/` harnesses — does not invent a parallel
 * framework and does not own W20 static-export/sitemap/canonical/link/search
 * convergence.
 */

import {
  REFERENCE_PAYLOAD_BUDGET_COMMAND,
  REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS,
} from "./a11y-reference-payload-budget";
import {
  A11Y_SUITE_REPRODUCTION_COMMAND,
  getReferenceSurfaceViewport,
  REFERENCE_SURFACE_ROUTE_IDS,
  REFERENCE_SURFACE_ROUTES,
  REFERENCE_SURFACE_VIEWPORT_IDS,
  type ReferenceSurfaceRouteId,
  type ReferenceSurfaceViewportId,
} from "./a11y-reference-surface-contract";

export { A11Y_SUITE_REPRODUCTION_COMMAND, REFERENCE_PAYLOAD_BUDGET_COMMAND };

/**
 * Probe kinds required for W19 close-out. Payload budgets are measurement
 * gates (make budget / focused ceilings), not Playwright DOM probes.
 */
export const REFERENCE_BROWSER_CLOSEOUT_PROBE_KINDS = [
  "overflow",
  "keyboard",
  "hashFocus",
  "copyAnnouncement",
  "reducedMotion",
  "longTokenOverflow",
  "noJsHtml",
  "payloadBudget",
] as const;

export type ReferenceBrowserCloseoutProbeKind =
  (typeof REFERENCE_BROWSER_CLOSEOUT_PROBE_KINDS)[number];

/**
 * Interactive chrome probes that story 011 requires on at least API + events
 * (plus schema when interactive chrome exists).
 */
export const REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS = [
  "references-api",
  "references-events",
  "references-factory-schema",
] as const satisfies readonly ReferenceSurfaceRouteId[];

export type ReferenceBrowserCloseoutInteractiveRouteId =
  (typeof REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS)[number];

/** Representative layouts for interactive close-out probes. */
export const REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_VIEWPORT_IDS = [
  "laptop",
  "mobile",
] as const satisfies readonly ReferenceSurfaceViewportId[];

/** Sticky-obscuring check layouts (desktop + laptop). */
export const REFERENCE_BROWSER_CLOSEOUT_STICKY_VIEWPORT_IDS = [
  "wide",
  "laptop",
] as const satisfies readonly ReferenceSurfaceViewportId[];

/** Long-token overflow focus layouts (narrow phone + zoomed). */
export const REFERENCE_BROWSER_CLOSEOUT_LONG_TOKEN_VIEWPORT_IDS = [
  "mobile",
  "zoomed",
] as const satisfies readonly ReferenceSurfaceViewportId[];

export type ReferenceBrowserCloseoutCase = {
  id: string;
  probeKind: ReferenceBrowserCloseoutProbeKind;
  label: string;
  routeIds: readonly ReferenceSurfaceRouteId[];
  viewportIds: readonly ReferenceSurfaceViewportId[];
  /** Shared harness entrypoint later close-out runners must call. */
  harness: string;
};

/**
 * Fixed close-out evidence matrix. Story tests and opt-in served runners must
 * enumerate these cases (or `listReferenceBrowserCloseoutCases()`) rather than
 * hard-coding divergent paths/widths.
 */
export const REFERENCE_BROWSER_CLOSEOUT_CASES: readonly ReferenceBrowserCloseoutCase[] =
  [
    {
      id: "overflow-matrix",
      probeKind: "overflow",
      label:
        "Page-level overflow across all representative routes × five layouts",
      routeIds: REFERENCE_SURFACE_ROUTE_IDS,
      viewportIds: REFERENCE_SURFACE_VIEWPORT_IDS,
      harness: "evaluateResponsiveOverflowInBrowser",
    },
    {
      id: "keyboard-chrome",
      probeKind: "keyboard",
      label: "Keyboard reachability of reference chrome",
      routeIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS,
      viewportIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_VIEWPORT_IDS,
      harness: "evaluateReferenceKeyboardChromeInBrowser",
    },
    {
      id: "hash-focus-sticky-mobile",
      probeKind: "hashFocus",
      label: "Hash focus visibility, sticky clearance, mobile collapse",
      routeIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS,
      viewportIds: [
        ...REFERENCE_BROWSER_CLOSEOUT_STICKY_VIEWPORT_IDS,
        "mobile",
      ],
      harness: "expectReferenceHashFocusAndMobileCollapse",
    },
    {
      id: "copy-announcements",
      probeKind: "copyAnnouncement",
      label: "Code-copy and deep-link copy status announcements",
      routeIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS,
      viewportIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_VIEWPORT_IDS,
      harness: "evaluateReferenceCopyAnnouncementsInBrowser",
    },
    {
      id: "reduced-motion",
      probeKind: "reducedMotion",
      label: "Reduced-motion hash focus and marked motion chrome",
      routeIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS,
      viewportIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_VIEWPORT_IDS,
      harness: "evaluateReferenceReducedMotionInBrowser",
    },
    {
      id: "long-token-overflow",
      probeKind: "longTokenOverflow",
      label: "Long path/field/enum/code overflow containment",
      routeIds: REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS,
      viewportIds: REFERENCE_BROWSER_CLOSEOUT_LONG_TOKEN_VIEWPORT_IDS,
      harness: "evaluateReferenceLongTokenOverflowInBrowser",
    },
    {
      id: "no-js-html",
      probeKind: "noJsHtml",
      label: "Essential facts readable from script-stripped static HTML",
      routeIds: REFERENCE_SURFACE_ROUTE_IDS,
      viewportIds: ["laptop"],
      harness: "expectReferenceNoJsHtmlReadability",
    },
    {
      id: "focused-payload-budgets",
      probeKind: "payloadBudget",
      label: "Focused API/events/factory-schema payload budgets remain green",
      routeIds: REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS,
      viewportIds: [],
      harness: "evaluateReferencePayloadBudgets",
    },
  ] as const;

export type ReferenceBrowserCloseoutExpandedCase = {
  caseId: string;
  probeKind: ReferenceBrowserCloseoutProbeKind;
  routeId: ReferenceSurfaceRouteId;
  path: string;
  viewportId: ReferenceSurfaceViewportId | null;
  width: number | null;
  height: number | null;
  harness: string;
};

/**
 * Expands close-out cases into route × viewport rows (payload budgets expand
 * to route-only rows with null viewport).
 */
export function listReferenceBrowserCloseoutCases(): ReferenceBrowserCloseoutExpandedCase[] {
  const rows: ReferenceBrowserCloseoutExpandedCase[] = [];

  for (const closeoutCase of REFERENCE_BROWSER_CLOSEOUT_CASES) {
    for (const routeId of closeoutCase.routeIds) {
      const route = REFERENCE_SURFACE_ROUTES.find(
        (entry) => entry.id === routeId,
      );
      if (!route) {
        throw new Error(`Unknown close-out route id: ${routeId}`);
      }

      if (closeoutCase.viewportIds.length === 0) {
        rows.push({
          caseId: closeoutCase.id,
          probeKind: closeoutCase.probeKind,
          routeId,
          path: route.path,
          viewportId: null,
          width: null,
          height: null,
          harness: closeoutCase.harness,
        });
        continue;
      }

      for (const viewportId of closeoutCase.viewportIds) {
        const viewport = getReferenceSurfaceViewport(viewportId);
        if (!viewport) {
          throw new Error(
            `Unknown close-out viewport id: ${viewportId} for route ${routeId}`,
          );
        }
        rows.push({
          caseId: closeoutCase.id,
          probeKind: closeoutCase.probeKind,
          routeId,
          path: route.path,
          viewportId,
          width: viewport.width,
          height: viewport.height,
          harness: closeoutCase.harness,
        });
      }
    }
  }

  return rows;
}

/** Every representative W19 route id appears in at least one close-out case. */
export function listReferenceBrowserCloseoutCoveredRouteIds(): ReferenceSurfaceRouteId[] {
  const ids = new Set<ReferenceSurfaceRouteId>();
  for (const closeoutCase of REFERENCE_BROWSER_CLOSEOUT_CASES) {
    for (const routeId of closeoutCase.routeIds) {
      ids.add(routeId);
    }
  }
  return REFERENCE_SURFACE_ROUTE_IDS.filter((id) => ids.has(id));
}

/**
 * True when overflow + no-JS close-out cases cover every representative route
 * and interactive probes cover API + events + factory-schema.
 */
export function referenceBrowserCloseoutCoversRequiredSurfaces(): boolean {
  const covered = new Set(listReferenceBrowserCloseoutCoveredRouteIds());
  for (const routeId of REFERENCE_SURFACE_ROUTE_IDS) {
    if (!covered.has(routeId)) {
      return false;
    }
  }

  const overflow = REFERENCE_BROWSER_CLOSEOUT_CASES.find(
    (entry) => entry.id === "overflow-matrix",
  );
  if (
    !overflow ||
    overflow.routeIds.length !== REFERENCE_SURFACE_ROUTE_IDS.length ||
    overflow.viewportIds.length !== REFERENCE_SURFACE_VIEWPORT_IDS.length
  ) {
    return false;
  }

  for (const interactiveId of [
    "keyboard-chrome",
    "hash-focus-sticky-mobile",
    "copy-announcements",
    "reduced-motion",
  ] as const) {
    const interactive = REFERENCE_BROWSER_CLOSEOUT_CASES.find(
      (entry) => entry.id === interactiveId,
    );
    if (!interactive) {
      return false;
    }
    for (const routeId of REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS) {
      if (!interactive.routeIds.includes(routeId)) {
        return false;
      }
    }
    if (!interactive.routeIds.includes("references-api")) {
      return false;
    }
    if (!interactive.routeIds.includes("references-events")) {
      return false;
    }
  }

  return true;
}

/**
 * W20 surfaces this lane must not own. Close-out runners should assert these
 * strings remain documentation-only exclusions (not executed here).
 */
export const REFERENCE_BROWSER_CLOSEOUT_EXCLUDED_W20_SUITES = [
  "static-export-sitemap-canonical",
  "full-link-search-cross-surface-convergence",
] as const;
