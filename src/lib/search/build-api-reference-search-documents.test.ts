import { describe, expect, test } from "bun:test";
import { createOpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import { REFERENCE_FAMILY_PAGE_PATHS } from "@/lib/references/reference-search-projection";
import {
  buildApiOperationSearchDocuments,
  loadApiOperationReferenceSearchShapes,
  resolveApiOperationSearchAnchor,
} from "./build-api-reference-search-documents";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "./factory-search-kinds";

describe("buildApiOperationSearchDocuments", () => {
  test("resolveApiOperationSearchAnchor prefers operationId", () => {
    expect(
      resolveApiOperationSearchAnchor({
        anchor: "fallback",
        operationId: "submitWorkBySessionId",
      }),
    ).toBe("submitWorkBySessionId");
    expect(
      resolveApiOperationSearchAnchor({
        anchor: "get-events",
      }),
    ).toBe("get-events");
  });

  test("projects fixture operations into API deep-link search shapes", () => {
    const operations = [
      createOpenApiOperationSummary({
        id: "submitWorkBySessionId",
        operationId: "submitWorkBySessionId",
        method: "post",
        path: "/factory-sessions/{session_id}/work",
        summary: "Submit work by session id",
        description: "Enqueue work for an existing session.",
        source: {
          publicArtifactId: "@you-agent-factory/api/openapi",
          pointer: "/paths/~1factory-sessions~1{session_id}~1work/post",
        },
        anchor: "submitWorkBySessionId",
      }),
    ];

    const result = buildApiOperationSearchDocuments(operations);
    expect(result.documents).toHaveLength(1);
    const document = result.documents[0];
    expect(document?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
    expect(document?.family).toBe("api");
    expect(document?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.api}#submitWorkBySessionId`,
    );
    expect(document?.anchor).toBe("submitWorkBySessionId");
    expect(document?.aliases).toContain("submitWorkBySessionId");
    expect(document?.tags).toContain("api");
    expect(document?.tags).toContain("api-operation");
  });

  test("loads packaged OpenAPI operations with registry anchors", () => {
    const result = loadApiOperationReferenceSearchShapes();
    expect(result.documents.length).toBeGreaterThan(0);
    expect(result.documents.length).toBe(result.operations.length);

    const submit = result.documents.find(
      (document) => document.anchor === "submitWorkBySessionId",
    );
    expect(submit).toBeDefined();
    expect(submit?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.api}#submitWorkBySessionId`,
    );
    expect(submit?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);

    for (const document of result.documents) {
      expect(
        document.url.startsWith(`${REFERENCE_FAMILY_PAGE_PATHS.api}#`),
      ).toBe(true);
      expect(document.url.includes("#")).toBe(true);
    }
  });
});
