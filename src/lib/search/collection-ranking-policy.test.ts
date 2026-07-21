/**
 * Story repair-search-collection-ranking-policy-003: lock guides >
 * curated reference owning pages > blog > reference subfields for a
 * representative generic query, and keep #154 exact page-title /
 * exact inventory wins green on the same live search path.
 */
import { describe, expect, test } from "bun:test";
import { resetReferenceItemSearchDocumentsCacheForTests } from "./index";
import {
  rerankSearchResults,
  SEARCH_COLLECTION_BAND,
  searchCollectionBand,
} from "./rerank-search-results";
import { docsSearchApi } from "./search-server";
import type { SearchDocument } from "./types";

type SearchHit = {
  url: string;
  type?: string;
  content?: string;
};

function documentForUrl(
  url: string,
  overrides: Partial<SearchDocument> = {},
): SearchDocument {
  return {
    id: url,
    url,
    kind: "glossary",
    title: "Architecture",
    description: "Architecture description",
    bodyText: "",
    headings: [],
    directAliases: [],
    aliases: [],
    tags: [],
    relatedIds: [],
    facets: { kind: "glossary", tags: [] },
    topology: {
      secondaryClassificationIds: [],
      secondaryClassifications: [],
      relationships: [],
      terms: [],
    },
    ...overrides,
  };
}

function firstIndexMatching(
  results: readonly SearchHit[],
  predicate: (result: SearchHit) => boolean,
): number {
  return results.findIndex(predicate);
}

function isGuideUrl(url: string): boolean {
  return url === "/docs/guides" || url.startsWith("/docs/guides/");
}

function isCuratedReferenceOwningPageUrl(url: string): boolean {
  if (url.includes("#")) {
    return false;
  }
  return url === "/docs/references" || url.startsWith("/docs/references/");
}

function isBlogUrl(url: string): boolean {
  return url === "/blog" || url.startsWith("/blog/");
}

function isReferenceSubfieldUrl(url: string): boolean {
  return url.startsWith("/docs/references/") && url.includes("#");
}

