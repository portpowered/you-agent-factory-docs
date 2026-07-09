import { describe, expect, test } from "bun:test";
import * as ai from "@/features/ai";
import * as aiTimeline from "@/features/ai/timeline";
import * as aiTopology from "@/features/ai/topology";
import * as transitionalTimeline from "@/features/docs/timeline";
import * as transitionalTopology from "@/features/topology";

function expectExportDefined(
  module: Record<string, unknown>,
  exportName: string,
): void {
  expect(module[exportName]).toBeDefined();
}

describe("AI domain namespace import surfaces", () => {
  test("server-safe @/features/ai exports resolve representative helpers", () => {
    expectExportDefined(ai, "buildTopologyGraph");
    expectExportDefined(ai, "getDefaultTopologySelectors");
    expectExportDefined(ai, "parseTopologyQuery");
    expect(typeof ai.buildTopologyGraph).toBe("function");
    expect(typeof ai.getDefaultTopologySelectors).toBe("function");
    expect(ai.getDefaultTopologySelectors().length).toBeGreaterThan(0);
    expect(ai.parseTopologyQuery(new URLSearchParams()).usesDefault).toBe(true);
  });

  test("topology helpers and renderers are reachable through @/features/ai/topology", () => {
    expectExportDefined(aiTopology, "TopologyPrototype");
    expectExportDefined(aiTopology, "buildTopologyHref");
    expect(typeof aiTopology.TopologyPrototype).toBe("function");
    expect(
      aiTopology.buildTopologyHref("/browse", ["attention"], null),
    ).toContain("classification=attention");
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
  test("@/features/topology barrel keeps representative helper and renderer exports", () => {
    expectExportDefined(transitionalTopology, "TopologyPrototype");
    expectExportDefined(transitionalTopology, "buildTopologyGraph");
    expect(typeof transitionalTopology.TopologyPrototype).toBe("function");
    expect(
      transitionalTopology.getDefaultTopologySelectors().length,
    ).toBeGreaterThan(0);
  });

  test("@/features/docs/timeline barrel keeps representative helper and renderer exports", () => {
    expectExportDefined(transitionalTimeline, "OntologyTimelinePage");
    expectExportDefined(transitionalTimeline, "TimelineClassificationChips");
    expect(typeof transitionalTimeline.OntologyTimelinePage).toBe("function");
    expect(
      transitionalTimeline.normalizeTimelineClassificationSelector(undefined),
    ).toBe("activation-functions");
  });
});
