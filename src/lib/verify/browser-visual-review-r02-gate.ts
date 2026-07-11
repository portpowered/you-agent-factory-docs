/**
 * R02 story 008 — required browser/visual review surface inventory.
 *
 * Live served HTML evidence is recorded in
 * docs/internal/processes/repair-convergence-verification-relevant-files.md.
 * This module keeps the review checklist executable for CI lock suites.
 */

import { supportedLocales } from "@/lib/i18n/locale-routing";
import { BRAND_ALIGNMENT_VERIFICATION_ROUTES } from "@/lib/layout/content-column-brand-alignment-coverage";
import { THEME_CODE_COPY_R00_ROUTE } from "@/lib/verify/theme-code-copy-r00-gate";

/** Required non-docs shell surfaces from the R02 browser review contract. */
export const BROWSER_VISUAL_REVIEW_SHELL_ROUTES = [
  { id: "home", path: "/" },
  { id: "browse", path: "/browse" },
  { id: "blog", path: "/blog" },
] as const;

/** Code-heavy guide used for theme + accessible code-copy visual review. */
export const BROWSER_VISUAL_REVIEW_CODE_HEAVY_GUIDE_ROUTE =
  THEME_CODE_COPY_R00_ROUTE;

/** Corrected/new Concepts page sampled in the R02 browser review. */
export const BROWSER_VISUAL_REVIEW_CONCEPTS_ROUTE = "/docs/concepts/skills";

/**
 * Program documentation samples: one of the eight new pages plus the folder
 * chrome checked via explorer markers on the same route.
 */
export const BROWSER_VISUAL_REVIEW_PROGRAM_DOCUMENTATION_ROUTES = [
  "/docs/documentation/mock-workers",
  "/docs/documentation/packaged-factories",
] as const;

/** Representative docs route used for locale-shell explorer/chrome review. */
export const BROWSER_VISUAL_REVIEW_LOCALE_DOCS_ROUTE =
  BROWSER_VISUAL_REVIEW_CONCEPTS_ROUTE;

/** Locales required by the R02 browser/visual review contract. */
export const BROWSER_VISUAL_REVIEW_LOCALES = supportedLocales;

/** Mobile drawer motion-chrome markers expected when the drawer is open. */
export const BROWSER_VISUAL_REVIEW_MOBILE_DRAWER_MARKERS = [
  "mobile-drawer",
  "mobile-drawer-backdrop",
] as const;

/**
 * Full path inventory covered by story 008 browser/visual review (default
 * locale paths; locale shells reuse the Concepts sample under prefixes).
 */
export const BROWSER_VISUAL_REVIEW_REQUIRED_PATHS = [
  ...BROWSER_VISUAL_REVIEW_SHELL_ROUTES.map((route) => route.path),
  BROWSER_VISUAL_REVIEW_CODE_HEAVY_GUIDE_ROUTE,
  BROWSER_VISUAL_REVIEW_CONCEPTS_ROUTE,
  ...BROWSER_VISUAL_REVIEW_PROGRAM_DOCUMENTATION_ROUTES,
] as const;

/** Brand + content-column matrix routes must stay a subset of the review set. */
export function brandAlignmentRoutesCoveredByBrowserReview(): boolean {
  return BRAND_ALIGNMENT_VERIFICATION_ROUTES.every((route) =>
    (BROWSER_VISUAL_REVIEW_REQUIRED_PATHS as readonly string[]).includes(
      route.path,
    ),
  );
}
