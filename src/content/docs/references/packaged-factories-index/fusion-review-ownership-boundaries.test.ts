/**
 * Story 005 consolidated ownership-boundary proofs for fusion and review.
 * Reuses child-local forbidden-marker classifiers + the parent Bun metafile
 * collector. Also proves the shared replay-page-mdx-components placeholder
 * never reaches packaged-factory recording artifacts.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { findForbiddenFusionImportGraphHits } from "./fusion/fusion-import-graph";
import { collectParentImportGraphInputs } from "./parent-import-graph";
import { findForbiddenReviewImportGraphHits } from "./review/review-import-graph";

const PAGE_DIR = import.meta.dir;

const PACKAGED_RECORDING_FILENAMES = [
  "goal.factory-recording.v1.json",
  "subagent.factory-recording.v1.json",
  "fusion.factory-recording.v1.json",
  "review.factory-recording.v1.json",
  "quorum.factory-recording.v1.json",
  "tts.factory-recording.v1.json",
] as const;

const CHILD_OWNERSHIP_CASES = [
  {
    ownedSlug: "fusion",
    ownedRecording: "fusion.factory-recording.v1.json",
    relativeEntrypoint: "fusion/page-mdx-components.tsx",
    findForbiddenHits: findForbiddenFusionImportGraphHits,
  },
  {
    ownedSlug: "review",
    ownedRecording: "review.factory-recording.v1.json",
    relativeEntrypoint: "review/page-mdx-components.tsx",
    findForbiddenHits: findForbiddenReviewImportGraphHits,
  },
] as const;

describe("fusion and review ownership boundary consolidation", () => {
  test("each child-owned page MDX map reaches only its own packaged recording", async () => {
    for (const ownershipCase of CHILD_OWNERSHIP_CASES) {
      const entrypoint = resolve(PAGE_DIR, ownershipCase.relativeEntrypoint);
      const collected = await collectParentImportGraphInputs({ entrypoint });

      expect(collected.success).toBe(true);
      expect(collected.failureMessages).toEqual([]);
      expect(collected.inputPaths.length).toBeGreaterThan(0);
      expect(
        collected.inputPaths.some((path) =>
          path.replaceAll("\\", "/").endsWith(ownershipCase.relativeEntrypoint),
        ),
      ).toBe(true);
      expect(
        collected.inputPaths.some((path) =>
          path.replaceAll("\\", "/").includes(ownershipCase.ownedRecording),
        ),
      ).toBe(true);
      expect(ownershipCase.findForbiddenHits(collected.inputPaths)).toEqual([]);
    }
  });

  test("shared replay-page-mdx-components reaches no packaged-factory recordings", async () => {
    const entrypoint = resolve(PAGE_DIR, "replay-page-mdx-components.tsx");
    const collected = await collectParentImportGraphInputs({ entrypoint });

    expect(collected.success).toBe(true);
    expect(collected.failureMessages).toEqual([]);
    expect(
      collected.inputPaths.some((path) =>
        path.replaceAll("\\", "/").endsWith("replay-page-mdx-components.tsx"),
      ),
    ).toBe(true);

    const recordingHits = collected.inputPaths.filter((path) => {
      const normalized = path.replaceAll("\\", "/");
      return PACKAGED_RECORDING_FILENAMES.some((filename) =>
        normalized.includes(filename),
      );
    });
    expect(recordingHits).toEqual([]);
  });

  test("detector observes cross-child leakage when both recordings appear", () => {
    const mixedPaths = [
      "generated/fusion.factory-recording.v1.json",
      "generated/review.factory-recording.v1.json",
    ];

    expect(
      findForbiddenFusionImportGraphHits(mixedPaths).map((hit) => hit.marker),
    ).toEqual(["review.factory-recording.v1.json"]);
    expect(
      findForbiddenReviewImportGraphHits(mixedPaths).map((hit) => hit.marker),
    ).toEqual(["fusion.factory-recording.v1.json"]);
  });
});
