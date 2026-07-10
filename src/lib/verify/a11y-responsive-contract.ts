/**
 * Shared critical-route and viewport contract for accessibility / responsive
 * verification. Later stories assert against these surfaces and widths.
 */

export const CRITICAL_ROUTE_IDS = [
  "home",
  "browse",
  "search",
  "docs-article",
  "harness-support",
  "blog-index",
  "blog-post",
] as const;

export type CriticalRouteId = (typeof CRITICAL_ROUTE_IDS)[number];

export type CriticalRoute = {
  id: CriticalRouteId;
  /** Site-relative path (no project basePath prefix). */
  path: string;
  label: string;
};

/**
 * Critical reader surfaces for a11y / responsive probes.
 * Paths stay unprefixed; callers apply basePath when serving export builds.
 */
export const CRITICAL_ROUTES: readonly CriticalRoute[] = [
  { id: "home", path: "/", label: "Home" },
  { id: "browse", path: "/browse", label: "Browse" },
  { id: "search", path: "/search", label: "Search" },
  {
    id: "docs-article",
    path: "/docs/guides/getting-started",
    label: "Docs article",
  },
  {
    id: "harness-support",
    path: "/docs/documentation/harness-support",
    label: "Harness support",
  },
  { id: "blog-index", path: "/blog", label: "Blog index" },
  {
    id: "blog-post",
    path: "/blog/comparing-agent-factories",
    label: "Blog post",
  },
] as const;

export const CRITICAL_VIEWPORT_IDS = [
  "mobile",
  "tablet",
  "laptop",
  "wide",
] as const;

export type CriticalViewportId = (typeof CRITICAL_VIEWPORT_IDS)[number];

export type CriticalViewport = {
  id: CriticalViewportId;
  label: string;
  width: number;
  height: number;
};

/** Representative CSS-pixel widths: phone, tablet, laptop, wide desktop. */
export const CRITICAL_VIEWPORTS: readonly CriticalViewport[] = [
  { id: "mobile", label: "Mobile", width: 390, height: 844 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "laptop", label: "Laptop", width: 1024, height: 768 },
  { id: "wide", label: "Wide", width: 1440, height: 900 },
] as const;

/**
 * Subpixel rounding tolerance when comparing scrollWidth to clientWidth for
 * page-level horizontal overflow.
 */
export const PAGE_OVERFLOW_TOLERANCE_PX = 1;

/**
 * Selectors for containers that may scroll horizontally on purpose (wide
 * tables, fenced code). Page-level overflow checks must not treat these as
 * failures when only the container scrolls.
 */
export const INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS = [
  "[data-harness-support-matrix]",
  "[data-testid='harness-support-matrix']",
  '[data-rich-content-scroll="code"]',
  "pre",
  ".overflow-x-auto",
] as const;

export function getCriticalRoute(
  id: CriticalRouteId,
): CriticalRoute | undefined {
  return CRITICAL_ROUTES.find((route) => route.id === id);
}

export function getCriticalViewport(
  id: CriticalViewportId,
): CriticalViewport | undefined {
  return CRITICAL_VIEWPORTS.find((viewport) => viewport.id === id);
}

export function listCriticalRoutePaths(): string[] {
  return CRITICAL_ROUTES.map((route) => route.path);
}
