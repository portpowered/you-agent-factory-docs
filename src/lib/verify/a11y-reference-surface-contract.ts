/**
 * W19 shared contract: representative Factory reference routes and the five
 * layout widths (including zoomed) that later a11y / responsive / budget
 * stories assert against.
 *
 * Extends the critical-route harness in `a11y-responsive-contract.ts` without
 * replacing it — reuse overflow tolerance, intentional scroller selectors, and
 * the focused `make a11y` reproduction command.
 */

import {
  A11Y_SUITE_REPRODUCTION_COMMAND,
  CRITICAL_VIEWPORTS,
  type CriticalViewport,
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "./a11y-responsive-contract";

export {
  A11Y_SUITE_REPRODUCTION_COMMAND,
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  PAGE_OVERFLOW_TOLERANCE_PX,
};

export const REFERENCE_SURFACE_ROUTE_IDS = [
  "references-api",
  "references-events",
  "references-factory-schema",
  "authored-factory",
  "authored-worker",
  "authored-workstation",
] as const;

export type ReferenceSurfaceRouteId =
  (typeof REFERENCE_SURFACE_ROUTE_IDS)[number];

export type ReferenceSurfaceRoute = {
  id: ReferenceSurfaceRouteId;
  /** Site-relative path (no project basePath prefix). */
  path: string;
  label: string;
  /**
   * Route family for later story filters (unified reference vs authored
   * embed pages).
   */
  kind: "reference" | "authored";
};

/**
 * Representative reference + authored surfaces for W19 probes.
 * Paths stay unprefixed; callers apply basePath when serving export builds.
 */
export const REFERENCE_SURFACE_ROUTES: readonly ReferenceSurfaceRoute[] = [
  {
    id: "references-api",
    path: "/docs/references/api",
    label: "API reference",
    kind: "reference",
  },
  {
    id: "references-events",
    path: "/docs/references/events",
    label: "Events catalog",
    kind: "reference",
  },
  {
    id: "references-factory-schema",
    path: "/docs/references/factory-schema",
    label: "Factory schema (largest schema representative)",
    kind: "reference",
  },
  {
    id: "authored-factory",
    path: "/docs/factories/packaged",
    label: "Authored factory page",
    kind: "authored",
  },
  {
    id: "authored-worker",
    path: "/docs/workers/hosted",
    label: "Authored worker page",
    kind: "authored",
  },
  {
    id: "authored-workstation",
    path: "/docs/workstations/standard",
    label: "Authored workstation page",
    kind: "authored",
  },
] as const;

export const REFERENCE_SURFACE_VIEWPORT_IDS = [
  "wide",
  "laptop",
  "tablet",
  "mobile",
  "zoomed",
] as const;

export type ReferenceSurfaceViewportId =
  (typeof REFERENCE_SURFACE_VIEWPORT_IDS)[number];

export type ReferenceSurfaceViewport = {
  id: ReferenceSurfaceViewportId;
  label: string;
  width: number;
  height: number;
};

/**
 * Zoomed layout: CSS-pixel equivalent of ~200% browser zoom on the critical
 * laptop viewport (1024×768 → 512×384). Prefer this over inventing a parallel
 * zoom API — Playwright viewport width already drives layout overflow probes.
 */
export const REFERENCE_ZOOMED_VIEWPORT: ReferenceSurfaceViewport = {
  id: "zoomed",
  label: "Zoomed (~200% of laptop)",
  width: 512,
  height: 384,
};

function criticalViewportById(
  id: (typeof CRITICAL_VIEWPORTS)[number]["id"],
): CriticalViewport {
  const viewport = CRITICAL_VIEWPORTS.find((entry) => entry.id === id);
  if (!viewport) {
    throw new Error(`Missing critical viewport: ${id}`);
  }
  return viewport;
}

/**
 * Five layouts for W19: large desktop, laptop, tablet, narrow phone, zoomed.
 * Desktop/laptop/tablet/phone reuse critical widths; zoomed is reference-only.
 */
export const REFERENCE_SURFACE_VIEWPORTS: readonly ReferenceSurfaceViewport[] =
  [
    {
      id: "wide",
      label: "Large desktop",
      width: criticalViewportById("wide").width,
      height: criticalViewportById("wide").height,
    },
    {
      id: "laptop",
      label: "Laptop",
      width: criticalViewportById("laptop").width,
      height: criticalViewportById("laptop").height,
    },
    {
      id: "tablet",
      label: "Tablet",
      width: criticalViewportById("tablet").width,
      height: criticalViewportById("tablet").height,
    },
    {
      id: "mobile",
      label: "Narrow phone",
      width: criticalViewportById("mobile").width,
      height: criticalViewportById("mobile").height,
    },
    REFERENCE_ZOOMED_VIEWPORT,
  ] as const;

export type ReferenceOverflowMatrixCase = {
  route: ReferenceSurfaceRoute;
  viewport: ReferenceSurfaceViewport;
};

export function getReferenceSurfaceRoute(
  id: ReferenceSurfaceRouteId,
): ReferenceSurfaceRoute | undefined {
  return REFERENCE_SURFACE_ROUTES.find((route) => route.id === id);
}

export function getReferenceSurfaceViewport(
  id: ReferenceSurfaceViewportId,
): ReferenceSurfaceViewport | undefined {
  return REFERENCE_SURFACE_VIEWPORTS.find((viewport) => viewport.id === id);
}

export function listReferenceSurfaceRoutePaths(): string[] {
  return REFERENCE_SURFACE_ROUTES.map((route) => route.path);
}

/**
 * Full representative-route × five-layout matrix for W19 responsive overflow
 * and related probes. Later stories assert against this enumeration.
 */
export function listReferenceOverflowMatrixCases(): ReferenceOverflowMatrixCase[] {
  return REFERENCE_SURFACE_VIEWPORTS.flatMap((viewport) =>
    REFERENCE_SURFACE_ROUTES.map((route) => ({ route, viewport })),
  );
}
