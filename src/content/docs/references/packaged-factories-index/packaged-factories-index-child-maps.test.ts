/**
 * Focused proofs for packaged-factories-index nested child component-map
 * wiring: standard replay children share one literal replay-page map;
 * deep-research resolves a distinct non-replay map. Does not author child
 * page bodies (Batch 4) or assert parent import-graph isolation (story 005).
 */
import { describe, expect, test } from "bun:test";
import { loadRouteFamilyPageMdxComponents } from "@/lib/content/route-family-local-docs-page-load";
import {
  packagedFactoriesIndexChildComponentMapKind as deepResearchMapKind,
  pageMdxComponents as deepResearchPageMdxComponents,
} from "./deep-research-page-mdx-components";
import { pageMdxComponents as parentPageMdxComponents } from "./page-mdx-components";
import {
  packagedFactoriesIndexChildComponentMapKind as replayMapKind,
  pageMdxComponents as replayPageMdxComponents,
} from "./replay-page-mdx-components";

const STANDARD_REPLAY_CHILD_SLUGS = [
  "goal",
  "subagent",
  "fusion",
  "review",
  "quorum",
  "tts",
] as const;

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
  test("standard replay children resolve the shared replay-page map by identity", async () => {
    for (const childSlug of STANDARD_REPLAY_CHILD_SLUGS) {
      const loaded = await loadRouteFamilyPageMdxComponents(
        "references",
        `packaged-factories-index/${childSlug}`,
      );
      expect(loaded).toBe(replayPageMdxComponents);
    }
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
  });
});
