/**
 * Focused proofs for packaged-factories-index nested child component-map
 * wiring: remaining standard replay children share one literal replay-page
 * map; goal, subagent, fusion, and review resolve their child-owned maps;
 * deep-research resolves a distinct non-replay map. Parent import-graph
 * isolation is covered by packaged-factories-index-import-graph.test.ts.
 * Goal/subagent recording isolation is covered by
 * goal-subagent-recording-isolation.test.ts. Fusion/review recording
 * ownership consolidation is covered by
 * fusion-review-ownership-boundaries.test.ts.
 */
import { describe, expect, test } from "bun:test";
import { loadRouteFamilyPageMdxComponents } from "@/lib/content/route-family-local-docs-page-load";
import {
  packagedFactoriesIndexChildComponentMapKind as deepResearchMapKind,
  pageMdxComponents as deepResearchPageMdxComponents,
} from "./deep-research-page-mdx-components";
import { pageMdxComponents as fusionPageMdxComponents } from "./fusion/page-mdx-components";
import { pageMdxComponents as goalPageMdxComponents } from "./goal/page-mdx-components";
import { pageMdxComponents as parentPageMdxComponents } from "./page-mdx-components";
import {
  packagedFactoriesIndexChildComponentMapKind as replayMapKind,
  pageMdxComponents as replayPageMdxComponents,
} from "./replay-page-mdx-components";
import { pageMdxComponents as reviewPageMdxComponents } from "./review/page-mdx-components";
import { pageMdxComponents as subagentPageMdxComponents } from "./subagent/page-mdx-components";

/** Standard replay children that still resolve the shared placeholder map. */
const SHARED_REPLAY_CHILD_SLUGS = ["quorum", "tts"] as const;

describe("packaged-factories-index child component maps", () => {
  test("shared replay-page map is marked standard-replay and has no MDX mounts yet", () => {
    expect(replayMapKind).toBe("standard-replay");
    expect(Object.keys(replayPageMdxComponents)).toEqual([]);
    expect(
      Object.keys(replayPageMdxComponents).some((key) =>
        /recording|visualizer|playback/i.test(key),
      ),
    ).toBe(false);
  });

  test("goal-owned map exposes GoalFactoryReplay and stays distinct from shared maps", () => {
    expect(Object.keys(goalPageMdxComponents)).toEqual(["GoalFactoryReplay"]);
    expect(goalPageMdxComponents).not.toBe(replayPageMdxComponents);
    expect(goalPageMdxComponents).not.toBe(deepResearchPageMdxComponents);
    expect(goalPageMdxComponents).not.toBe(parentPageMdxComponents);
    expect(goalPageMdxComponents).not.toBe(subagentPageMdxComponents);
    expect(goalPageMdxComponents).not.toBe(fusionPageMdxComponents);
    expect(goalPageMdxComponents).not.toBe(reviewPageMdxComponents);
  });

  test("subagent-owned map exposes SubagentFactoryReplay and stays distinct from shared maps", () => {
    expect(Object.keys(subagentPageMdxComponents)).toEqual([
      "SubagentFactoryReplay",
    ]);
    expect(subagentPageMdxComponents).not.toBe(replayPageMdxComponents);
    expect(subagentPageMdxComponents).not.toBe(deepResearchPageMdxComponents);
    expect(subagentPageMdxComponents).not.toBe(parentPageMdxComponents);
    expect(subagentPageMdxComponents).not.toBe(goalPageMdxComponents);
    expect(subagentPageMdxComponents).not.toBe(fusionPageMdxComponents);
    expect(subagentPageMdxComponents).not.toBe(reviewPageMdxComponents);
  });

  test("fusion-owned map exposes FusionFactoryReplay and stays distinct from shared maps", () => {
    expect(Object.keys(fusionPageMdxComponents)).toEqual([
      "FusionFactoryReplay",
    ]);
    expect(fusionPageMdxComponents).not.toBe(replayPageMdxComponents);
    expect(fusionPageMdxComponents).not.toBe(deepResearchPageMdxComponents);
    expect(fusionPageMdxComponents).not.toBe(parentPageMdxComponents);
    expect(fusionPageMdxComponents).not.toBe(reviewPageMdxComponents);
    expect(fusionPageMdxComponents).not.toBe(goalPageMdxComponents);
    expect(fusionPageMdxComponents).not.toBe(subagentPageMdxComponents);
  });

  test("review-owned map exposes ReviewFactoryReplay and stays distinct from shared maps", () => {
    expect(Object.keys(reviewPageMdxComponents)).toEqual([
      "ReviewFactoryReplay",
    ]);
    expect(reviewPageMdxComponents).not.toBe(replayPageMdxComponents);
    expect(reviewPageMdxComponents).not.toBe(deepResearchPageMdxComponents);
    expect(reviewPageMdxComponents).not.toBe(parentPageMdxComponents);
    expect(reviewPageMdxComponents).not.toBe(fusionPageMdxComponents);
    expect(reviewPageMdxComponents).not.toBe(goalPageMdxComponents);
    expect(reviewPageMdxComponents).not.toBe(subagentPageMdxComponents);
  });

  test("deep-research map is marked non-replay and is distinct from the shared replay map", () => {
    expect(deepResearchMapKind).toBe("non-replay");
    expect(Object.keys(deepResearchPageMdxComponents)).toEqual([]);
    expect(deepResearchPageMdxComponents).not.toBe(replayPageMdxComponents);
    expect(deepResearchMapKind).not.toBe(replayMapKind);
  });

  test("parent index-only map stays distinct from both child maps", () => {
    expect(parentPageMdxComponents).not.toBe(replayPageMdxComponents);
    expect(parentPageMdxComponents).not.toBe(deepResearchPageMdxComponents);
    expect(Object.keys(parentPageMdxComponents)).toEqual([
      "PackagedFactoriesIndex",
    ]);
  });
});