describe("collection ranking policy", () => {
  test("representative generic fixture ranks guide > curated ref > blog > subfield", () => {
    const guideUrl = "/docs/guides/write-review-loop";
    const curatedRefUrl = "/docs/references/cli";
    const blogUrl = "/blog/agent-factories";
    const subfieldUrl = `${curatedRefUrl}#you-run`;
    const headingSpam = `${curatedRefUrl}#heading-0`;
    const documentsByUrl = new Map<string, SearchDocument>([
      [
        guideUrl,
        documentForUrl(guideUrl, {
          kind: "guide",
          title: "Write-review loop",
          facets: { kind: "guide", tags: ["loops"] },
        }),
      ],
      [
        curatedRefUrl,
        documentForUrl(curatedRefUrl, {
          kind: "reference",
          title: "CLI",
          facets: { kind: "reference", tags: ["cli"] },
        }),
      ],
      [
        blogUrl,
        documentForUrl(blogUrl, {
          kind: "blog",
          title: "Agent factories",
          facets: { kind: "blog", tags: ["factories"] },
        }),
      ],
      [
        subfieldUrl,
        documentForUrl(subfieldUrl, {
          kind: "reference",
          title: "you run",
          directAliases: ["you run"],
          aliases: ["you run"],
          facets: { kind: "reference", tags: ["cli"] },
        }),
      ],
    ]);

    const results = rerankSearchResults(
      "loops",
      [
        {
          id: headingSpam,
          type: "heading",
          url: headingSpam,
          content: "loops and iteration",
        },
        {
          id: subfieldUrl,
          type: "page",
          url: subfieldUrl,
          content: "you run",
        },
        {
          id: blogUrl,
          type: "page",
          url: blogUrl,
          content: "Agent factories",
        },
        {
          id: curatedRefUrl,
          type: "page",
          url: curatedRefUrl,
          content: "CLI",
        },
        {
          id: guideUrl,
          type: "page",
          url: guideUrl,
          content: "Write-review loop",
        },
      ],
      documentsByUrl,
    );

    const guideIndex = results.findIndex((result) => result.url === guideUrl);
    const curatedIndex = results.findIndex(
      (result) => result.url === curatedRefUrl,
    );
    const blogIndex = results.findIndex((result) => result.url === blogUrl);
    const subfieldIndex = results.findIndex(
      (result) => result.url === subfieldUrl,
    );
    const headingIndex = results.findIndex(
      (result) => result.url === headingSpam,
    );

    expect(guideIndex).toBeLessThan(curatedIndex);
    expect(curatedIndex).toBeLessThan(blogIndex);
    expect(blogIndex).toBeLessThan(subfieldIndex);
    expect(subfieldIndex).toBeLessThanOrEqual(headingIndex);

    expect(
      searchCollectionBand(
        {
          id: guideUrl,
          type: "page",
          url: guideUrl,
          content: "Write-review loop",
        },
        documentsByUrl.get(guideUrl),
      ),
    ).toBe(SEARCH_COLLECTION_BAND.guide);
    expect(
      searchCollectionBand(
        {
          id: curatedRefUrl,
          type: "page",
          url: curatedRefUrl,
          content: "CLI",
        },
        documentsByUrl.get(curatedRefUrl),
      ),
    ).toBe(SEARCH_COLLECTION_BAND.curatedReferencePage);
    expect(
      searchCollectionBand(
        { id: blogUrl, type: "page", url: blogUrl, content: "Agent factories" },
        documentsByUrl.get(blogUrl),
      ),
    ).toBe(SEARCH_COLLECTION_BAND.blog);
    expect(
      searchCollectionBand(
        {
          id: subfieldUrl,
          type: "page",
          url: subfieldUrl,
          content: "you run",
        },
        documentsByUrl.get(subfieldUrl),
      ),
    ).toBe(SEARCH_COLLECTION_BAND.referenceSubfield);
  });

  test("live generic cursor query keeps guide before curated ref before blog before subfield", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("cursor");
    expect(results.length).toBeGreaterThan(0);

    const guideIndex = firstIndexMatching(results, (result) =>
      isGuideUrl(result.url),
    );
    const curatedIndex = firstIndexMatching(results, (result) =>
      isCuratedReferenceOwningPageUrl(result.url),
    );
    const blogIndex = firstIndexMatching(results, (result) =>
      isBlogUrl(result.url),
    );
    const subfieldIndex = firstIndexMatching(results, (result) =>
      isReferenceSubfieldUrl(result.url),
    );

    expect(guideIndex).toBeGreaterThanOrEqual(0);
    expect(curatedIndex).toBeGreaterThanOrEqual(0);
    expect(blogIndex).toBeGreaterThanOrEqual(0);
    expect(subfieldIndex).toBeGreaterThanOrEqual(0);

    expect(guideIndex).toBeLessThan(curatedIndex);
    expect(curatedIndex).toBeLessThan(blogIndex);
    expect(blogIndex).toBeLessThan(subfieldIndex);
  });

  test("exact page-title harness still outranks weak collection-band noise", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("harness");
    expect(results[0]?.url).toBe("/docs/concepts/harness");

    const firstGuide = firstIndexMatching(results, (result) =>
      isGuideUrl(result.url),
    );
    const firstCurated = firstIndexMatching(results, (result) =>
      isCuratedReferenceOwningPageUrl(result.url),
    );
    const firstBlog = firstIndexMatching(results, (result) =>
      isBlogUrl(result.url),
    );
    const firstSubfield = firstIndexMatching(results, (result) =>
      isReferenceSubfieldUrl(result.url),
    );

    for (const index of [firstGuide, firstCurated, firstBlog, firstSubfield]) {
      if (index >= 0) {
        expect(index).toBeGreaterThan(0);
      }
    }
  });

  test("exact inventory identifier still returns the item deep link first", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("you.factory_session.get");
    expect(results[0]?.url).toBe(
      "/docs/references/mcp-reference#you.factory_session.get",
    );
  });

  test("exact mcp page-title hits stay ahead of residual inventory and heading spam", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("mcp");
    expect(results.length).toBeGreaterThan(0);

    const documentationIndex = firstIndexMatching(
      results,
      (result) => result.url === "/docs/documentation/mcp",
    );
    const referencesIndex = firstIndexMatching(
      results,
      (result) => result.url === "/docs/references/mcp-reference",
    );
    expect(documentationIndex).toBeGreaterThanOrEqual(0);
    expect(referencesIndex).toBeGreaterThanOrEqual(0);

    const firstInventoryIndex = firstIndexMatching(
      results,
      (result) =>
        result.url.startsWith("/docs/references/mcp-reference#") ||
        result.url.startsWith("/docs/references/cli#you-mcp"),
    );
    expect(firstInventoryIndex).toBeGreaterThanOrEqual(0);
    expect(documentationIndex).toBeLessThan(firstInventoryIndex);
    expect(referencesIndex).toBeLessThan(firstInventoryIndex);

    expect(
      results.some(
        (result) =>
          result.type === "heading" || /#heading-\d+/i.test(result.url),
      ),
    ).toBe(false);
  });
});
