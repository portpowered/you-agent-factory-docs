import { describe, expect, test } from "bun:test";
import {
  collapseSearchResultsToPageHits,
  pageBaseUrl,
} from "./collapse-search-results-to-page-hits";
import type { SearchDocument } from "./types";

function documentForUrl(
  url: string,
  overrides: Partial<SearchDocument> = {},
): SearchDocument {
  return {
    id: url,
    url,
    kind: "module",
    title: "Grouped-Query Attention",
    description: "GQA module",
    bodyText: "",
    headings: [],
    directAliases: ["GQA"],
    aliases: ["GQA"],
    tags: ["attention"],
    relatedIds: [],
    facets: { kind: "module", tags: ["attention"] },
    topology: {
      secondaryClassificationIds: [],
      secondaryClassifications: [],
      relationships: [],
      terms: [],
    },
    ...overrides,
  };
}

describe("collapseSearchResultsToPageHits", () => {
  test("returns at most one hit per page base URL", () => {
    const moduleUrl = "/docs/modules/grouped-query-attention";
    const documentsByUrl = new Map<string, SearchDocument>([
      [moduleUrl, documentForUrl(moduleUrl)],
    ]);

    const collapsed = collapseSearchResultsToPageHits(
      [
        {
          id: moduleUrl,
          type: "page",
          url: moduleUrl,
          content: "Grouped-Query Attention",
        },
        {
          id: `${moduleUrl}-16`,
          type: "text",
          url: moduleUrl,
          content: "GQA reduces KV cache footprint",
        },
        {
          id: `${moduleUrl}-15`,
          type: "text",
          url: `${moduleUrl}#Grouped-Query Attention`,
          content: "Grouped-Query Attention",
        },
        {
          id: "/docs/glossary/module",
          type: "page",
          url: "/docs/glossary/module",
          content: "Module",
        },
        {
          id: "/docs/glossary/module-10",
          type: "text",
          url: "/docs/glossary/module#Module",
          content: "Module",
        },
      ],
      documentsByUrl,
    );

    const bases = collapsed.map((result) => pageBaseUrl(result.url));
    expect(new Set(bases).size).toBe(bases.length);
    expect(collapsed).toHaveLength(2);
    expect(collapsed.every((result) => !result.url.includes("#"))).toBe(true);
  });

  test("prefers canonical page hits and strips hash URLs", () => {
    const moduleUrl = "/docs/modules/grouped-query-attention";
    const documentsByUrl = new Map<string, SearchDocument>([
      [moduleUrl, documentForUrl(moduleUrl)],
    ]);

    const collapsed = collapseSearchResultsToPageHits(
      [
        {
          id: `${moduleUrl}-heading`,
          type: "heading",
          url: `${moduleUrl}#heading-0`,
          content: "Problem",
        },
        {
          id: `${moduleUrl}-text`,
          type: "text",
          url: `${moduleUrl}#Grouped-Query Attention`,
          content: "Grouped-Query Attention",
        },
      ],
      documentsByUrl,
    );

    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]).toMatchObject({
      type: "page",
      url: moduleUrl,
      content: "Grouped-Query Attention",
    });
  });

  test("uses published page title when only fragment hits exist", () => {
    const moduleUrl = "/docs/modules/grouped-query-attention";
    const documentsByUrl = new Map<string, SearchDocument>([
      [
        moduleUrl,
        documentForUrl(moduleUrl, { title: "Grouped-Query Attention" }),
      ],
    ]);

    const collapsed = collapseSearchResultsToPageHits(
      [
        {
          id: `${moduleUrl}-body`,
          type: "text",
          url: moduleUrl,
          content: "KV cache footprint",
        },
        {
          id: `${moduleUrl}-fragment`,
          type: "text",
          url: `${moduleUrl}#Grouped-Query Attention`,
          content: "Grouped-Query Attention",
        },
      ],
      documentsByUrl,
    );

    expect(collapsed[0]).toMatchObject({
      type: "page",
      url: moduleUrl,
      content: "Grouped-Query Attention",
    });
  });

  test("collapses reference owning-page #heading-N spam to the bare page URL", () => {
    const mcpPage = "/docs/references/mcp";
    const headingSpam = `${mcpPage}#heading-0`;
    const documentsByUrl = new Map<string, SearchDocument>([
      [
        mcpPage,
        documentForUrl(mcpPage, {
          kind: "reference",
          title: "MCP",
          facets: { kind: "reference", tags: ["mcp"] },
        }),
      ],
    ]);

    const collapsed = collapseSearchResultsToPageHits(
      [
        {
          id: headingSpam,
          type: "heading",
          url: headingSpam,
          content: "mcp factory session start async",
        },
        {
          id: `${mcpPage}-body`,
          type: "text",
          url: mcpPage,
          content: "MCP tools and factory session helpers",
        },
      ],
      documentsByUrl,
    );

    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]).toMatchObject({
      type: "page",
      url: mcpPage,
      content: "MCP",
    });
    expect(collapsed.every((result) => !/#heading-\d+/i.test(result.url))).toBe(
      true,
    );
  });

  test("preserves reference item deep links instead of collapsing to the owning page", () => {
    const eventsPage = "/docs/references/events";
    const runRequest = `${eventsPage}#RUN_REQUEST`;
    const documentsByUrl = new Map<string, SearchDocument>([
      [
        eventsPage,
        documentForUrl(eventsPage, {
          kind: "reference",
          title: "Events",
          facets: { kind: "reference", tags: ["events"] },
        }),
      ],
      [
        runRequest,
        documentForUrl(runRequest, {
          kind: "reference",
          title: "RUN_REQUEST",
          facets: { kind: "reference", tags: ["events"] },
        }),
      ],
    ]);

    const collapsed = collapseSearchResultsToPageHits(
      [
        {
          id: runRequest,
          type: "page",
          url: runRequest,
          content: "RUN_REQUEST",
        },
        {
          id: `${runRequest}-heading`,
          type: "heading",
          url: `${runRequest}#heading-0`,
          content: "RUN_REQUEST",
        },
        {
          id: eventsPage,
          type: "page",
          url: eventsPage,
          content: "Events",
        },
        {
          id: `${eventsPage}-text`,
          type: "text",
          url: `${eventsPage}#Events`,
          content: "FactoryEvent catalog",
        },
      ],
      documentsByUrl,
    );

    expect(collapsed.map((result) => result.url)).toEqual([
      runRequest,
      eventsPage,
    ]);
    expect(collapsed[0]).toMatchObject({
      type: "page",
      url: runRequest,
      content: "RUN_REQUEST",
    });
  });

  test("does not let duplicate owning-page hits displace a matching reference item", () => {
    const apiPage = "/docs/references/api";
    const operation = `${apiPage}#submitWorkBySessionId`;
    const documentsByUrl = new Map<string, SearchDocument>([
      [
        apiPage,
        documentForUrl(apiPage, {
          kind: "reference",
          title: "API",
          facets: { kind: "reference", tags: ["api"] },
        }),
      ],
      [
        operation,
        documentForUrl(operation, {
          kind: "reference",
          title: "submitWorkBySessionId",
          facets: { kind: "reference", tags: ["api"] },
        }),
      ],
    ]);

    const collapsed = collapseSearchResultsToPageHits(
      [
        {
          id: apiPage,
          type: "page",
          url: apiPage,
          content: "API",
        },
        {
          id: `${apiPage}-body`,
          type: "text",
          url: apiPage,
          content: "submitWorkBySessionId appears in the API catalog",
        },
        {
          id: operation,
          type: "page",
          url: operation,
          content: "submitWorkBySessionId",
        },
        {
          id: `${operation}-text`,
          type: "text",
          url: `${operation}#heading-1`,
          content: "submitWorkBySessionId",
        },
      ],
      documentsByUrl,
    );

    expect(collapsed.some((result) => result.url === operation)).toBe(true);
    expect(
      collapsed.filter((result) => pageBaseUrl(result.url) === apiPage),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: apiPage }),
        expect.objectContaining({ url: operation }),
      ]),
    );
  });
});
