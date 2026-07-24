/**
 * Focused import-graph proofs for the packaged-factories-index/fusion child.
 * Proves the fusion ownership surface (page MDX map + FusionFactoryReplay)
 * reaches only the fusion recording and cannot reach sibling recordings,
 * corpus generator modules, or the parent index renderer.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { collectParentImportGraphInputs } from "../parent-import-graph";
import {
  FUSION_IMPORT_GRAPH_FORBIDDEN_MARKERS,
  findForbiddenFusionImportGraphHits,
} from "./fusion-import-graph";

const PAGE_DIR = import.meta.dir;
const FUSION_OWNERSHIP_ENTRYPOINTS = [
  "page-mdx-components.tsx",
  "FusionFactoryReplay.tsx",
] as const;

describe("fusion import-graph forbidden classification", () => {
  test("matches non-fusion recordings, generator, and parent renderer markers", () => {
    const hits = findForbiddenFusionImportGraphHits([
      "src/content/docs/references/packaged-factories-index/fusion/FusionFactoryReplay.tsx",
      "src/content/docs/references/packaged-factories-index/generated/review.factory-recording.v1.json",
      "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
      "src/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index.ts",
      "src/content/docs/references/packaged-factories-index/PackagedFactoriesIndex.tsx",
      "src/content/docs/references/packaged-factories-index/page-mdx-components.tsx",
      "src/content/docs/references/packaged-factories-index/replay-page-mdx-components.tsx",
      "src/content/docs/references/packaged-factories-index/generated/index.json",
    ]);

    expect(hits.map((hit) => hit.marker)).toEqual([
      "review.factory-recording.v1.json",
      "goal.factory-recording.v1.json",
      "generate-packaged-factories-index",
      "PackagedFactoriesIndex",
      "packaged-factories-index/page-mdx-components",
      "packaged-factories-index/replay-page-mdx-components",
      "generated/index.json",
    ]);
    expect(FUSION_IMPORT_GRAPH_FORBIDDEN_MARKERS).toContain(
      "review.factory-recording.v1.json",
    );
  });

  test("returns no hits for a fusion-only ownership graph", () => {
    expect(
      findForbiddenFusionImportGraphHits([
        "src/content/docs/references/packaged-factories-index/fusion/page-mdx-components.tsx",
        "src/content/docs/references/packaged-factories-index/fusion/FusionFactoryReplay.tsx",
        "src/content/docs/references/packaged-factories-index/generated/fusion.factory-recording.v1.json",
        "src/features/factory-replay/controlled-factory-replay.tsx",
      ]),
    ).toEqual([]);
  });
});

describe("packaged-factories-index/fusion import-graph isolation", () => {
  test("fusion MDX map and replay mount reach fusion recording only", async () => {
    for (const relativeEntrypoint of FUSION_OWNERSHIP_ENTRYPOINTS) {
      const entrypoint = resolve(PAGE_DIR, relativeEntrypoint);
      const collected = await collectParentImportGraphInputs({ entrypoint });

      expect(collected.success).toBe(true);
      expect(collected.failureMessages).toEqual([]);
      expect(collected.inputPaths.length).toBeGreaterThan(0);
      expect(
        collected.inputPaths.some((path) =>
          path.replaceAll("\\", "/").endsWith(relativeEntrypoint),
        ),
      ).toBe(true);
      expect(
        collected.inputPaths.some((path) =>
          path
            .replaceAll("\\", "/")
            .includes("fusion.factory-recording.v1.json"),
        ),
      ).toBe(true);

      const forbiddenHits = findForbiddenFusionImportGraphHits(
        collected.inputPaths,
      );
      expect(forbiddenHits).toEqual([]);
    }
  });
});
