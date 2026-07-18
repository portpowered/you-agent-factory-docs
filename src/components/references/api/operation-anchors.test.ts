import { describe, expect, test } from "bun:test";
import { buildApiOperationNavigationFromArtifact } from "./load-operation-navigation";
import {
  API_REFERENCE_PAGE_PATH,
  apiOperationAnchorUrl,
  apiOperationCopyLinkValue,
  collectCollisionFreeApiOperationAnchors,
  normalizeApiOperationAnchor,
  readLocationHashAnchor,
  resolveApiOperationAnchor,
} from "./operation-anchors";

describe("operation-anchors", () => {
  test("normalizeApiOperationAnchor strips hash and whitespace", () => {
    expect(normalizeApiOperationAnchor("  #submitWorkBySessionId ")).toBe(
      "submitWorkBySessionId",
    );
    expect(readLocationHashAnchor("#getEvents")).toBe("getEvents");
  });

  test("resolveApiOperationAnchor prefers operationId over provisional anchor", () => {
    expect(
      resolveApiOperationAnchor({
        anchor: "fallback-anchor",
        operationId: "submitWorkBySessionId",
        method: "post",
        path: "/factory-sessions/{session_id}/work",
      }),
    ).toBe("submitWorkBySessionId");

    expect(
      resolveApiOperationAnchor({
        anchor: "get-events",
        method: "get",
        path: "/events",
      }),
    ).toBe("get-events");
  });

  test("apiOperationAnchorUrl builds production owning-page deep links", () => {
    expect(apiOperationAnchorUrl("submitWorkBySessionId")).toBe(
      `${API_REFERENCE_PAGE_PATH}#submitWorkBySessionId`,
    );
    expect(
      apiOperationCopyLinkValue({
        anchor: "listModels",
        href: "/api-renderer-harness#listModels",
      }),
    ).toBe("/api-renderer-harness#listModels");
    expect(apiOperationCopyLinkValue({ anchor: "listModels" })).toBe(
      `${API_REFERENCE_PAGE_PATH}#listModels`,
    );
  });

  test("collectCollisionFreeApiOperationAnchors fails on distinct ops sharing a fragment", () => {
    expect(() =>
      collectCollisionFreeApiOperationAnchors([
        {
          id: "a",
          anchor: "same",
          operationId: "same",
          method: "get",
          path: "/a",
        },
        {
          id: "b",
          anchor: "same",
          operationId: "same",
          method: "post",
          path: "/b",
        },
      ]),
    ).toThrow(/API operation anchor collision/);
  });

  test("collectCollisionFreeApiOperationAnchors allows the same op under multiple tags", () => {
    const report = collectCollisionFreeApiOperationAnchors([
      {
        id: "multi",
        anchor: "multi",
        operationId: "multi",
        method: "get",
        path: "/x",
      },
      {
        id: "multi",
        anchor: "multi",
        operationId: "multi",
        method: "get",
        path: "/x",
      },
    ]);
    expect(report.ok).toBe(true);
    expect(report.uniqueCount).toBe(1);
    expect(report.anchors).toEqual(["multi"]);
  });

  test("live package projection has collision-free operationId anchors", () => {
    const { model } = buildApiOperationNavigationFromArtifact();
    const uniqueItems = new Map<
      string,
      {
        id: string;
        anchor: string;
        operationId?: string;
        method: string;
        path: string;
      }
    >();
    for (const group of model.groups) {
      for (const item of group.items) {
        if (!uniqueItems.has(item.id)) {
          uniqueItems.set(item.id, item);
        }
      }
    }

    const report = collectCollisionFreeApiOperationAnchors([
      ...uniqueItems.values(),
    ]);

    expect(report.ok).toBe(true);
    expect(report.uniqueCount).toBe(model.operationCount);
    expect(report.uniqueCount).toBeGreaterThan(0);

    for (const item of uniqueItems.values()) {
      const resolved = resolveApiOperationAnchor(item);
      expect(resolved.length).toBeGreaterThan(0);
      if (item.operationId) {
        expect(resolved).toBe(item.operationId);
        expect(item.anchor).toBe(item.operationId);
      }
    }
  });
});
