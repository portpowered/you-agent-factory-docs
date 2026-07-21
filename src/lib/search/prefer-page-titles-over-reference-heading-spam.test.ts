/**
 * Story repair-search-reference-heading-policy-003: generic queries like
 * "mcp" prefer page-title hits over inventory/heading spam, while exact
 * inventory identifiers still deep-link.
 */
import { describe, expect, test } from "bun:test";
import { resetReferenceItemSearchDocumentsCacheForTests } from "./index";
import { docsSearchApi } from "./search-server";

describe("prefer page titles over reference heading spam", () => {
  test("generic mcp query ranks MCP page titles ahead of inventory item flood", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("mcp");
    expect(results.length).toBeGreaterThan(0);

    const documentationIndex = results.findIndex(
      (result) => result.url === "/docs/documentation/mcp",
    );
    const referencesIndex = results.findIndex(
      (result) => result.url === "/docs/references/mcp-reference",
    );
    expect(documentationIndex).toBeGreaterThanOrEqual(0);
    expect(referencesIndex).toBeGreaterThanOrEqual(0);

    const firstInventoryIndex = results.findIndex(
      (result) =>
        result.url.startsWith("/docs/references/mcp#") ||
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

  test("exact inventory identifier still returns the item deep link first", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("you.factory_session.get");
    const itemIndex = results.findIndex(
      (result) => result.url === "/docs/references/mcp#you.factory_session.get",
    );
    expect(itemIndex).toBeGreaterThanOrEqual(0);
    expect(itemIndex).toBe(0);
  });
});
