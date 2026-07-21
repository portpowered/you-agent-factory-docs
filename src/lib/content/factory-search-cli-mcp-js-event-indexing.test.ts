/**
 * Story refs-w16-search-anchor-projection-004 proof: CLI commands, MCP tools,
 * JavaScript symbols, and event variants are indexed as Orama documents with
 * deep-link URLs on the correct owning pages.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import {
  buildReferenceItemSearchDocuments,
  loadCliReferenceSearchShapes,
  loadEventCorpusReferenceSearchShapes,
  loadJavascriptReferenceSearchShapes,
  loadMcpReferenceSearchShapes,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "@/lib/search";
import { querySearchDocuments } from "@/lib/search/orama-index";

describe("factory search CLI/MCP/JS/event reference indexing (W16-004)", () => {
  test("indexes each published CLI command with /docs/references/cli#anchor", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const { shapes, corpus } = loadCliReferenceSearchShapes();
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.length).toBe(corpus.commands.length);

    for (const shape of shapes) {
      expect(shape.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(shape.family).toBe("cli");
      expect(shape.url.startsWith("/docs/references/cli#")).toBe(true);
      expect(shape.anchor.length).toBeGreaterThan(0);
    }

    const init = shapes.find((shape) => shape.title === "you config init");
    expect(init).toBeDefined();
    expect(init?.url).toBe("/docs/references/cli#you-config-init");
  });

  test("indexes each published MCP tool with /docs/references/mcp-reference#anchor", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const { shapes, corpus } = loadMcpReferenceSearchShapes();
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.length).toBe(corpus.tools.length);

    for (const shape of shapes) {
      expect(shape.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(shape.family).toBe("mcp");
      expect(shape.url.startsWith("/docs/references/mcp-reference#")).toBe(
        true,
      );
    }

    const get = shapes.find(
      (shape) => shape.anchor === "you.factory_session.get",
    );
    expect(get).toBeDefined();
    expect(get?.url).toBe(
      "/docs/references/mcp-reference#you.factory_session.get",
    );
  });

  test("indexes JavaScript symbols (and shared schemas) on javascript-runtime", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const { shapes, corpus } = loadJavascriptReferenceSearchShapes();
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.length).toBe(
      corpus.symbols.length + corpus.sharedSchemas.length,
    );

    for (const shape of shapes) {
      expect(shape.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(shape.family).toBe("javascript");
      expect(shape.url.startsWith("/docs/references/javascript-runtime#")).toBe(
        true,
      );
    }

    const log = shapes.find((shape) => shape.anchor === "javascript.log");
    expect(log).toBeDefined();
    expect(log?.url).toBe("/docs/references/javascript-runtime#javascript.log");
  });

  test("indexes settled event variants on /docs/references/events#anchor", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const { shapes } = loadEventCorpusReferenceSearchShapes();
    expect(shapes.length).toBeGreaterThan(0);

    for (const shape of shapes) {
      expect(shape.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(shape.family).toBe("events");
      expect(shape.url.startsWith("/docs/references/events#")).toBe(true);
    }

    const runRequest = shapes.find((shape) => shape.anchor === "RUN_REQUEST");
    expect(runRequest).toBeDefined();
    expect(runRequest?.url).toBe("/docs/references/events#RUN_REQUEST");
  });

  test("representative command, tool, symbol, and event queries return item deep links", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = buildReferenceItemSearchDocuments({ fresh: true });

    const commandHits = await querySearchDocuments(
      documents,
      "you config init",
    );
    expect(
      commandHits.some(
        (hit) => hit.url === "/docs/references/cli#you-config-init",
      ),
    ).toBe(true);

    const toolHits = await querySearchDocuments(
      documents,
      "you.factory_session.get",
    );
    expect(
      toolHits.some(
        (hit) =>
          hit.url === "/docs/references/mcp-reference#you.factory_session.get",
      ),
    ).toBe(true);

    const symbolHits = await querySearchDocuments(documents, "javascript.log");
    expect(
      symbolHits.some(
        (hit) =>
          hit.url === "/docs/references/javascript-runtime#javascript.log",
      ),
    ).toBe(true);

    const eventHits = await querySearchDocuments(documents, "RUN_REQUEST");
    expect(
      eventHits.some(
        (hit) => hit.url === "/docs/references/events#RUN_REQUEST",
      ),
    ).toBe(true);
  });
});
