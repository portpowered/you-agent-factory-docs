import { describe, expect, test } from "bun:test";
import {
  CONTENT_COLUMN_CLASS,
  CONTENT_COLUMN_CONSUMER_SURFACES,
  CONTENT_COLUMN_CSS_VARS,
  CONTENT_COLUMN_FULL_CLASS,
  CONTENT_COLUMN_INSET,
  CONTENT_COLUMN_INSET_CLASS,
  CONTENT_COLUMN_INSET_FROM_MD_CLASS,
  CONTENT_COLUMN_MAX_WIDTH,
  usesNegativeMarginCompensation,
} from "@/lib/layout/content-column-alignment";

/** Fumadocs DocsPage `#nd-page` horizontal padding (source of truth for the edge). */
const FUMADOCS_PAGE_INSET_CLASS = "px-4 md:px-6 xl:px-8";

describe("content-column alignment contract", () => {
  test("defines a single shared horizontal inset matching Fumadocs DocsPage", () => {
    expect(CONTENT_COLUMN_INSET_CLASS).toBe(FUMADOCS_PAGE_INSET_CLASS);
    expect(CONTENT_COLUMN_INSET.mobile).toBe("1rem");
    expect(CONTENT_COLUMN_INSET.md).toBe("1.5rem");
    expect(CONTENT_COLUMN_INSET.xl).toBe("2rem");
  });

  test("exposes reusable column classes without per-surface padding forks", () => {
    expect(CONTENT_COLUMN_CLASS).toContain(CONTENT_COLUMN_INSET_CLASS);
    expect(CONTENT_COLUMN_CLASS).toContain("max-w-[900px]");
    expect(CONTENT_COLUMN_FULL_CLASS).toContain(CONTENT_COLUMN_INSET_CLASS);
    expect(CONTENT_COLUMN_FULL_CLASS).toContain("max-w-[1168px]");
    expect(CONTENT_COLUMN_MAX_WIDTH.default).toBe("900px");
    expect(CONTENT_COLUMN_MAX_WIDTH.full).toBe("1168px");
  });

  test("exposes from-md inset for nested chrome that already has mobile shell padding", () => {
    expect(CONTENT_COLUMN_INSET_FROM_MD_CLASS).toBe("md:px-6 xl:px-8");
    expect(CONTENT_COLUMN_INSET_CLASS).toContain(
      CONTENT_COLUMN_INSET_FROM_MD_CLASS,
    );
    expect(
      usesNegativeMarginCompensation(CONTENT_COLUMN_INSET_FROM_MD_CLASS),
    ).toBe(false);
  });

  test("does not rely on negative-margin compensation", () => {
    expect(usesNegativeMarginCompensation(CONTENT_COLUMN_INSET_CLASS)).toBe(
      false,
    );
    expect(usesNegativeMarginCompensation(CONTENT_COLUMN_CLASS)).toBe(false);
    expect(usesNegativeMarginCompensation(CONTENT_COLUMN_FULL_CLASS)).toBe(
      false,
    );
    expect(usesNegativeMarginCompensation("-ml-4 px-4")).toBe(true);
    expect(usesNegativeMarginCompensation("px-4 -mx-2")).toBe(true);
  });

  test("documents CSS variables for the shared inset and max-width tokens", () => {
    expect(CONTENT_COLUMN_CSS_VARS.insetMobile).toBe(
      "--site-content-column-inset-mobile",
    );
    expect(CONTENT_COLUMN_CSS_VARS.insetMd).toBe(
      "--site-content-column-inset-md",
    );
    expect(CONTENT_COLUMN_CSS_VARS.insetXl).toBe(
      "--site-content-column-inset-xl",
    );
    expect(CONTENT_COLUMN_CSS_VARS.maxWidth).toBe(
      "--site-content-column-max-width",
    );
    expect(CONTENT_COLUMN_CSS_VARS.maxWidthFull).toBe(
      "--site-content-column-max-width-full",
    );
  });

  test("lists shell surfaces that must consume the shared left edge", () => {
    expect([...CONTENT_COLUMN_CONSUMER_SURFACES]).toEqual([
      "header-docs-nav",
      "home-article-browse",
      "browse-index",
      "blog-index",
      "docs-page",
    ]);
  });
});
