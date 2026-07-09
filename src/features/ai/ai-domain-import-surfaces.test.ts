import { describe, expect, test } from "bun:test";
import * as ai from "@/features/ai";
import * as aiModels from "@/features/ai/models";
import * as aiTimeline from "@/features/ai/timeline";
import * as aiTopology from "@/features/ai/topology";

describe("AI domain namespace import surfaces", () => {
  test("server-safe @/features/ai no longer re-exports Atlas explorers", () => {
    expect(Object.keys(ai).sort()).toEqual(["models", "timeline", "topology"]);
  });

  test("retired @/features/ai/models namespace no longer re-exports renderers", () => {
    expect(Object.keys(aiModels)).toEqual([]);
  });

  test("retired @/features/ai/topology namespace no longer re-exports explorers", () => {
    expect(Object.keys(aiTopology)).toEqual([]);
  });

  test("retired @/features/ai/timeline namespace no longer re-exports timeline helpers", () => {
    expect(Object.keys(aiTimeline)).toEqual([]);
  });
});
