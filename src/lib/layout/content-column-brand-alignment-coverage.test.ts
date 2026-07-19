import { describe, expect, test } from "bun:test";
import { CONTENT_COLUMN_CONSUMER_SURFACES } from "@/lib/layout/content-column-alignment";
import {
  BRAND_ALIGNMENT_EXPECTED_BRAND,
  BRAND_ALIGNMENT_VERIFICATION_ROUTES,
  BRAND_ALIGNMENT_VIEWPORTS,
  listBrandAlignmentContentColumnSurfaces,
  listBrandAlignmentMatrixCases,
  shouldAssertInlineLeftEdgeAlignment,
} from "@/lib/layout/content-column-brand-alignment-coverage";

describe("brand + content-column alignment coverage contract", () => {
  test("expects the YOU header chrome brand mark", () => {
    expect(BRAND_ALIGNMENT_EXPECTED_BRAND).toBe("YOU");
  });

  test("covers home, browse, blog, and docs surfaces at four viewports", () => {
    expect(
      BRAND_ALIGNMENT_VERIFICATION_ROUTES.map((route) => route.id),
    ).toEqual(["home", "browse", "blog", "docs-page"]);
    expect(
      BRAND_ALIGNMENT_VERIFICATION_ROUTES.map(
        (route) => route.contentColumnSurface,
      ),
    ).toEqual([
      "home-article-browse",
      "browse-index",
      "blog-index",
      "docs-page",
    ]);
    expect(BRAND_ALIGNMENT_VIEWPORTS.map((viewport) => viewport.width)).toEqual(
      [390, 768, 1024, 1440],
    );
    expect(listBrandAlignmentMatrixCases()).toHaveLength(
      BRAND_ALIGNMENT_VERIFICATION_ROUTES.length *
        BRAND_ALIGNMENT_VIEWPORTS.length,
    );
  });

  test("includes every shared content-column consumer surface", () => {
    expect(listBrandAlignmentContentColumnSurfaces()).toEqual([
      ...CONTENT_COLUMN_CONSUMER_SURFACES,
    ]);
  });

  test("inline left-edge geometry applies at md+ only", () => {
    expect(shouldAssertInlineLeftEdgeAlignment({ width: 390 })).toBe(false);
    expect(shouldAssertInlineLeftEdgeAlignment({ width: 767 })).toBe(false);
    expect(shouldAssertInlineLeftEdgeAlignment({ width: 768 })).toBe(true);
    expect(shouldAssertInlineLeftEdgeAlignment({ width: 1440 })).toBe(true);
  });
});
