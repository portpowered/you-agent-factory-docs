/**
 * Focused import-graph proofs for the packaged-factories-index parent.
 * Proves the index-only ownership surface (page MDX component map + index
 * renderer) cannot reach factory-replay packages, shared playback modules, or
 * generated recording JSON. Does not scan unrelated source inventories.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  collectParentImportGraphInputs,
  findForbiddenParentImportGraphHits,
  PARENT_IMPORT_GRAPH_FORBIDDEN_MARKERS,
} from "./parent-import-graph";

const PAGE_DIR = import.meta.dir;
const PARENT_OWNERSHIP_ENTRYPOINTS = [
  "page-mdx-components.tsx",
  "PackagedFactoriesIndex.tsx",
] as const;

describe("parent import-graph forbidden classification", () => {
  test("matches package, feature playback, and recording markers", () => {
    const hits = findForbiddenParentImportGraphHits([
      "src/content/docs/references/packaged-factories-index/PackagedFactoriesIndex.tsx",
      "../../../node_modules/@you-agent-factory/factory-replay/dist/index.js",
      "../../../node_modules/@you-agent-factory/factory-visualizers/dist/index.js",
      "src/features/factory-replay/playback-transitions.ts",
      "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
      "src/features/factory-ui/data-display.ts",
    ]);

    expect(hits.map((hit) => hit.marker)).toEqual([
      "@you-agent-factory/factory-replay",
      "@you-agent-factory/factory-visualizers",
      "src/features/factory-replay/",
      ".factory-recording.v1.json",
    ]);
    expect(PARENT_IMPORT_GRAPH_FORBIDDEN_MARKERS).toContain(
      "@you-agent-factory/factory-replay",
    );
  });

  test("returns no hits for an index-only ownership graph", () => {
    expect(
      findForbiddenParentImportGraphHits([
        "src/content/docs/references/packaged-factories-index/page-mdx-components.tsx",
        "src/content/docs/references/packaged-factories-index/PackagedFactoriesIndex.tsx",
        "src/content/docs/references/packaged-factories-index/project-packaged-factories-index.ts",
        "src/content/docs/references/packaged-factories-index/generated/index.json",
        "src/features/factory-ui/data-display.ts",
      ]),
    ).toEqual([]);
  });
});

describe("packaged-factories-index parent import-graph isolation", () => {
  test("page MDX map and index renderer graphs cannot reach replay or visualizer modules", async () => {
    for (const relativeEntrypoint of PARENT_OWNERSHIP_ENTRYPOINTS) {
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
          path.replaceAll("\\", "/").includes("generated/index.json"),
        ),
      ).toBe(true);

      const forbiddenHits = findForbiddenParentImportGraphHits(
        collected.inputPaths,
      );
      expect(forbiddenHits).toEqual([]);
    }
  });

  test("detector still observes forbidden modules when starting from shared factory-replay", async () => {
    const collected = await collectParentImportGraphInputs({
      entrypoint: resolve(
        process.cwd(),
        "src/features/factory-replay/index.ts",
      ),
    });

    expect(collected.success).toBe(true);
    const forbiddenHits = findForbiddenParentImportGraphHits(
      collected.inputPaths,
    );
    expect(forbiddenHits.length).toBeGreaterThan(0);
    expect(
      forbiddenHits.some(
        (hit) => hit.marker === "@you-agent-factory/factory-replay",
      ),
    ).toBe(true);
    expect(
      forbiddenHits.some(
        (hit) => hit.marker === "src/features/factory-replay/",
      ),
    ).toBe(true);
  });
});
