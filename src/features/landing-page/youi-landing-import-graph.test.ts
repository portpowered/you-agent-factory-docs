/**
 * Focused import-graph proofs for the home/landing Youi compact goal replay
 * client ownership surface. Proves the island and near-viewport gate cannot
 * reach non-goal recordings, the generated index corpus, raw JS source
 * artifacts, or the packaged-factories generator. Does not scan unrelated
 * source inventories.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  collectYouiLandingImportGraphInputs,
  findForbiddenYouiLandingImportGraphHits,
  isNonGoalFactoryRecordingInputPath,
  YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME,
  YOUI_LANDING_IMPORT_GRAPH_FORBIDDEN_MARKERS,
} from "./youi-landing-import-graph";

const COMPONENTS_DIR = resolve(import.meta.dir, "components");

const YOUI_CLIENT_OWNERSHIP_ENTRYPOINTS = [
  "YouiCompactGoalReplayNearViewport.tsx",
  "YouiCompactGoalReplayIsland.tsx",
] as const;

describe("youi landing import-graph forbidden classification", () => {
  test("matches non-goal recordings, index corpus, source artifacts, and generator", () => {
    const hits = findForbiddenYouiLandingImportGraphHits([
      "src/features/landing-page/components/YouiCompactGoalReplayIsland.tsx",
      "src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json",
      "src/content/docs/references/packaged-factories-index/generated/tts.factory-recording.v1.json",
      "src/content/docs/references/packaged-factories-index/generated/index.json",
      "src/content/docs/references/packaged-factories-index/generated/deep-research.source.json",
      "scripts/generate-packaged-factories-index.ts",
      "src/features/factory-replay/controlled-factory-replay.tsx",
      "../../../node_modules/@you-agent-factory/factory-replay/dist/index.js",
    ]);

    expect(hits.map((hit) => hit.marker)).toEqual([
      "non-goal.factory-recording.v1.json",
      "generated/index.json",
      ".source.json",
      "generate-packaged-factories-index",
    ]);
    expect(YOUI_LANDING_IMPORT_GRAPH_FORBIDDEN_MARKERS).toContain(
      "generated/index.json",
    );
  });

  test("allows the goal recording and shared factory-replay edges", () => {
    expect(
      findForbiddenYouiLandingImportGraphHits([
        "src/features/landing-page/components/YouiCompactGoalReplayIsland.tsx",
        "src/features/landing-page/components/YouiCompactGoalReplayNearViewport.tsx",
        `src/content/docs/references/packaged-factories-index/generated/${YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME}`,
        "src/features/factory-replay/index.ts",
        "src/features/factory-replay/controlled-factory-replay-compact.tsx",
        "../../../node_modules/@you-agent-factory/factory-replay/dist/index.js",
        "../../../node_modules/@you-agent-factory/factory-visualizers/dist/index.js",
        "../../../node_modules/@you-agent-factory/client/dist/generated/factory.schema.json",
      ]),
    ).toEqual([]);
  });

  test("basename helper distinguishes goal vs non-goal recordings", () => {
    expect(
      isNonGoalFactoryRecordingInputPath(
        `generated/${YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME}`,
      ),
    ).toBe(false);
    expect(
      isNonGoalFactoryRecordingInputPath(
        "generated/tts.factory-recording.v1.json",
      ),
    ).toBe(true);
  });
});

describe("youi landing client import-graph isolation", () => {
  test("near-viewport gate and island graphs allow goal recording but not forbidden corpus", async () => {
    for (const relativeEntrypoint of YOUI_CLIENT_OWNERSHIP_ENTRYPOINTS) {
      const entrypoint = resolve(COMPONENTS_DIR, relativeEntrypoint);
      const collected = await collectYouiLandingImportGraphInputs({
        entrypoint,
      });

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
            .endsWith(YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME),
        ),
      ).toBe(true);
      expect(
        collected.inputPaths.some((path) =>
          path.replaceAll("\\", "/").includes("src/features/factory-replay/"),
        ),
      ).toBe(true);

      const forbiddenHits = findForbiddenYouiLandingImportGraphHits(
        collected.inputPaths,
      );
      expect(forbiddenHits).toEqual([]);
    }
  });

  test("detector still observes forbidden modules from a deliberately polluted entry", async () => {
    const collected = await collectYouiLandingImportGraphInputs({
      entrypoint: resolve(
        import.meta.dir,
        "youi-landing-import-graph.polluted-fixture.ts",
      ),
    });

    expect(collected.success).toBe(true);
    const forbiddenHits = findForbiddenYouiLandingImportGraphHits(
      collected.inputPaths,
    );
    expect(forbiddenHits.length).toBeGreaterThan(0);
    expect(
      forbiddenHits.some(
        (hit) => hit.marker === "non-goal.factory-recording.v1.json",
      ),
    ).toBe(true);
    expect(
      forbiddenHits.some((hit) => hit.marker === "generated/index.json"),
    ).toBe(true);
    expect(forbiddenHits.some((hit) => hit.marker === ".source.json")).toBe(
      true,
    );
  });
});
