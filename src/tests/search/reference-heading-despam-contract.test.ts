/**
 * Story repair-search-reference-heading-policy-004: lock reference heading
 * de-spam + page-title preference and exact inventory lookups as observable
 * search outcomes (URLs / kinds / titles after collapse/rerank).
 */
import { describe, expect, test } from "bun:test";
import { resetReferenceItemSearchDocumentsCacheForTests } from "@/lib/search";
import { docsSearchApi } from "@/lib/search/search-server";
import { resultsIncludeUrl } from "./helpers";

type SearchHit = {
  url: string;
  type?: string;
  content?: string;
};

function hasReferenceAutoHeadingSpam(results: readonly SearchHit[]): boolean {
  return results.some(
    (result) => result.type === "heading" || /#heading-\d+/i.test(result.url),
  );
}

function firstIndexMatching(
  results: readonly SearchHit[],
  predicate: (result: SearchHit) => boolean,
): number {
  return results.findIndex(predicate);
}

describe("reference heading de-spam search contract", () => {
  test("generic mcp prefers page titles and omits reference auto-heading spam", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("mcp");
    expect(results.length).toBeGreaterThan(0);
    expect(hasReferenceAutoHeadingSpam(results)).toBe(false);

    const documentationIndex = firstIndexMatching(
      results,
      (result) => result.url === "/docs/documentation/mcp",
    );
    const referencesIndex = firstIndexMatching(
      results,
      (result) => result.url === "/docs/references/mcp",
    );
    expect(documentationIndex).toBeGreaterThanOrEqual(0);
    expect(referencesIndex).toBeGreaterThanOrEqual(0);

    const firstInventoryIndex = firstIndexMatching(
      results,
      (result) =>
        result.url.startsWith("/docs/references/mcp#") ||
        result.url.startsWith("/docs/references/cli#you-mcp"),
    );
    expect(firstInventoryIndex).toBeGreaterThanOrEqual(0);
    expect(documentationIndex).toBeLessThan(firstInventoryIndex);
    expect(referencesIndex).toBeLessThan(firstInventoryIndex);
  });

  test("exact MCP/API/CLI/JS inventory identifiers still return item deep links", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const cases = [
      {
        query: "you.factory_session.get",
        url: "/docs/references/mcp#you.factory_session.get",
      },
      {
        query: "submitWorkBySessionId",
        url: "/docs/references/api#submitWorkBySessionId",
      },
      {
        query: "you config init",
        url: "/docs/references/cli#you-config-init",
      },
      {
        query: "javascript.log",
        url: "/docs/references/javascript-runtime#javascript.log",
      },
    ] as const;

    for (const { query, url } of cases) {
      const results = await docsSearchApi.search(query);
      expect(resultsIncludeUrl(results, url)).toBe(true);
      expect(hasReferenceAutoHeadingSpam(results)).toBe(false);
    }
  });
});
