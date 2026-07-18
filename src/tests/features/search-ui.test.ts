import { describe, expect, test } from "bun:test";
import { resolveSearchResultMeta } from "@/features/docs/search/search-result-meta-client";
import { formatPageKind, loadUiMessages } from "@/lib/content/ui-messages";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";

const FACTORY_HARNESS_URL = "/docs/concepts/harness";
const ATLAS_OWNERSHIP =
  /Model Atlas|\batlas\b|アトラス|图谱|Duyệt Atlas|Browse the Atlas/i;

describe("search UI messages", () => {
  test("loads localized copy for dialog, trigger, and result states", async () => {
    const messages = await loadUiMessages();
    expect(messages.search.open).toBe("Open search");
    expect(messages.search.placeholder).toBe("Search you-agent-factory…");
    expect(messages.search.placeholder).not.toMatch(ATLAS_OWNERSHIP);
    expect(messages.searchEntry.description).not.toMatch(ATLAS_OWNERSHIP);
    expect(messages.searchEntry.description).toMatch(/you-agent-factory/i);
    expect(messages.searchEntry.emptySuggestionTerm).toBe("harness");
    expect(messages.searchEntry.emptySuggestionLinkLabel).not.toMatch(
      /GQA|attention/i,
    );
    expect(messages.search.close.length).toBeGreaterThan(0);
    expect(messages.search.idle.length).toBeGreaterThan(0);
    expect(messages.search.idle).not.toMatch(ATLAS_OWNERSHIP);
    expect(messages.search.noResults.length).toBeGreaterThan(0);
    expect(messages.search.loading.length).toBeGreaterThan(0);
    expect(messages.search.error.length).toBeGreaterThan(0);
    expect(messages.search.retry.length).toBeGreaterThan(0);
    expect(messages.search.shortcut.length).toBeGreaterThan(0);
    expect(messages.search.resultPath.length).toBeGreaterThan(0);
  });

  test("formatPageKind resolves factory kinds for search results", async () => {
    const messages = await loadUiMessages();
    expect(formatPageKind(messages, "guide")).toBe("Guide");
    expect(formatPageKind(messages, "concept")).toBe("Concept");
    expect(formatPageKind(messages, "technique")).toBe("Technique");
    expect(formatPageKind(messages, "documentation")).toBe("Documentation");
    expect(formatPageKind(messages, "glossary")).toBe("Glossary");
    expect(formatPageKind(messages, "reference")).toBe("Reference");
    expect(formatPageKind(messages, "blog")).toBe("Blog");
    expect(messages.pageKind.module).toBeUndefined();
    expect(formatPageKind(messages, "module")).toBe("module");
  });
});

describe("search result presentation meta", () => {
  test("harness query ranks live factory concept page for dialog rows", async () => {
    const results = await docsSearchApi.search("harness");
    expect(results[0]?.type).toBe("page");
    expect(results[0]?.url).toBe(FACTORY_HARNESS_URL);
  });

  test("factory concept meta includes kind and summary for dialog rows", async () => {
    const metaByUrl = searchResultMetaMapToRecord(
      await loadSearchResultMetaMap(),
    );
    const meta = resolveSearchResultMeta(FACTORY_HARNESS_URL, metaByUrl);
    expect(meta?.kind).toBe("concept");
    expect(meta?.description.length).toBeGreaterThan(0);
    expect(meta?.description).not.toMatch(ATLAS_OWNERSHIP);
  });
});
