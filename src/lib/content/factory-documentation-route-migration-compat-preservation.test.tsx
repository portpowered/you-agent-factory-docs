/**
 * Story repair-moved-duplicate-doc-stubs-003: after demoting W18 move stubs
 * from explorer/search discovery, every §10 old route still publishes static
 * compatibility HTML, family Metadata canonical, and sitemap exclusion.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS,
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
  DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM,
  documentationRouteMigrationOldRouteToSlug,
  isDocumentationRouteMigrationLedgerFullyClosed,
  isDocumentationRouteStaticCompatibilityMechanismExportSafe,
  listDocumentationRouteMigrationOldRoutes,
  listOpenDocumentationRouteMigrationRows,
} from "@/lib/seo/documentation-route-migration";
import {
  isCanonicalPublicDiscoveryPath,
  isLiveFactoryCanonicalPath,
} from "@/lib/seo/export-absolute-canonical";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 90_000;

describe("factory documentation W18 move-stub compatibility preservation", () => {
  afterEach(() => {
    cleanup();
  });

  test("ledger stays fully closed with the locked static-export mechanism", () => {
    expect(DOCUMENTATION_ROUTE_MIGRATION_LEDGER).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(listOpenDocumentationRouteMigrationRows()).toEqual([]);
    expect(isDocumentationRouteMigrationLedgerFullyClosed()).toBe(true);
    expect(isDocumentationRouteStaticCompatibilityMechanismExportSafe()).toBe(
      true,
    );
    expect(
      DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM.forbiddenRedirectMechanisms,
    ).toEqual([...DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS]);
  });

  test("every §10 old route remains published for compatibility HTML", () => {
    const publishedUrls = new Set(
      loadPublishedDocsPagesSync("en").map((page) => page.url),
    );
    const sitemap = new Set(listPublicSitemapRoutes());

    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(publishedUrls.has(oldRoute)).toBe(true);
      expect(isLiveFactoryCanonicalPath(oldRoute)).toBe(true);
      expect(isCanonicalPublicDiscoveryPath(oldRoute)).toBe(false);
      expect(sitemap.has(oldRoute)).toBe(false);

      const slug = documentationRouteMigrationOldRouteToSlug(oldRoute);
      const fumadocsPage = source.getPage(slug);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(oldRoute);
    }
  });

  test(
    "every demoted stub still renders compatibility HTML + family Metadata canonical",
    async () => {
      for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
        const slug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
        expect(slug?.[0]).toBe("documentation");
        const pageSlug = slug?.slice(1).join("/") ?? "";

        const loadedPage = await loadLocalDocsPage({
          section: "documentation",
          slug: pageSlug,
        });

        expect(loadedPage.messages.description).toContain(row.targetRoute);
        expect(String(loadedPage.messages.sections?.moved?.body ?? "")).toMatch(
          /moved to a new family route/i,
        );

        const { unmount } = render(
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            {loadedPage.content}
          </DocsPageProviders>,
        );

        const root = document.querySelector(
          "[data-documentation-route-compatibility]",
        );
        expect(root).toBeTruthy();
        expect(root?.getAttribute("data-compatibility-old-route")).toBe(
          row.oldRoute,
        );
        expect(root?.getAttribute("data-compatibility-target-route")).toBe(
          row.targetRoute,
        );

        const link = root?.querySelector(
          "[data-compatibility-target-link]",
        ) as HTMLAnchorElement | null;
        expect(link).toBeTruthy();
        expect(link?.getAttribute("href")).toBe(row.targetRoute);

        unmount();
        cleanup();

        const metadata = await buildDocsPageMetadata(slug ?? []);
        expect(metadata.alternates?.canonical).toBe(row.targetRoute);
        expect(metadata.openGraph?.url).toBe(row.targetRoute);
      }
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
