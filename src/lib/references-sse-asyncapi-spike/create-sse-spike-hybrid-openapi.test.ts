/**
 * Story 008 — hybrid createAPIPage uses documented renderOperationLayout.
 */

import { describe, expect, test } from "bun:test";
import { createSseSpikeHybridApiPage } from "./create-sse-spike-hybrid-openapi";
import { SSE_SPIKE_DOCUMENT_ID } from "./sse-operations";

describe("W02 SSE spike — hybrid OpenAPI page factory (008)", () => {
  test("creates APIPage with documented hybrid injection choice", () => {
    const { APIPage, documentId, catalog, hooksEvaluation } =
      createSseSpikeHybridApiPage();

    expect(documentId).toBe(SSE_SPIKE_DOCUMENT_ID);
    expect(typeof APIPage).toBe("function");
    expect(catalog.preferredEntries.length).toBe(2);
    expect(hooksEvaluation.hybridInjectionChoice.hook).toBe(
      "content.renderOperationLayout",
    );
    expect(hooksEvaluation.hybridInjectionChoice.documented).toBe(true);
  });
});