describe("packaged-factories-index nested route-family loader cases", () => {
  test("remaining shared replay children resolve the shared replay-page map by identity", async () => {
    for (const childSlug of SHARED_REPLAY_CHILD_SLUGS) {
      const loaded = await loadRouteFamilyPageMdxComponents(
        "references",
        `packaged-factories-index/${childSlug}`,
      );
      expect(loaded).toBe(replayPageMdxComponents);
    }
  });

  test("goal resolves the goal-owned map and never the shared replay map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/goal",
    );
    expect(loaded).toBe(goalPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
    expect(loaded).not.toBe(subagentPageMdxComponents);
    expect(Object.keys(loaded)).toEqual(["GoalFactoryReplay"]);
  });

  test("subagent resolves the subagent-owned map and never the shared replay map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/subagent",
    );
    expect(loaded).toBe(subagentPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
    expect(loaded).not.toBe(goalPageMdxComponents);
    expect(Object.keys(loaded)).toEqual(["SubagentFactoryReplay"]);
  });

  test("fusion resolves the fusion-owned map and never the shared replay map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/fusion",
    );
    expect(loaded).toBe(fusionPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
    expect(Object.keys(loaded)).toEqual(["FusionFactoryReplay"]);
  });

  test("review resolves the review-owned map and never the shared replay map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/review",
    );
    expect(loaded).toBe(reviewPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
    expect(Object.keys(loaded)).toEqual(["ReviewFactoryReplay"]);
  });

  test("deep-research resolves the non-replay map and never the shared replay map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/deep-research",
    );
    expect(loaded).toBe(deepResearchPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
  });

  test("parent slug still resolves the index-only map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index",
    );
    expect(loaded).toBe(parentPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
    expect(loaded).not.toBe(deepResearchPageMdxComponents);
    expect(loaded).not.toBe(goalPageMdxComponents);
    expect(loaded).not.toBe(subagentPageMdxComponents);
    expect(loaded).not.toBe(fusionPageMdxComponents);
    expect(loaded).not.toBe(reviewPageMdxComponents);
  });
});
