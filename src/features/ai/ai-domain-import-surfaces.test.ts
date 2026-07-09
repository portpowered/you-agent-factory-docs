import { describe, expect, test } from "bun:test";
import * as ai from "@/features/ai";
import * as aiTimeline from "@/features/ai/timeline";
import * as aiTopology from "@/features/ai/topology";
import * as transitionalTimeline from "@/features/docs/timeline";

function expectExportDefined(
  module: Record<string, unknown>,
  exportName: string,
): void {
  expect(module[exportName]).toBeDefined();
}

describe("AI domain namespace import surfaces", () => {
  test("server-safe @/features/ai exports resolve representative timeline helpers", () => {
    expectExportDefined(ai, "buildTimelineClassificationHref");
    expectExportDefined(ai, "normalizeTimelineClassificationSelector");
    expect(typeof ai.buildTimelineClassificationHref).toBe("function");
    expect(ai.normalizeTimelineClassificationSelector(undefined)).toBe(
      "activation-functions",
    );
  });

  test("retired @/features/ai/topology namespace no longer re-exports explorers", () => {
    expect(Object.keys(aiTopology)).toEqual([]);
  });

  test("timeline helpers and renderers are reachable through @/features/ai/timeline", () => {
    expectExportDefined(aiTimeline, "OntologyTimelinePage");
    expectExportDefined(aiTimeline, "buildTimelineClassificationHref");
    expect(typeof aiTimeline.OntologyTimelinePage).toBe("function");
    expect(
      aiTimeline.buildTimelineClassificationHref(
        "/docs/timeline",
        "classification.feed-forward-networks",
      ),
    ).toBe("/docs/timeline?classification=feed-forward-networks");
  });
});

describe("transitional import compatibility surfaces", () => {
  test("@/features/docs/timeline barrel keeps representative helper and renderer exports", () => {
    expectExportDefined(transitionalTimeline, "OntologyTimelinePage");
    expectExportDefined(transitionalTimeline, "TimelineClassificationChips");
    expect(typeof transitionalTimeline.OntologyTimelinePage).toBe("function");
    expect(
      transitionalTimeline.normalizeTimelineClassificationSelector(undefined),
    ).toBe("activation-functions");
  });
});
