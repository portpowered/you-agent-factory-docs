/**
 * R02 story 008 — browser/visual review lock on the combined R00 + R01 tip.
 *
 * Proves the required surface/locale inventory, explorer IA markers used during
 * served HTML review, mobile drawer chrome contract, and published route
 * resolution. Live curl evidence (port 3555) is recorded in
 * repair-convergence-verification-relevant-files.md.
 */
import "./../../tests/a11y/mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { act } from "react";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { HomeArticle } from "@/components/home/home-article";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import {
  DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
  DOCS_PAGE_TREE_ROOT_NAME,
  FACTORY_EXPLORER_FOLDER_LABELS,
} from "@/lib/content/factory-breadcrumb-sidebar";
import { getPublishedDocsEntryByRegistryId } from "@/lib/content/published-docs-registry-ids";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { resolveExplorerMessages } from "@/lib/i18n/explorer-labels";
import { localizePath, supportedLocales } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import { BRAND_ALIGNMENT_EXPECTED_BRAND } from "@/lib/layout/content-column-brand-alignment-coverage";
import {
  buildExplorerTreeSignature,
  topLevelFolderNames,
  topLevelPageEntries,
} from "@/lib/navigation/explorer-tree-signature";
import { SITE_BRAND_NAME } from "@/lib/scaffold";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
import { source } from "@/lib/source";
import { MOBILE_DRAWER_MOTION_CHROME } from "@/lib/verify/a11y-reduced-motion";
import {
  BROWSER_VISUAL_REVIEW_CODE_HEAVY_GUIDE_ROUTE,
  BROWSER_VISUAL_REVIEW_CONCEPTS_ROUTE,
  BROWSER_VISUAL_REVIEW_LOCALE_DOCS_ROUTE,
  BROWSER_VISUAL_REVIEW_LOCALES,
  BROWSER_VISUAL_REVIEW_MOBILE_DRAWER_MARKERS,
  BROWSER_VISUAL_REVIEW_PROGRAM_DOCUMENTATION_ROUTES,
  BROWSER_VISUAL_REVIEW_REQUIRED_PATHS,
  BROWSER_VISUAL_REVIEW_SHELL_ROUTES,
  brandAlignmentRoutesCoveredByBrowserReview,
} from "@/lib/verify/browser-visual-review-r02-gate";
import {
  THEME_CODE_COPY_R00_PALETTE_ATTR,
  THEME_CODE_COPY_R00_ROUTE,
} from "@/lib/verify/theme-code-copy-r00-gate";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

const REVIEW_PUBLISHED_PAGES = [
  {
    path: BROWSER_VISUAL_REVIEW_CONCEPTS_ROUTE,
    docsSlug: ["concepts", "skills"] as const,
    registryId: "concept.skills",
    title: "Skills",
  },
  {
    path: BROWSER_VISUAL_REVIEW_PROGRAM_DOCUMENTATION_ROUTES[0],
    docsSlug: ["documentation", "throttling-and-limits"] as const,
    registryId: "documentation.throttling-and-limits",
    title: "Throttling and limits",
  },
  {
    path: BROWSER_VISUAL_REVIEW_PROGRAM_DOCUMENTATION_ROUTES[1],
    docsSlug: ["documentation", "packaged-documents"] as const,
    registryId: "documentation.packaged-documents",
    title: "Packaged documents",
  },
  {
    path: BROWSER_VISUAL_REVIEW_CODE_HEAVY_GUIDE_ROUTE,
    docsSlug: ["guides", "getting-started"] as const,
    registryId: "guide.getting-started",
    title: "Getting Started",
  },
] as const;

