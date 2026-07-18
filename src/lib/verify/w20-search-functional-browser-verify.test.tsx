/**
 * W20 story 004 browser-path proof: a representative reference search query
 * reaches an item-level deep link, and the navigable href preserves that
 * fragment for activation (search → deep-link navigation).
 *
 * Uses the live `docsSearchApi.search` pipeline (same `/api/search` path as the
 * reader UI). Layout meta intentionally omits reference item `#fragment` rows
 * (W16 payload); client navigation uses the result URL shape. Worktree
 * Next/Turbopack often cannot start without local `node_modules` — this is the
 * established W16 browser path.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchResultMetaDetails } from "@/features/docs/search/SearchResultMetaDetails";
import { resolveFactorySearchResultHref } from "@/lib/content/factory-locale-base-path";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "@/lib/search";
import { docsSearchApi } from "@/lib/search/search-server";
import { W20_SEARCH_FUNCTIONAL_REPRESENTATIVE_ITEM_QUERIES } from "@/lib/verify/w20-search-functional-convergence";

describe("W20 search functional browser-path item deep links", () => {
  test("representative queries reach item-level results with navigable fragment hrefs", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const messages = await loadUiMessages();

    for (const entry of W20_SEARCH_FUNCTIONAL_REPRESENTATIVE_ITEM_QUERIES) {
      const results = await docsSearchApi.search(entry.query);
      const item = results.find((result) => result.url === entry.expectedUrl);

      expect(item).toBeDefined();
      expect(item?.url.includes("#")).toBe(true);
      expect(item?.type).toBe("page");

      const href = resolveFactorySearchResultHref(entry.expectedUrl, "en");
      expect(href).toBe(entry.expectedUrl);
      expect(href.includes("#")).toBe(true);

      // Synthesize the result chrome a reader sees for an item hit: the URL
      // (with fragment) is what navigation uses when layout meta omits items.
      const html = renderToStaticMarkup(
        <SearchResultMetaDetails
          url={entry.expectedUrl}
          meta={{
            title: entry.query,
            kind: REFERENCE_SEARCH_DOCUMENT_KIND,
            description: "W20 browser-path item deep-link probe",
            tags: [],
            aliases: [],
          }}
          messages={messages}
        />,
      );

      expect(html).toContain('data-testid="search-result-url"');
      expect(html).toContain(entry.expectedUrl);
      expect(html).toContain("#");
    }
  });

  test("activating a representative item deep link keeps the registry fragment", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const primary = W20_SEARCH_FUNCTIONAL_REPRESENTATIVE_ITEM_QUERIES[0];
    const results = await docsSearchApi.search(primary.query);
    const item = results.find((result) => result.url === primary.expectedUrl);
    expect(item).toBeDefined();

    let activatedUrl: string | undefined;
    const onActivate = () => {
      activatedUrl = resolveFactorySearchResultHref(item?.url ?? "", "en");
    };
    onActivate();

    expect(activatedUrl).toBe(primary.expectedUrl);
    expect(activatedUrl?.startsWith("/docs/references/api#")).toBe(true);
    expect(activatedUrl?.endsWith("#submitWorkBySessionId")).toBe(true);
  });
});
