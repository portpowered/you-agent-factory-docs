/**
 * Story converge-factory-search-navigation-001 proof: public search categories
 * and result-kind labels stay on the factory-only set.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchResultMetaDetails } from "@/features/docs/search/SearchResultMetaDetails";
import { formatPageKind, loadUiMessages } from "@/lib/content/ui-messages";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import {
  assertFactorySearchDocuments,
  FACTORY_SEARCH_RESULT_KINDS,
  isFactorySearchResultKind,
  isRetiredAtlasSearchResultKind,
  RETIRED_ATLAS_SEARCH_RESULT_KINDS,
} from "@/lib/search/factory-search-kinds";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";

const FACTORY_CATEGORY_SET = [
  "concept",
  "guide",
  "technique",
  "documentation",
  "glossary",
  "blog",
] as const;

describe("factory search categories", () => {
  test("public search result kinds are exactly the factory category set", () => {
    expect([...FACTORY_SEARCH_RESULT_KINDS]).toEqual([...FACTORY_CATEGORY_SET]);

    for (const kind of FACTORY_CATEGORY_SET) {
      expect(isFactorySearchResultKind(kind)).toBe(true);
    }
    for (const kind of RETIRED_ATLAS_SEARCH_RESULT_KINDS) {
      expect(isFactorySearchResultKind(kind)).toBe(false);
      expect(isRetiredAtlasSearchResultKind(kind)).toBe(true);
    }

    expect(() =>
      assertFactorySearchDocuments([
        { kind: "module", url: "/docs/modules/grouped-query-attention" },
      ]),
    ).toThrow(/outside the factory search category set/);
  });

  test("pageKind labels advertise factory kinds only across shipped locales", async () => {
    for (const locale of supportedLocales) {
      const messages = await loadUiMessages(locale);
      const pageKindKeys = Object.keys(messages.pageKind).sort();

      expect(pageKindKeys).toEqual([...FACTORY_CATEGORY_SET].sort());
      for (const kind of RETIRED_ATLAS_SEARCH_RESULT_KINDS) {
        expect(messages.pageKind[kind]).toBeUndefined();
        expect(formatPageKind(messages, kind)).toBe(kind);
      }
      for (const kind of FACTORY_CATEGORY_SET) {
        expect(formatPageKind(messages, kind).length).toBeGreaterThan(0);
        expect(formatPageKind(messages, kind)).not.toBe(kind);
      }
    }
  });

  test("live search result meta kinds stay within the factory category set", async () => {
    const metaByUrl = await loadSearchResultMetaMap();
    expect(metaByUrl.size).toBeGreaterThan(0);

    const observedKinds = new Set<string>();
    for (const meta of metaByUrl.values()) {
      observedKinds.add(meta.kind);
      expect(isFactorySearchResultKind(meta.kind)).toBe(true);
      expect(isRetiredAtlasSearchResultKind(meta.kind)).toBe(false);
    }

    for (const kind of RETIRED_ATLAS_SEARCH_RESULT_KINDS) {
      expect(observedKinds.has(kind)).toBe(false);
    }
  });

  test("harness and ralph queries return only factory result kinds", async () => {
    const metaByUrl = searchResultMetaMapToRecord(
      await loadSearchResultMetaMap(),
    );
    const messages = await loadUiMessages();

    for (const query of ["harness", "ralph"] as const) {
      const results = await docsSearchApi.search(query);
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        if (result.type !== "page") {
          continue;
        }
        const meta = metaByUrl[result.url];
        expect(meta).toBeDefined();
        expect(isFactorySearchResultKind(meta.kind)).toBe(true);
        expect(isRetiredAtlasSearchResultKind(meta.kind)).toBe(false);

        const html = renderToStaticMarkup(
          <SearchResultMetaDetails
            url={result.url}
            meta={meta}
            messages={messages}
          />,
        );
        expect(html).toContain(formatPageKind(messages, meta.kind));
        for (const retired of [
          "Model",
          "Module",
          "Paper",
          "Training",
          "System",
        ]) {
          expect(html).not.toContain(`>${retired}<`);
        }
      }
    }

    const harness = await docsSearchApi.search("harness");
    expect(harness[0]?.url).toBe("/docs/concepts/harness");
    expect(metaByUrl["/docs/concepts/harness"]?.kind).toBe("concept");

    const ralph = await docsSearchApi.search("ralph");
    expect(ralph[0]?.url).toBe("/docs/techniques/ralph");
    expect(metaByUrl["/docs/techniques/ralph"]?.kind).toBe("technique");
  });
});
