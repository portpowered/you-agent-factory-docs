/**
 * Focused import-graph proofs for quorum and tts child recording isolation.
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
    ownedSlug: "quorum" as const,
    relativeEntrypoint: "quorum/page-mdx-components.tsx",
  },
  {
    ownedSlug: "tts" as const,
    relativeEntrypoint: "tts/page-mdx-components.tsx",
  },
] as const;

describe("quorum/tts child recording import-graph classification", () => {
  test("owned filename helpers cover quorum and tts packaged recordings", () => {
    expect(ownedPackagedFactoryRecordingFilename("quorum")).toBe(
      "quorum.factory-recording.v1.json",
    );
    expect(ownedPackagedFactoryRecordingFilename("tts")).toBe(
      "tts.factory-recording.v1.json",
    );
    expect(PACKAGED_FACTORY_RECORDING_FILENAMES).toContain(
      "quorum.factory-recording.v1.json",
    );
    expect(PACKAGED_FACTORY_RECORDING_FILENAMES).toContain(
      "tts.factory-recording.v1.json",
    );
  });

  test("finds foreign packaged recordings while allowing the owned file", () => {
    const quorumHits = findForeignPackagedRecordingHits(
      [
        "src/content/docs/references/packaged-factories-index/quorum/QuorumFactoryReplay.tsx",
        "src/content/docs/references/packaged-factories-index/generated/quorum.factory-recording.v1.json",
        "src/content/docs/references/packaged-factories-index/generated/tts.factory-recording.v1.json",
        "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
      ],
      "quorum",
    );

    expect(quorumHits.map((hit) => hit.recordingFilename)).toEqual([
      "tts.factory-recording.v1.json",
      "goal.factory-recording.v1.json",
    ]);
    expect(
      graphIncludesOwnedPackagedRecording(
        [
          "src/content/docs/references/packaged-factories-index/generated/quorum.factory-recording.v1.json",
        ],
        "quorum",
      ),
    ).toBe(true);
  });

  test("returns no foreign hits for an owned-only recording graph", () => {
    expect(
      findForeignPackagedRecordingHits(
        [
          "src/content/docs/references/packaged-factories-index/tts/page-mdx-components.tsx",
          "src/content/docs/references/packaged-factories-index/tts/TtsFactoryReplay.tsx",
          "src/content/docs/references/packaged-factories-index/generated/tts.factory-recording.v1.json",
          "src/features/factory-replay/index.ts",
        ],
        "tts",
      ),
    ).toEqual([]);
  });
});

describe("quorum and tts child recording import-graph isolation", () => {
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

  test("detector observes foreign recordings when both quorum and tts files are present", () => {
    const mixedPaths = [
      "generated/quorum.factory-recording.v1.json",
      "generated/tts.factory-recording.v1.json",
    ];

    expect(findForeignPackagedRecordingHits(mixedPaths, "quorum")).toEqual([
      {
        inputPath: "generated/tts.factory-recording.v1.json",
        recordingFilename: "tts.factory-recording.v1.json",
      },
    ]);
    expect(findForeignPackagedRecordingHits(mixedPaths, "tts")).toEqual([
      {
        inputPath: "generated/quorum.factory-recording.v1.json",
        recordingFilename: "quorum.factory-recording.v1.json",
      },
    ]);
  });
});