describe("R02 browser / visual review convergence", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("required surface inventory covers shells, guide, Concepts, and Program docs", () => {
    expect(
      BROWSER_VISUAL_REVIEW_SHELL_ROUTES.map((route) => route.path),
    ).toEqual(["/", "/browse", "/blog"]);
    expect(BROWSER_VISUAL_REVIEW_CODE_HEAVY_GUIDE_ROUTE).toBe(
      THEME_CODE_COPY_R00_ROUTE,
    );
    expect(BROWSER_VISUAL_REVIEW_CONCEPTS_ROUTE).toBe("/docs/concepts/skills");
    expect([...BROWSER_VISUAL_REVIEW_PROGRAM_DOCUMENTATION_ROUTES]).toEqual([
      "/docs/documentation/throttling-and-limits",
      "/docs/documentation/packaged-documents",
    ]);
    expect([...BROWSER_VISUAL_REVIEW_REQUIRED_PATHS]).toEqual([
      "/",
      "/browse",
      "/blog",
      THEME_CODE_COPY_R00_ROUTE,
      "/docs/concepts/skills",
      "/docs/documentation/throttling-and-limits",
      "/docs/documentation/packaged-documents",
    ]);
    expect(brandAlignmentRoutesCoveredByBrowserReview()).toBe(true);
  });

  test("locale shell inventory is en / ja / zh-CN / vi", () => {
    expect([...BROWSER_VISUAL_REVIEW_LOCALES]).toEqual([
      "en",
      "ja",
      "zh-CN",
      "vi",
    ]);
    expect([...BROWSER_VISUAL_REVIEW_LOCALES]).toEqual([...supportedLocales]);
    expect(BROWSER_VISUAL_REVIEW_LOCALE_DOCS_ROUTE).toBe(
      BROWSER_VISUAL_REVIEW_CONCEPTS_ROUTE,
    );

    expect(localizePath(BROWSER_VISUAL_REVIEW_LOCALE_DOCS_ROUTE, "en")).toBe(
      "/docs/concepts/skills",
    );
    expect(localizePath(BROWSER_VISUAL_REVIEW_LOCALE_DOCS_ROUTE, "ja")).toBe(
      "/ja/docs/concepts/skills",
    );
    expect(localizePath(BROWSER_VISUAL_REVIEW_LOCALE_DOCS_ROUTE, "zh-CN")).toBe(
      "/zh-CN/docs/concepts/skills",
    );
    expect(localizePath(BROWSER_VISUAL_REVIEW_LOCALE_DOCS_ROUTE, "vi")).toBe(
      "/vi/docs/concepts/skills",
    );
  });

  test("reviewed docs pages resolve with published titles", async () => {
    for (const page of REVIEW_PUBLISHED_PAGES) {
      const sourcePage = source.getPage([...page.docsSlug]);
      expect(sourcePage, page.path).toBeTruthy();
      expect(sourcePage?.url).toBe(page.path);

      const published = getPublishedDocsEntryByRegistryId(page.registryId);
      expect(published, page.registryId).toBeTruthy();
      expect(published?.url).toBe(page.path);

      const metadata = await buildDocsPageMetadata([...page.docsSlug]);
      expect(metadata.title).toBe(page.title);
    }
  });

  test("explorer chrome on locale shells keeps brand, FAQ, Program documentation, no Glossary", async () => {
    expect(SITE_BRAND_NAME).toBe("You Agent Factory");
    expect(DOCS_PAGE_TREE_ROOT_NAME).toBe(BRAND_ALIGNMENT_EXPECTED_BRAND);
    expect(FACTORY_EXPLORER_FOLDER_LABELS.documentation).toBe(
      "Program documentation",
    );
    expect(THEME_CODE_COPY_R00_PALETTE_ATTR).toBe("factory-dark");

    for (const locale of BROWSER_VISUAL_REVIEW_LOCALES) {
      const messages = await loadUiMessages(locale);
      const explorer = resolveExplorerMessages(messages);
      const signature = buildExplorerTreeSignature(
        localizePageTree(source.pageTree, locale, { messages }),
      );

      expect(signature.rootName).toBe(DOCS_PAGE_TREE_ROOT_NAME);
      expect(topLevelFolderNames(signature)).toContain(
        explorer.folders.documentation,
      );
      expect(topLevelFolderNames(signature)).not.toContain("Glossary");
      expect(
        topLevelPageEntries(signature).some(
          (entry) =>
            entry.url === DOCS_EXPLORER_TOP_LEVEL_FAQ_URL ||
            entry.url.endsWith("/docs/documentation/faq"),
        ),
      ).toBe(true);
    }
  });

  test("mobile docs drawer exposes review chrome markers when open", async () => {
    expect([...BROWSER_VISUAL_REVIEW_MOBILE_DRAWER_MARKERS]).toEqual([
      MOBILE_DRAWER_MOTION_CHROME,
      "mobile-drawer-backdrop",
    ]);

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

    const menuButton = screen.getByRole("button", {
      name: context.messages.nav.menu,
    });
    await act(async () => {
      menuButton.click();
    });

    const drawer = document.querySelector(
      `[data-motion-chrome="${BROWSER_VISUAL_REVIEW_MOBILE_DRAWER_MARKERS[0]}"]`,
    );
    expect(drawer).not.toBeNull();
    expect(drawer?.getAttribute("role")).toBe("dialog");
    expect(
      document.querySelector(
        `[data-motion-chrome="${BROWSER_VISUAL_REVIEW_MOBILE_DRAWER_MARKERS[1]}"]`,
      ),
    ).not.toBeNull();
  });
});
