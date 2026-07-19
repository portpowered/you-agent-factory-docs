import { describe, expect, test } from "bun:test";
import { initAdvancedSearch } from "fumadocs-core/search/server";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { buildSearchDocuments } from "./build-documents";
import {
  toAdvancedSearchIndex,
  toAdvancedSearchIndexes,
} from "./to-advanced-index";
import { toStructuredData } from "./to-structured-data";
import type { SearchDocument } from "./types";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";

const MCP_REFERENCE_URL = "/docs/references/mcp";
const HARNESS_URL = "/docs/concepts/harness";

function buildSyntheticDocument(input: {
  url: string;
  title: string;
  kind?: string;
  description?: string;
  bodyText?: string;
  headings?: string[];
}): SearchDocument {
  return {
    id: input.url,
    url: input.url,
    kind: input.kind ?? "documentation",
    title: input.title,
    description: input.description ?? "Synthetic description",
    bodyText: input.bodyText ?? "Synthetic body text",
    headings: input.headings ?? ["Overview", "mcp factory session start async"],
    directAliases: [],
    aliases: [],
    tags: [],
    relatedIds: [],
    facets: { kind: input.kind ?? "documentation", tags: [] },
    topology: { ...EMPTY_SEARCH_DOCUMENT_TOPOLOGY },
  };
}

describe("toStructuredData reference owning-page heading policy", () => {
  test("omits standalone heading rows for /docs/references/** owning pages", () => {
    const document = buildSyntheticDocument({
      url: MCP_REFERENCE_URL,
      title: "MCP",
      headings: ["Overview", "mcp factory session start async"],
    });

    const structured = toStructuredData(document);

    expect(structured.headings).toEqual([]);
    expect(structured.contents[0]?.heading).toBeUndefined();
    expect(structured.contents[0]?.content).toContain(
      "mcp factory session start async",
    );
    expect(structured.contents[0]?.content).toContain("Overview");
  });

  test("keeps heading rows for non-reference pages and inventory item documents", () => {
    const concept = buildSyntheticDocument({
      url: HARNESS_URL,
      title: "Harness",
      headings: ["What a harness does"],
    });
    const item = buildSyntheticDocument({
      url: `${MCP_REFERENCE_URL}#factory_session_start`,
      title: "factory_session_start",
      kind: "reference",
      headings: ["factory_session_start", "factory_session_start"],
    });

    const conceptStructured = toStructuredData(concept);
    expect(conceptStructured.headings).toEqual([
      { id: "heading-0", content: "What a harness does" },
    ]);
    expect(conceptStructured.contents[0]?.heading).toBe("Harness");

    const itemStructured = toStructuredData(item);
    expect(itemStructured.headings.length).toBeGreaterThan(0);
    expect(itemStructured.headings[0]?.id).toBe("heading-0");
  });

  test("live MCP reference page indexes as a page hit without #heading-N rows", async () => {
    const registry = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const documents = buildSearchDocuments(pages, registry);
    const mcpPage = documents.find(
      (document) => document.url === MCP_REFERENCE_URL,
    );

    expect(mcpPage).toBeDefined();
    if (!mcpPage) {
      throw new Error(
        `Missing MCP reference search document at ${MCP_REFERENCE_URL}`,
      );
    }

    // Owning pages may still carry collected message headings on the document;
    // structured data must not project them as standalone Fumadocs heading rows.
    const structured = toStructuredData(mcpPage);
    expect(structured.headings).toEqual([]);
    expect(structured.contents[0]?.heading).toBeUndefined();
    expect(structured.contents[0]?.content.length).toBeGreaterThan(0);

    const advanced = toAdvancedSearchIndex(mcpPage);
    expect(advanced.structuredData.headings).toEqual([]);
    expect(advanced.url).toBe(MCP_REFERENCE_URL);

    const searchServer = initAdvancedSearch({
      language: "english",
      indexes: toAdvancedSearchIndexes([mcpPage]),
    });
    const results = await searchServer.search("mcp");

    expect(results.some((result) => result.url === MCP_REFERENCE_URL)).toBe(
      true,
    );
    expect(
      results.some(
        (result) =>
          result.type === "heading" || /#heading-\d+/i.test(result.url),
      ),
    ).toBe(false);
    expect(
      results.every(
        (result) =>
          result.url === MCP_REFERENCE_URL ||
          result.url.startsWith(`${MCP_REFERENCE_URL}#`),
      ),
    ).toBe(true);
    // With heading suppression, content stays on the canonical page URL.
    expect(
      results
        .filter((result) => result.url.startsWith(`${MCP_REFERENCE_URL}#`))
        .every(
          (result) => !/^heading-\d+$/i.test(result.url.split("#")[1] ?? ""),
        ),
    ).toBe(true);
  });
});
