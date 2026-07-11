import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { act } from "react";
import {
  renderBlogIndexPage,
  renderBrowseIndexPage,
} from "@/app/(site)/site-renderers";
import { renderDocsSlugPage } from "@/app/docs/docs-slug-renderer";
import { HomeArticle } from "@/components/home/home-article";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS } from "@/components/layout/docs-header";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
import {
  CONTENT_COLUMN_INSET_CLASS,
  usesNegativeMarginCompensation,
} from "@/lib/layout/content-column-alignment";
import {
  BRAND_ALIGNMENT_EXPECTED_BRAND,
  BRAND_ALIGNMENT_VERIFICATION_ROUTES,
  BRAND_ALIGNMENT_VIEWPORTS,
  listBrandAlignmentContentColumnSurfaces,
  listBrandAlignmentMatrixCases,
} from "@/lib/layout/content-column-brand-alignment-coverage";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
import {
  assertCriticalLayoutContract,
  captureCriticalLayoutSnapshot,
  expectLayoutSnapshotMatches,
  hashLayoutSnapshot,
} from "@/lib/verify/a11y-layout-snapshot";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

describe("brand + content-column alignment layout coverage (always-on)", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("matrix covers all brand-alignment routes at four viewports", () => {
    const cases = listBrandAlignmentMatrixCases();
    expect(cases).toHaveLength(
      BRAND_ALIGNMENT_VERIFICATION_ROUTES.length *
        BRAND_ALIGNMENT_VIEWPORTS.length,
    );
    expect(BRAND_ALIGNMENT_VIEWPORTS.map((viewport) => viewport.width)).toEqual(
      [390, 768, 1024, 1440],
    );
    expect(listBrandAlignmentContentColumnSurfaces()).toEqual([
      "header-docs-nav",
      "home-article-browse",
      "browse-index",
      "blog-index",
      "docs-page",
    ]);
    expect(BRAND_ALIGNMENT_EXPECTED_BRAND).toBe("You Agent Factory");
  });

  test("header/docs nav uses shared inset without negative-margin compensation", () => {
    expect(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS).toContain(
      CONTENT_COLUMN_INSET_CLASS,
    );
    expect(
      usesNegativeMarginCompensation(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS),
    ).toBe(false);
  });

  test("home article + Browse layout snapshot gates brand, surface, and left-edge contract", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <HomeArticle
            messages={context.messages}
            siteConfig={youAgentFactorySiteConfig}
          />
        </CanonicalDocsLayout>,
        { context },
      );
    });

    expect(
      document.querySelector("a[data-docs-header-brand]")?.textContent?.trim(),
    ).toBe(BRAND_ALIGNMENT_EXPECTED_BRAND);

    const baseline = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(baseline, {
      expectedH1: context.messages.home.title,
      expectedBrand: BRAND_ALIGNMENT_EXPECTED_BRAND,
      expectedContentColumnSurface: "home-article-browse",
      minPrimaryNavLinks: getPrimaryNavItems(context.messages).length,
    });
    expectLayoutSnapshotMatches(baseline, baseline);

    // Deliberate brand regression must fail the contract / change the hash.
    const brandLink = document.querySelector("a[data-docs-header-brand]");
    expect(brandLink).toBeTruthy();
    if (brandLink) {
      brandLink.textContent = "you-agent-factory";
    }
    const regress = captureCriticalLayoutSnapshot(document);
    expect(() =>
      assertCriticalLayoutContract(regress, {
        expectedBrand: BRAND_ALIGNMENT_EXPECTED_BRAND,
      }),
    ).toThrow(/expected brand matching/);
    expect(hashLayoutSnapshot(regress)).not.toBe(hashLayoutSnapshot(baseline));
  });

  test("browse index layout snapshot gates brand and shared content-column surface", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderBrowseIndexPage();

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const baseline = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(baseline, {
      expectedH1: context.messages.browseIndex.title,
      expectedBrand: BRAND_ALIGNMENT_EXPECTED_BRAND,
      expectedContentColumnSurface: "browse-index",
      minPrimaryNavLinks: getPrimaryNavItems(context.messages).length,
    });
    expect(baseline.hasUnintendedPageOverflow).toBe(false);
  });

  test("blog index layout snapshot gates brand and shared content-column surface", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderBlogIndexPage();

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const baseline = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(baseline, {
      expectedH1: context.messages.blogIndex.title,
      expectedBrand: BRAND_ALIGNMENT_EXPECTED_BRAND,
      expectedContentColumnSurface: "blog-index",
      minPrimaryNavLinks: getPrimaryNavItems(context.messages).length,
    });
    expect(baseline.hasUnintendedPageOverflow).toBe(false);
  });

  test("docs page layout snapshot gates brand and shared content-column surface", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderDocsSlugPage(["concepts", "harness"]);

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const baseline = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(baseline, {
      expectedH1: "Harness",
      expectedBrand: BRAND_ALIGNMENT_EXPECTED_BRAND,
      expectedContentColumnSurface: "docs-page",
      minPrimaryNavLinks: getPrimaryNavItems(context.messages).length,
    });

    const pageEl = document.getElementById("nd-page");
    expect(pageEl?.className ?? "").toContain("px-4");
    expect(pageEl?.className ?? "").toContain("md:px-6");
    expect(pageEl?.className ?? "").toContain("xl:px-8");
    expect(pageEl?.className ?? "").not.toMatch(/(?:^|\s)-m[trblxy]?-/);

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const navColumn = primaryNav.firstElementChild;
    expect(navColumn?.className ?? "").toContain(CONTENT_COLUMN_INSET_CLASS);
    expect(baseline.hasUnintendedPageOverflow).toBe(false);
  });

  test("viewport matrix widths stay mobile/tablet/laptop/wide for overflow gates", () => {
    for (const viewport of BRAND_ALIGNMENT_VIEWPORTS) {
      expect(viewport.width).toBeGreaterThan(0);
      expect(viewport.height).toBeGreaterThan(0);
    }
    expect(
      listBrandAlignmentMatrixCases().every((entry) =>
        BRAND_ALIGNMENT_VERIFICATION_ROUTES.some(
          (route) => route.id === entry.route.id,
        ),
      ),
    ).toBe(true);
  });
});
