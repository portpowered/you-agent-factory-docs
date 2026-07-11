/**
 * Focused brand + content-column alignment verification matrix.
 *
 * Gates the repair-layout-brand-alignment contract: display brand
 * ("You Agent Factory"), shared left-edge surfaces, and no unintended
 * page overflow across mobile / tablet / laptop / wide viewports.
 */

import type { ContentColumnConsumerSurface } from "@/lib/layout/content-column-alignment";
import { CONTENT_COLUMN_CONSUMER_SURFACES } from "@/lib/layout/content-column-alignment";
import { SITE_BRAND_NAME } from "@/lib/scaffold";
import {
  CRITICAL_VIEWPORTS,
  type CriticalViewport,
} from "@/lib/verify/a11y-responsive-contract";

/** Reader-visible display brand asserted on header chrome. */
export const BRAND_ALIGNMENT_EXPECTED_BRAND = SITE_BRAND_NAME;

/**
 * Routes that must prove brand + shared content-column left edge.
 * `header-docs-nav` is present on every shell page via DocsHeader.
 */
export const BRAND_ALIGNMENT_VERIFICATION_ROUTES = [
  {
    id: "home",
    path: "/",
    label: "Home article + Browse",
    contentColumnSurface: "home-article-browse" as const,
  },
  {
    id: "browse",
    path: "/browse",
    label: "Browse index",
    contentColumnSurface: "browse-index" as const,
  },
  {
    id: "blog",
    path: "/blog",
    label: "Blog index",
    contentColumnSurface: "blog-index" as const,
  },
  {
    id: "docs-page",
    path: "/docs/guides/getting-started",
    label: "Docs page",
    contentColumnSurface: "docs-page" as const,
  },
] as const;

export type BrandAlignmentVerificationRoute =
  (typeof BRAND_ALIGNMENT_VERIFICATION_ROUTES)[number];

export type BrandAlignmentMatrixCase = {
  route: BrandAlignmentVerificationRoute;
  viewport: CriticalViewport;
};

/** Viewports used for brand + alignment coverage (same as critical a11y). */
export const BRAND_ALIGNMENT_VIEWPORTS: readonly CriticalViewport[] =
  CRITICAL_VIEWPORTS;

/**
 * Full brand-alignment route × viewport matrix for layout-snapshot /
 * overflow probes.
 */
export function listBrandAlignmentMatrixCases(): BrandAlignmentMatrixCase[] {
  return BRAND_ALIGNMENT_VIEWPORTS.flatMap((viewport) =>
    BRAND_ALIGNMENT_VERIFICATION_ROUTES.map((route) => ({ route, viewport })),
  );
}

/** Surfaces that must appear in the brand-alignment verification set. */
export function listBrandAlignmentContentColumnSurfaces(): ContentColumnConsumerSurface[] {
  return [...CONTENT_COLUMN_CONSUMER_SURFACES];
}

/**
 * True when left-edge geometry between header primary-nav column and
 * `#nd-page` should be compared. Below `md` the primary nav is drawer-only.
 */
export function shouldAssertInlineLeftEdgeAlignment(
  viewport: Pick<CriticalViewport, "width">,
): boolean {
  return viewport.width >= 768;
}
