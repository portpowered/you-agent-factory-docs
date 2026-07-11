/**
 * Story converge-factory-search-navigation-008 proof: empty, malformed,
 * unavailable-index, and deleted-content search/nav cases stay factory-only.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogPostPage,
  renderBrowseIndexPage,
  renderTagsIndexPage,
} from "@/app/(site)/site-renderers";
import { generateStaticParams as generateLocalizedDocsStaticParams } from "@/app/[locale]/docs/[[...slug]]/page";
import { generateStaticParams as generateDefaultDocsStaticParams } from "@/app/docs/[[...slug]]/page";
import { renderDocsSlugPage } from "@/app/docs/docs-slug-renderer";
import { resolveFactorySearchBootstrapFrom } from "@/lib/content/factory-locale-base-path";
import { resolveFactoryDocsFooterNeighbors } from "@/lib/content/factory-prev-next-related";
import {
  assertFactorySearchEmptySuggestionCopy,
  assertFactorySearchEmptySuggestionHref,
  assertFactorySearchNavOmitsDeletedContent,
  assertFactorySearchUnavailableCopy,
  containsRetiredAtlasSearchHandoff,
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  DELETED_ATLAS_TAG_SLUGS,
  FACTORY_MALFORMED_SEARCH_CLASSIFICATIONS,
  FACTORY_SEARCH_EMPTY_SUGGESTION_HREF,
  FACTORY_SEARCH_EMPTY_SUGGESTION_TERM,
  FACTORY_SEARCH_UNAVAILABLE_TEST_IDS,
  isDeletedAiSearchUrl,
  RETIRED_ATLAS_SEARCH_HANDOFF_TERMS,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
  resolveFactorySearchEmptySuggestion,
} from "@/lib/content/factory-search-edge-cases";
import { resolveRelatedRegistryDocs } from "@/lib/content/related-registry-docs";
import { loadPublishedTagIndexEntries } from "@/lib/content/tags";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import { resolveSearchClassificationScope } from "@/lib/search/classification-scope";
import { documentsByUrlFromMeta } from "@/lib/search/collapse-search-results-from-meta";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";
import { source } from "@/lib/source";

const NO_MATCH_QUERY = "zzzz-no-matches-zzzz-factory-edge";

function expectNotFound(error: unknown): void {
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toMatch(
    /notFound\(\)|NEXT_HTTP_ERROR_FALLBACK;404/,
  );
}

describe("factory search edge cases", () => {
  test("empty suggestion contract points at harness + ralph, not Atlas handoffs", () => {
    expect(FACTORY_SEARCH_EMPTY_SUGGESTION_TERM).toBe("harness");
    expect(FACTORY_SEARCH_EMPTY_SUGGESTION_HREF).toBe("/docs/techniques/ralph");
    expect(containsRetiredAtlasSearchHandoff("Try GQA or attention")).toBe(
      true,
    );
    expect(containsRetiredAtlasSearchHandoff("Try harness or ralph")).toBe(
      false,
    );

    expect(() =>
      assertFactorySearchEmptySuggestionCopy({
        emptySuggestionTerm: "GQA",
        emptySuggestionLinkLabel: "attention module",
      }),
    ).toThrow(/must be "harness"|retired Atlas handoffs/);

    expect(() =>
      assertFactorySearchEmptySuggestionHref("/docs/modules/attention"),
    ).toThrow(/must resolve to/);

    assertFactorySearchEmptySuggestionHref(
      FACTORY_SEARCH_EMPTY_SUGGESTION_HREF,
    );
    assertFactorySearchEmptySuggestionHref(
      `/ja${FACTORY_SEARCH_EMPTY_SUGGESTION_HREF}`,
    );
  });

  test("shipped locales keep factory empty and unavailable search copy", async () => {
    for (const locale of supportedLocales) {
      const messages = await loadUiMessages(locale);
      assertFactorySearchEmptySuggestionCopy({
        emptySuggestionTerm: messages.searchEntry.emptySuggestionTerm,
        emptySuggestionLinkLabel: messages.searchEntry.emptySuggestionLinkLabel,
        emptySuggestionPrefix: messages.searchEntry.emptySuggestionPrefix,
        emptySuggestionMiddle: messages.searchEntry.emptySuggestionMiddle,
        emptySuggestionSuffix: messages.searchEntry.emptySuggestionSuffix,
        noResults: messages.search.noResults,
      });
      assertFactorySearchUnavailableCopy({
        error: messages.search.error,
        retry: messages.search.retry,
      });

      const suggestion = resolveFactorySearchEmptySuggestion(locale, {
        emptySuggestionTerm: messages.searchEntry.emptySuggestionTerm,
        emptySuggestionLinkLabel: messages.searchEntry.emptySuggestionLinkLabel,
        emptySuggestionPrefix: messages.searchEntry.emptySuggestionPrefix,
        emptySuggestionMiddle: messages.searchEntry.emptySuggestionMiddle,
        emptySuggestionSuffix: messages.searchEntry.emptySuggestionSuffix,
        noResults: messages.search.noResults,
      });
      expect(suggestion.term).toBe(FACTORY_SEARCH_EMPTY_SUGGESTION_TERM);
      assertFactorySearchEmptySuggestionHref(suggestion.href);
      expect(suggestion.href).not.toMatch(/GQA|attention|modules/i);
    }
  });

  test("no-results search queries stay empty without deleted Atlas destinations", async () => {
    const results = await docsSearchApi.search(NO_MATCH_QUERY);
    expect(results).toEqual([]);

    for (const deleted of DELETED_ATLAS_RECORD_URLS) {
      expect(
        results.some((hit) => hit.type === "page" && hit.url === deleted),
      ).toBe(false);
    }
  });

  test("malformed classification params fall back to unscoped factory search", async () => {
    const metaByUrl = documentsByUrlFromMeta(
      searchResultMetaMapToRecord(await loadSearchResultMetaMap()),
    );
    const messages = await loadUiMessages();

    for (const classification of FACTORY_MALFORMED_SEARCH_CLASSIFICATIONS) {
      const scope = resolveSearchClassificationScope(classification, metaByUrl);
      expect(scope).toBeUndefined();
      expect(
        messages.searchEntry.classificationScopeDescription.replace(
          "{classification}",
          classification,
        ),
      ).not.toMatch(/GQA|grouped-query/i);
    }

    const harnessResults = await docsSearchApi.search("harness");
    expect(
      harnessResults.some((hit) => hit.url === "/docs/concepts/harness"),
    ).toBe(true);
  });

  test("unavailable search bootstrap stays on factory paths with error/retry chrome", async () => {
    expect([...FACTORY_SEARCH_UNAVAILABLE_TEST_IDS]).toEqual([
      "search-page-error",
      "search-dialog-error",
    ]);

    for (const locale of supportedLocales) {
      const bootstrapFrom = resolveFactorySearchBootstrapFrom(locale);
      expect(bootstrapFrom).toContain("/api/search");
      expect(bootstrapFrom).not.toMatch(/modules|models|papers|attention|GQA/i);
      expect(isDeletedAiSearchUrl(bootstrapFrom)).toBe(false);
    }

    const messages = await loadUiMessages();
    assertFactorySearchUnavailableCopy({
      error: messages.search.error,
      retry: messages.search.retry,
    });
    expect(messages.search.error.toLowerCase()).toMatch(/unavailable|index/);
    expect(messages.search.retry.length).toBeGreaterThan(0);
  });

  test("deleted Atlas destinations remain not-found and undiscoverable from search/nav", async () => {
    for (const prefix of RETIRED_ATLAS_SEARCH_URL_PREFIXES) {
      const collectionId = prefix.replace("/docs/", "");
      try {
        await renderDocsSlugPage([collectionId]);
        throw new Error(`Expected ${prefix} to not-found`);
      } catch (error) {
        expectNotFound(error);
      }
    }

    for (const url of DELETED_ATLAS_BLOG_URLS) {
      const slug = url.replace("/blog/", "");
      try {
        await renderBlogPostPage(slug);
        throw new Error(`Expected ${url} to not-found`);
      } catch (error) {
        expectNotFound(error);
      }
    }

    const defaultSlugPaths = generateDefaultDocsStaticParams().map((entry) =>
      (entry.slug ?? []).join("/"),
    );
    const localizedSlugPaths = (await generateLocalizedDocsStaticParams()).map(
      (entry) => (entry.slug ?? []).join("/"),
    );
    for (const prefix of RETIRED_ATLAS_SEARCH_URL_PREFIXES) {
      const collectionId = prefix.replace("/docs/", "");
      expect(defaultSlugPaths).not.toContain(collectionId);
      expect(localizedSlugPaths).not.toContain(collectionId);
    }

    for (const query of [
      "grouped-query attention",
      "GQA",
      "evolution of diffusion",
    ] as const) {
      const results = await docsSearchApi.search(query);
      assertFactorySearchNavOmitsDeletedContent(
        results.filter((hit) => hit.type === "page").map((hit) => hit.url),
      );
    }

    const messages = await loadUiMessages();
    const tagEntries = await loadPublishedTagIndexEntries(messages, "en");
    for (const slug of DELETED_ATLAS_TAG_SLUGS) {
      expect(tagEntries.some((entry) => entry.slug === slug)).toBe(false);
    }

    const browseHtml = renderToStaticMarkup(await renderBrowseIndexPage());
    const tagsHtml = renderToStaticMarkup(await renderTagsIndexPage());
    for (const url of DELETED_ATLAS_RECORD_URLS) {
      expect(browseHtml).not.toContain(`href="${url}"`);
      expect(tagsHtml).not.toContain(`href="${url}"`);
    }
    for (const term of RETIRED_ATLAS_SEARCH_HANDOFF_TERMS) {
      if (term === "attention" || term === "KV cache") {
        continue;
      }
      expect(browseHtml).not.toContain(term);
      expect(tagsHtml).not.toContain(term);
    }

    const pageTree = localizePageTree(source.getPageTree(), "en");
    for (const href of [
      "/docs/guides/getting-started",
      "/docs/concepts/harness",
      "/docs/techniques/ralph",
    ]) {
      const neighbors = resolveFactoryDocsFooterNeighbors(pageTree, href);
      assertFactorySearchNavOmitsDeletedContent(
        [neighbors.previous?.url, neighbors.next?.url].filter(
          (value): value is string => Boolean(value),
        ),
      );
    }

    const related = resolveRelatedRegistryDocs([
      "concept.bottlenecks",
      "concept.harness",
    ]);
    assertFactorySearchNavOmitsDeletedContent(
      related.available.map((item) => item.href),
    );
  });
});
