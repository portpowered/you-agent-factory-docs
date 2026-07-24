/**
 * Focused import-graph proofs for the packaged-factories-index/review child.
 * Proves the review ownership surface (page MDX map + ReviewFactoryReplay)
 * reaches only the review recording and cannot reach sibling recordings,
 * corpus generator modules, or the parent index renderer.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { collectParentImportGraphInputs } from "../parent-import-graph";
import {
  findForbiddenReviewImportGraphHits,
  REVIEW_IMPORT_GRAPH_FORBIDDEN_MARKERS,
} from "./review-import-graph";

const PAGE_DIR = import.meta.dir;
const REVIEW_OWNERSHIP_ENTRYPOINTS = [
  "page-mdx-components.tsx",
  "ReviewFactoryReplay.tsx",
] as const;

describe("review import-graph forbidden classification", () => {
  test("matches non-review recordings, generator, and parent renderer markers", () => {
    const hits = findForbiddenReviewImportGraphHits([
      "src/content/docs/references/packaged-factories-index/review/ReviewFactoryReplay.tsx",
      "src/content/docs/references/packaged-factories-index/generated/fusion.factory-recording.v1.json",
      "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
      "src/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index.ts",
      "src/content/docs/references/packaged-factories-index/PackagedFactoriesIndex.tsx",
      "src/content/docs/references/packaged-factories-index/page-mdx-components.tsx",
      "src/content/docs/references/packaged-factories-index/replay-page-mdx-components.tsx",
      "src/content/docs/references/packaged-factories-index/generated/index.json",
    ]);

    expect(hits.map((hit) => hit.marker)).toEqual([
      "fusion.factory-recording.v1.json",
      "goal.factory-recording.v1.json",
      "generate-packaged-factories-index",
      "PackagedFactoriesIndex",
      "packaged-factories-index/page-mdx-components",
      "packaged-factories-index/replay-page-mdx-components",
      "generated/index.json",
    ]);
    expect(REVIEW_IMPORT_GRAPH_FORBIDDEN_MARKERS).toContain(
      "fusion.factory-recording.v1.json",
    );
  });

  test("returns no hits for a review-only ownership graph", () => {
    expect(
      findForbiddenReviewImportGraphHits([
        "src/content/docs/references/packaged-factories-index/review/page-mdx-components.tsx",
        "src/content/docs/references/packaged-factories-index/review/ReviewFactoryReplay.tsx",
        "src/content/docs/references/packaged-factories-index/generated/review.factory-recording.v1.json",
        "src/features/factory-replay/controlled-factory-replay.tsx",
      ]),
    ).toEqual([]);
  });
});

describe("packaged-factories-index/review import-graph isolation", () => {
  test("review MDX map and replay mount reach review recording only", async () => {
    for (const relativeEntrypoint of REVIEW_OWNERSHIP_ENTRYPOINTS) {
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
            .includes("review.factory-recording.v1.json"),
        ),
      ).toBe(true);

      const forbiddenHits = findForbiddenReviewImportGraphHits(
        collected.inputPaths,
      );
      expect(forbiddenHits).toEqual([]);
    }
  });
});
