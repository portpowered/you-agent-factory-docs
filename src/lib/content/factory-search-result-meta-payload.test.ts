/**
 * W16 story 008 mergeability: client layout meta must omit reference item
 * documents so static-export RSC/HTML payloads stay near the pre-W16 size.
 */
import { describe, expect, test } from "bun:test";
import { resolveSearchResultMeta } from "@/features/docs/search/search-result-meta-client";
import {
  buildReferenceItemSearchDocuments,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "@/lib/search";
import { collapseSearchResultsToPageHits } from "@/lib/search/collapse-search-results-to-page-hits";
import { buildSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";
import type { SearchDocument } from "@/lib/search/types";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "@/lib/search/types";

describe("factory search result meta payload (W16)", () => {
  test("layout meta omits reference item documents", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = buildReferenceItemSearchDocuments({ fresh: true });
    const meta = buildSearchResultMetaMap(documents);

    expect(documents.length).toBeGreaterThan(0);
    expect(meta.size).toBe(0);
    expect(meta.has("/docs/references/events#RUN_REQUEST")).toBe(false);
  });

  test("client meta resolver synthesizes reference kind for item deep links", () => {
    const meta = resolveSearchResultMeta(
      "/docs/references/events#RUN_REQUEST",
      {},
    );
    expect(meta).toEqual({
      title: "RUN_REQUEST",
      kind: REFERENCE_SEARCH_DOCUMENT_KIND,
      description: "",
      tags: [],
      aliases: [],
    });
  });

  test("collapse preserves reference deep links without item rows in meta", () => {
    const pageOnly = new Map<string, SearchDocument>([
      [
        "/docs/references/events",
        {
          id: "page:events",
          url: "/docs/references/events",
          kind: REFERENCE_SEARCH_DOCUMENT_KIND,
          title: "Events",
          description: "",
          bodyText: "",
          headings: [],
          directAliases: [],
          aliases: [],
          tags: ["reference"],
          relatedIds: [],
          facets: { kind: REFERENCE_SEARCH_DOCUMENT_KIND, tags: ["reference"] },
          topology: EMPTY_SEARCH_DOCUMENT_TOPOLOGY,
        },
      ],
    ]);

    const collapsed = collapseSearchResultsToPageHits(
      [
        {
          id: "1",
          type: "page",
          url: "/docs/references/events#RUN_REQUEST",
          content: "RUN_REQUEST",
        },
        {
          id: "2",
          type: "page",
          url: "/docs/references/events",
          content: "Events",
        },
      ],
      pageOnly,
    );

    expect(collapsed.map((result) => result.url)).toEqual([
      "/docs/references/events#RUN_REQUEST",
      "/docs/references/events",
    ]);
  });

  test("serialized layout meta without items stays small", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = buildReferenceItemSearchDocuments({ fresh: true });
    const metaRecord = searchResultMetaMapToRecord(
      buildSearchResultMetaMap(documents),
    );
    const metaBytes = Buffer.byteLength(JSON.stringify(metaRecord), "utf8");

    expect(Object.keys(metaRecord)).toHaveLength(0);
    expect(metaBytes).toBeLessThan(8);
  });
});
