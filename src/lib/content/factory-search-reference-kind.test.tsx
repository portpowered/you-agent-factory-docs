/**
 * Story refs-w16-search-anchor-projection-001 proof: `reference` is a live
 * factory search kind for page and item documents, with reader-visible labels.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchResultMetaDetails } from "@/features/docs/search/SearchResultMetaDetails";
import { formatPageKind, loadUiMessages } from "@/lib/content/ui-messages";
import { REFERENCE_SEARCH_DOCUMENT_KIND as W04_REFERENCE_SEARCH_DOCUMENT_KIND } from "@/lib/references/reference-search-projection";
import {
  assertFactorySearchDocuments,
  FACTORY_SEARCH_RESULT_KINDS,
  isFactorySearchResultKind,
  isRetiredAtlasSearchResultKind,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  RETIRED_ATLAS_SEARCH_RESULT_KINDS,
} from "@/lib/search/factory-search-kinds";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";

describe("factory search reference kind (W16-001)", () => {
  test("public search kinds include reference alongside other factory kinds", () => {
    expect(FACTORY_SEARCH_RESULT_KINDS).toContain(
      REFERENCE_SEARCH_DOCUMENT_KIND,
    );
    expect(REFERENCE_SEARCH_DOCUMENT_KIND).toBe("reference");
    expect(REFERENCE_SEARCH_DOCUMENT_KIND).toBe(
      W04_REFERENCE_SEARCH_DOCUMENT_KIND,
    );
    expect(isFactorySearchResultKind(REFERENCE_SEARCH_DOCUMENT_KIND)).toBe(
      true,
    );

    for (const kind of [
      "concept",
      "guide",
      "technique",
      "documentation",
      "glossary",
      "blog",
    ] as const) {
      expect(isFactorySearchResultKind(kind)).toBe(true);
    }

    for (const kind of RETIRED_ATLAS_SEARCH_RESULT_KINDS) {
      expect(isFactorySearchResultKind(kind)).toBe(false);
      expect(isRetiredAtlasSearchResultKind(kind)).toBe(true);
    }
  });

  test("item-shaped and page-shaped reference documents pass the factory kind assert", () => {
    expect(() =>
      assertFactorySearchDocuments([
        {
          kind: REFERENCE_SEARCH_DOCUMENT_KIND,
          url: "/docs/references/api",
        },
        {
          kind: REFERENCE_SEARCH_DOCUMENT_KIND,
          url: "/docs/references/api#submitWorkBySessionId",
        },
      ]),
    ).not.toThrow();

    expect(() =>
      assertFactorySearchDocuments([
        { kind: "module", url: "/docs/modules/grouped-query-attention" },
      ]),
    ).toThrow(/outside the factory search category set/);
  });

  test("a representative reference search result exposes kind reference", async () => {
    const metaByUrl = searchResultMetaMapToRecord(
      await loadSearchResultMetaMap(),
    );
    const messages = await loadUiMessages();
    const results = await docsSearchApi.search("events");

    expect(results.length).toBeGreaterThan(0);

    const referenceHit = results.find(
      (result) =>
        result.type === "page" && result.url === "/docs/references/events",
    );
    expect(referenceHit).toBeDefined();
    expect(referenceHit?.url).toBe("/docs/references/events");

    const meta = metaByUrl["/docs/references/events"];
    expect(meta).toBeDefined();
    expect(meta.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
    expect(isRetiredAtlasSearchResultKind(meta.kind)).toBe(false);

    const label = formatPageKind(messages, meta.kind);
    expect(label).toBe("Reference");
    expect(label).not.toBe(meta.kind);

    const html = renderToStaticMarkup(
      <SearchResultMetaDetails
        url="/docs/references/events"
        meta={meta}
        messages={messages}
      />,
    );
    expect(html).toContain(label);
    for (const retired of ["Model", "Module", "Paper", "Training", "System"]) {
      expect(html).not.toContain(`>${retired}<`);
    }
  });
});
