/**
 * Focused import-graph proofs for goal and subagent child recording isolation.
 * Each child-owned page MDX map may reach only its own packaged-factory
 * recording JSON. Does not scan unrelated source inventories or sibling page
 * bodies.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  collectChildRecordingImportGraphInputs,
  findForeignPackagedRecordingHits,
  graphIncludesOwnedPackagedRecording,
  ownedPackagedFactoryRecordingFilename,
  PACKAGED_FACTORY_RECORDING_FILENAMES,
} from "./child-recording-import-graph";

const PAGE_DIR = import.meta.dir;

const CHILD_OWNERSHIP_CASES = [
  {
    ownedSlug: "goal" as const,
    relativeEntrypoint: "goal/page-mdx-components.tsx",
  },
  {
    ownedSlug: "subagent" as const,
    relativeEntrypoint: "subagent/page-mdx-components.tsx",
  },
] as const;

describe("child recording import-graph classification", () => {
  test("owned filename helpers cover all packaged recording slugs", () => {
    expect(ownedPackagedFactoryRecordingFilename("goal")).toBe(
      "goal.factory-recording.v1.json",
    );
    expect(ownedPackagedFactoryRecordingFilename("subagent")).toBe(
      "subagent.factory-recording.v1.json",
    );
    expect(PACKAGED_FACTORY_RECORDING_FILENAMES).toContain(
      "goal.factory-recording.v1.json",
    );
    expect(PACKAGED_FACTORY_RECORDING_FILENAMES).toContain(
      "fusion.factory-recording.v1.json",
    );
  });

  test("finds foreign packaged recordings while allowing the owned file", () => {
    const goalHits = findForeignPackagedRecordingHits(
      [
        "src/content/docs/references/packaged-factories-index/goal/GoalFactoryReplay.tsx",
        "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
        "src/content/docs/references/packaged-factories-index/generated/subagent.factory-recording.v1.json",
        "src/content/docs/references/packaged-factories-index/generated/fusion.factory-recording.v1.json",
      ],
      "goal",
    );

    expect(goalHits.map((hit) => hit.recordingFilename)).toEqual([
      "subagent.factory-recording.v1.json",
      "fusion.factory-recording.v1.json",
    ]);
    expect(
      graphIncludesOwnedPackagedRecording(
        [
          "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
        ],
        "goal",
      ),
    ).toBe(true);
  });

  test("returns no foreign hits for an owned-only recording graph", () => {
    expect(
      findForeignPackagedRecordingHits(
        [
          "src/content/docs/references/packaged-factories-index/goal/page-mdx-components.tsx",
          "src/content/docs/references/packaged-factories-index/goal/GoalFactoryReplay.tsx",
          "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
          "src/features/factory-replay/index.ts",
        ],
        "goal",
      ),
    ).toEqual([]);
  });
});

describe("goal and subagent child recording import-graph isolation", () => {
  test("each child-owned page MDX map reaches only its own packaged recording", async () => {
    for (const ownershipCase of CHILD_OWNERSHIP_CASES) {
      const entrypoint = resolve(PAGE_DIR, ownershipCase.relativeEntrypoint);
      const collected = await collectChildRecordingImportGraphInputs({
        entrypoint,
      });

      expect(collected.success).toBe(true);
      expect(collected.failureMessages).toEqual([]);
      expect(collected.inputPaths.length).toBeGreaterThan(0);
      expect(
        collected.inputPaths.some((path) =>
          path.replaceAll("\\", "/").endsWith(ownershipCase.relativeEntrypoint),
        ),
      ).toBe(true);
      expect(
        graphIncludesOwnedPackagedRecording(
          collected.inputPaths,
          ownershipCase.ownedSlug,
        ),
      ).toBe(true);

      const foreignHits = findForeignPackagedRecordingHits(
        collected.inputPaths,
        ownershipCase.ownedSlug,
      );
      expect(foreignHits).toEqual([]);
    }
  });

  test("detector observes foreign recordings when both goal and subagent files are present", () => {
    const mixedPaths = [
      "generated/goal.factory-recording.v1.json",
      "generated/subagent.factory-recording.v1.json",
    ];

    expect(findForeignPackagedRecordingHits(mixedPaths, "goal")).toEqual([
      {
        inputPath: "generated/subagent.factory-recording.v1.json",
        recordingFilename: "subagent.factory-recording.v1.json",
      },
    ]);
    expect(findForeignPackagedRecordingHits(mixedPaths, "subagent")).toEqual([
      {
        inputPath: "generated/goal.factory-recording.v1.json",
        recordingFilename: "goal.factory-recording.v1.json",
      },
    ]);
  });
});
