/**
 * Story refs-w16-search-anchor-projection-003 proof: API operations and schema
 * definitions/fields are indexed as Orama documents with deep-link URLs on the
 * correct owning pages.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import {
  buildReferenceItemSearchDocuments,
  loadApiReferenceSearchShapes,
  loadSchemaFamilyReferenceSearchShapes,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
  SCHEMA_REFERENCE_PAGE_PATHS,
} from "@/lib/search";
import { querySearchDocuments } from "@/lib/search/orama-index";

describe("factory search API and schema reference indexing (W16-003)", () => {
  test("indexes each published API operation with /docs/references/api#anchor", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const { shapes, corpus } = loadApiReferenceSearchShapes();
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.length).toBe(corpus.operations.length);

    for (const shape of shapes) {
      expect(shape.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(shape.family).toBe("api");
      expect(shape.url.startsWith("/docs/references/api#")).toBe(true);
      expect(shape.anchor.length).toBeGreaterThan(0);
    }

    const submit = shapes.find(
      (shape) => shape.anchor === "submitWorkBySessionId",
    );
    expect(submit).toBeDefined();
    expect(submit?.url).toBe("/docs/references/api#submitWorkBySessionId");
  });

  test("indexes schema definitions and fields on per-schema owning pages", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const { shapes, corpus } = loadSchemaFamilyReferenceSearchShapes();
    expect(shapes.length).toBeGreaterThan(0);
    expect(corpus.packages).toHaveLength(3);

    expect(corpus.packages.map((entry) => entry.pagePath).sort()).toEqual(
      [
        SCHEMA_REFERENCE_PAGE_PATHS["schemas/factory"],
        SCHEMA_REFERENCE_PAGE_PATHS["schemas/mock-workers"],
        SCHEMA_REFERENCE_PAGE_PATHS["schemas/you-config"],
      ].sort(),
    );

    for (const shape of shapes) {
      expect(shape.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(shape.family).toBe("schema");
      expect(shape.url.includes("#")).toBe(true);
      expect(shape.url.startsWith("/docs/references/schema#")).toBe(false);
    }

    const workers = shapes.find(
      (shape) =>
        shape.title === "workers" &&
        shape.url.startsWith("/docs/references/factory-schema#"),
    );
    expect(workers).toBeDefined();
    expect(workers?.url).toBe(
      `/docs/references/factory-schema#${workers?.anchor}`,
    );
  });

  test("representative operation and field queries return item-level deep links", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = buildReferenceItemSearchDocuments({ fresh: true });

    const operationHits = await querySearchDocuments(
      documents,
      "submitWorkBySessionId",
    );
    expect(
      operationHits.some(
        (hit) => hit.url === "/docs/references/api#submitWorkBySessionId",
      ),
    ).toBe(true);

    const workersDoc = documents.find(
      (document) =>
        document.title === "workers" &&
        document.url.startsWith("/docs/references/factory-schema#") &&
        document.kind === REFERENCE_SEARCH_DOCUMENT_KIND,
    );
    expect(workersDoc).toBeDefined();
    if (workersDoc === undefined) {
      throw new Error("expected factory-schema workers field document");
    }

    const fieldHits = await querySearchDocuments(documents, "workers");
    expect(fieldHits.some((hit) => hit.url === workersDoc.url)).toBe(true);
    expect(fieldHits.some((hit) => hit.url.includes("#"))).toBe(true);
  });
});
