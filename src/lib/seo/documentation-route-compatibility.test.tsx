/**
 * W18 story 002: every §10 old route still publishes as static-compatible HTML
 * that identifies and links to its family target (no silent removal).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import {
  buildDocsCatchAllStaticParamsFromDocsSlugs,
  mergeDocsCatchAllStaticParams,
} from "@/lib/content/docs-catch-all-static-params";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
  documentationRouteMigrationOldRouteToSlug,
  isDocumentationRouteMigrationOldSlug,
  listDocumentationRouteMigrationOldSlugs,
} from "@/lib/seo/documentation-route-migration";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 60_000;

describe("documentation route migration compatibility documents", () => {
  afterEach(() => {
    cleanup();
  });

  test("enumerates a catch-all slug for every §10 old route", () => {
    const slugs = listDocumentationRouteMigrationOldSlugs();
    expect(slugs).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );

    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      const slug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
      expect(slug).toBeDefined();
      expect(isDocumentationRouteMigrationOldSlug(slug)).toBe(true);
      expect(`/docs/${slug?.join("/")}`).toBe(row.oldRoute);
    }

    expect(isDocumentationRouteMigrationOldSlug(["documentation", "faq"])).toBe(
      false,
    );
    expect(isDocumentationRouteMigrationOldSlug(["references", "api"])).toBe(
      false,
    );
  });

  test("keeps every §10 old route in published docs + catch-all static params", () => {
    const publishedSlugs = new Set(
      loadPublishedDocsPagesSync("en").map((page) => page.docsSlug),
    );
    const fromSource = source.generateParams();
    const fromPublished = buildDocsCatchAllStaticParamsFromDocsSlugs(
      loadPublishedDocsPagesSync("en").map((page) => page.docsSlug),
    );
    const merged = mergeDocsCatchAllStaticParams(fromSource, fromPublished);
    const mergedKeys = new Set(
      merged.map((entry) => (entry.slug ?? []).join("/")),
    );

    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      const slug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
      expect(slug).toBeDefined();
      const docsSlug = slug?.join("/") ?? "";
      expect(publishedSlugs.has(docsSlug)).toBe(true);
      expect(mergedKeys.has(docsSlug)).toBe(true);

      const fumadocsPage = source.getPage(slug);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(row.oldRoute);
    }
  });

  test(
    "renders compatibility HTML with a navigable target link for every §10 row",
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
      }
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
