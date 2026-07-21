import { describe, expect, test } from "bun:test";
import { createOpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import {
  apiOperationFilterHasNoMatches,
  apiOperationFilterQueryIsEmpty,
  apiOperationNavItemMatchesFilter,
  apiOperationTextMatchesFilter,
  filterApiOperationNavGroups,
  filterApiOperationNavModel,
  normalizeApiOperationFilterQuery,
} from "./operation-filter";
import { buildApiOperationNavModel } from "./operation-navigation";

function op(
  overrides: Partial<Parameters<typeof createOpenApiOperationSummary>[0]> & {
    id: string;
    method: "get" | "post" | "delete";
    path: string;
    anchor: string;
  },
) {
  return createOpenApiOperationSummary({
    source: {
      publicArtifactId: "@you-agent-factory/api/openapi",
      pointer: `/paths${overrides.path}`,
    },
    ...overrides,
  });
}

const sampleOps = [
  op({
    id: "submitWorkBySessionId",
    operationId: "submitWorkBySessionId",
    method: "post",
    path: "/factory-sessions/{session_id}/work",
    anchor: "submitWorkBySessionId",
    summary: "Submit work",
    tags: ["Work"],
  }),
  op({
    id: "getEvents",
    operationId: "getEvents",
    method: "get",
    path: "/events",
    anchor: "getEvents",
    summary: "Compatibility event stream",
    tags: ["Runtime"],
  }),
  op({
    id: "listModels",
    operationId: "listModels",
    method: "get",
    path: "/models",
    anchor: "listModels",
    tags: ["Models"],
  }),
  op({
    id: "deleteSession",
    operationId: "deleteSession",
    method: "delete",
    path: "/factory-sessions/{session_id}",
    anchor: "deleteSession",
    summary: "Delete a factory session",
    tags: ["Factory"],
  }),
];

describe("operation filter projectors", () => {
  test("normalizes queries and treats whitespace-only as empty", () => {
    expect(normalizeApiOperationFilterQuery("  POST  ")).toBe("post");
    expect(apiOperationFilterQueryIsEmpty("   ")).toBe(true);
    expect(apiOperationFilterQueryIsEmpty("get")).toBe(false);
  });

  test("matches method, path, summary, and operation ID case-insensitively", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
      "Factory",
    ]);
    const byId = Object.fromEntries(
      model.groups.flatMap((g) => g.items.map((item) => [item.id, item])),
    );

    expect(
      apiOperationNavItemMatchesFilter(byId.submitWorkBySessionId, "POST"),
    ).toBe(true);
    expect(
      apiOperationNavItemMatchesFilter(
        byId.submitWorkBySessionId,
        "factory-sessions",
      ),
    ).toBe(true);
    expect(
      apiOperationNavItemMatchesFilter(byId.getEvents, "compatibility"),
    ).toBe(true);
    expect(
      apiOperationNavItemMatchesFilter(byId.listModels, "listmodels"),
    ).toBe(true);
    expect(apiOperationNavItemMatchesFilter(byId.deleteSession, "zzzz")).toBe(
      false,
    );
    expect(apiOperationTextMatchesFilter(undefined, "x")).toBe(false);
    expect(apiOperationTextMatchesFilter("GET", "")).toBe(true);
  });

  test("filters groups without mutating input and drops empty tags", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
      "Factory",
    ]);
    const originalLinkCount = model.linkCount;
    const filtered = filterApiOperationNavGroups(model.groups, "models");

    expect(filtered.map((g) => g.tag)).toEqual(["Models"]);
    expect(filtered[0]?.items).toHaveLength(1);
    expect(filtered[0]?.items[0]?.id).toBe("listModels");
    expect(model.linkCount).toBe(originalLinkCount);
    expect(model.groups).toHaveLength(4);

    const emptyQuery = filterApiOperationNavGroups(model.groups, "  ");
    expect(emptyQuery).toHaveLength(4);
    expect(emptyQuery).not.toBe(model.groups);
  });

  test("filterApiOperationNavModel recounts links and operations", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
      "Factory",
    ]);
    const filtered = filterApiOperationNavModel(model, "get");

    // getEvents + listModels (method get); delete/post excluded
    expect(filtered.operationCount).toBe(2);
    expect(filtered.linkCount).toBe(2);
    expect(filtered.groups.map((g) => g.tag)).toEqual(["Runtime", "Models"]);
  });

  test("empty-filter-results detection only fires for non-empty queries", () => {
    const model = buildApiOperationNavModel(sampleOps, ["Work"]);
    expect(apiOperationFilterHasNoMatches(model, "")).toBe(false);
    expect(apiOperationFilterHasNoMatches(model, "   ")).toBe(false);
    expect(apiOperationFilterHasNoMatches(model, "no-such-op")).toBe(true);
    expect(apiOperationFilterHasNoMatches(model, "submit")).toBe(false);
  });

  test("clearing the filter restores the full tag-grouped set", () => {
    const model = buildApiOperationNavModel(sampleOps, [
      "Work",
      "Runtime",
      "Models",
      "Factory",
    ]);
    const narrowed = filterApiOperationNavModel(model, "delete");
    expect(narrowed.operationCount).toBe(1);

    const restored = filterApiOperationNavModel(narrowed, "");
    // Empty query on a narrowed model only restores that projection's groups —
    // clearing against the original model restores the full set.
    const fromOriginal = filterApiOperationNavModel(model, "");
    expect(fromOriginal.operationCount).toBe(model.operationCount);
    expect(fromOriginal.groups.map((g) => g.tag)).toEqual(
      model.groups.map((g) => g.tag),
    );
    expect(restored.operationCount).toBe(1);
  });
});
