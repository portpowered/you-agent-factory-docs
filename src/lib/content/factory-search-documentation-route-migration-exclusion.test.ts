/**
 * Story repair-moved-duplicate-doc-stubs-002: W18 documentation move stubs stay
 * out of ordinary public search documents while family targets remain findable.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { loadBlogSearchPostSources } from "@/lib/search/build-blog-search-document";
import { buildSearchDocumentsForLocale } from "@/lib/search/build-documents";
import { docsSearchApi } from "@/lib/search/search-server";
import { toAdvancedSearchIndexes } from "@/lib/search/to-advanced-index";
import {
  listDocumentationRouteMigrationOldRoutes,
  listDocumentationRouteMigrationTargetRoutes,
} from "@/lib/seo/documentation-route-migration";

const FAMILY_SEARCH_CASES = [
  { query: "agent workers", url: "/docs/workers/agent" },
  { query: "packaged factories", url: "/docs/factories/packaged" },
  { query: "api reference", url: "/docs/references/api" },
] as const;

describe("factory search W18 documentation move-stub exclusion", () => {
  test("public search documents and advanced indexes omit §10 old stub URLs", async () => {
    const indexes = await loadRegistry();
    const [pages, blogPosts] = await Promise.all([
      loadPublishedDocsPages("en"),
      loadBlogSearchPostSources({ locale: "en" }),
    ]);
    const documents = buildSearchDocumentsForLocale(
      "en",
      indexes,
      pages,
      blogPosts,
    );
    const documentUrls = new Set(documents.map((document) => document.url));
    const advancedUrls = new Set(
      toAdvancedSearchIndexes(documents).map((entry) => entry.url),
    );

    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(documentUrls.has(oldRoute)).toBe(false);
      expect(advancedUrls.has(oldRoute)).toBe(false);
      // Compatibility pages remain published even when search omits them.
      expect(pages.some((page) => page.url === oldRoute)).toBe(true);
    }

    for (const targetRoute of listDocumentationRouteMigrationTargetRoutes()) {
      if (!pages.some((page) => page.url === targetRoute)) {
        continue;
      }
      expect(documentUrls.has(targetRoute)).toBe(true);
    }
  });

  test.each([
    ...FAMILY_SEARCH_CASES,
  ])("search still surfaces family destination for $query", async ({
    query,
    url,
  }) => {
    const results = await docsSearchApi.search(query);
    expect(results.some((result) => result.url === url)).toBe(true);
    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(results.some((result) => result.url === oldRoute)).toBe(false);
    }
  });
});
