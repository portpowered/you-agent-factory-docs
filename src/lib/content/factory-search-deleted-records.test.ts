/**
 * Story converge-factory-search-navigation-003 proof: deleted AI records and
 * retired Atlas routes never appear in public search documents or results.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { loadBlogSearchPostSources } from "@/lib/search/build-blog-search-document";
import { buildSearchDocumentsForLocale } from "@/lib/search/build-documents";
import {
  assertNoDeletedAiSearchDocuments,
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  isDeletedAiSearchUrl,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
  stripSearchUrlLocalePrefix,
} from "@/lib/search/factory-search-deleted-records";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";
import { toAdvancedSearchIndexes } from "@/lib/search/to-advanced-index";

const DELETED_INVENTORY_QUERIES = [
  "grouped-query attention",
  "GQA",
  "evolution of diffusion",
] as const;

const LIVE_FACTORY_CASES = [
  { query: "harness", url: "/docs/concepts/harness" },
  { query: "ralph", url: "/docs/techniques/ralph" },
] as const;

function assertNoDeletedAiUrls(urls: Iterable<string>) {
  for (const url of urls) {
    expect(isDeletedAiSearchUrl(url)).toBe(false);
    for (const deleted of DELETED_ATLAS_RECORD_URLS) {
      expect(url).not.toBe(deleted);
      expect(stripSearchUrlLocalePrefix(url)).not.toBe(deleted);
    }
  }
}

describe("factory search deleted AI record exclusion", () => {
  test("deleted Atlas URL helpers fail closed for retired inventory", () => {
    for (const prefix of RETIRED_ATLAS_SEARCH_URL_PREFIXES) {
      expect(isDeletedAiSearchUrl(prefix)).toBe(true);
      expect(isDeletedAiSearchUrl(`${prefix}/example`)).toBe(true);
      expect(isDeletedAiSearchUrl(`/ja${prefix}/example`)).toBe(true);
      expect(isDeletedAiSearchUrl(`/zh-CN${prefix}/example`)).toBe(true);
      expect(isDeletedAiSearchUrl(`/vi${prefix}/example`)).toBe(true);
    }

    for (const url of DELETED_ATLAS_RECORD_URLS) {
      expect(isDeletedAiSearchUrl(url)).toBe(true);
      expect(isDeletedAiSearchUrl(`/ja${url}`)).toBe(true);
    }

    expect(isDeletedAiSearchUrl("/docs/concepts/harness")).toBe(false);
    expect(isDeletedAiSearchUrl("/blog/bottlenecks")).toBe(false);
    expect(isDeletedAiSearchUrl("/ja/docs/techniques/ralph")).toBe(false);

    expect(() =>
      assertNoDeletedAiSearchDocuments([
        { url: "/docs/modules/grouped-query-attention" },
      ]),
    ).toThrow(/deleted Atlas inventory/);
    expect(() =>
      assertNoDeletedAiSearchDocuments([
        { url: "/blog/evolution-of-diffusion" },
      ]),
    ).toThrow(/deleted Atlas inventory/);
  });

  test("public search documents and advanced indexes omit deleted AI URLs", async () => {
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
    const urls = documents.map((document) => document.url);
    const advancedUrls = toAdvancedSearchIndexes(documents).map(
      (entry) => entry.url,
    );

    expect(urls.length).toBeGreaterThan(0);
    assertNoDeletedAiUrls(urls);
    assertNoDeletedAiUrls(advancedUrls);

    for (const deleted of DELETED_ATLAS_BLOG_URLS) {
      expect(urls).not.toContain(deleted);
      expect(advancedUrls).not.toContain(deleted);
    }
  });

  test("search result meta and API catalog omit deleted AI record URLs", async () => {
    const metaByUrl = await loadSearchResultMetaMap("en");
    expect(metaByUrl.size).toBeGreaterThan(0);
    assertNoDeletedAiUrls(metaByUrl.keys());

    for (const query of DELETED_INVENTORY_QUERIES) {
      const results = await docsSearchApi.search(query);
      assertNoDeletedAiUrls(results.map((result) => result.url));
      for (const deleted of DELETED_ATLAS_RECORD_URLS) {
        expect(results.some((result) => result.url === deleted)).toBe(false);
      }
    }
  });

  test(
    "live factory pages remain searchable after deleted-record exclusion",
    async () => {
      for (const { query, url } of LIVE_FACTORY_CASES) {
        const results = await docsSearchApi.search(query);
        expect(results.length).toBeGreaterThan(0);
        expect(
          results.some((result) => result.url === url),
          `expected ${url} for query "${query}"`,
        ).toBe(true);
        assertNoDeletedAiUrls(results.map((result) => result.url));
      }
    },
    { timeout: 20_000 },
  );
});
