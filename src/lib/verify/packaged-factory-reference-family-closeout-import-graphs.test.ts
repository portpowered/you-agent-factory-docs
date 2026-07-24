/**
 * Closeout story 004 — tip proofs for route-local import graphs and
 * home/index exclusions (children, parent index, landing Youi, positive controls).
 */
import { describe, expect, test } from "bun:test";
import {
  findForeignPackagedRecordingHits,
  ownedPackagedFactoryRecordingFilename,
} from "@/content/docs/references/packaged-factories-index/child-recording-import-graph";
import { findForbiddenParentImportGraphHits } from "@/content/docs/references/packaged-factories-index/parent-import-graph";
import { findForbiddenYouiLandingImportGraphHits } from "@/features/landing-page/youi-landing-import-graph";
import {
  PACKAGED_FACTORY_CLOSEOUT_CHILD_IMPORT_GRAPH_CASES,
  PACKAGED_FACTORY_CLOSEOUT_PARENT_OWNERSHIP_ENTRYPOINTS,
  PACKAGED_FACTORY_CLOSEOUT_STANDARD_CHILD_SLUGS,
  PACKAGED_FACTORY_CLOSEOUT_YOUI_OWNERSHIP_ENTRYPOINTS,
  PackagedFactoryCloseoutImportGraphError,
  provePackagedFactoryCloseoutChildImportGraph,
  provePackagedFactoryCloseoutImportGraphPositiveControls,
  provePackagedFactoryCloseoutParentImportGraphs,
  provePackagedFactoryCloseoutStandardChildImportGraphs,
  provePackagedFactoryCloseoutYouiImportGraphs,
  provePackagedFactoryReferenceFamilyCloseoutImportGraphs,
} from "./packaged-factory-reference-family-closeout-import-graphs";

describe("packaged-factory-reference-family-closeout import graphs (pure)", () => {
  test("standard child ownership cases cover all recording slugs", () => {
    expect(PACKAGED_FACTORY_CLOSEOUT_STANDARD_CHILD_SLUGS).toEqual([
      "goal",
      "subagent",
      "fusion",
      "review",
      "quorum",
      "tts",
    ]);
    expect(PACKAGED_FACTORY_CLOSEOUT_CHILD_IMPORT_GRAPH_CASES).toHaveLength(6);
    expect(
      PACKAGED_FACTORY_CLOSEOUT_CHILD_IMPORT_GRAPH_CASES.map(
        (entry) => entry.relativeEntrypoint,
      ),
    ).toEqual([
      "goal/page-mdx-components.tsx",
      "subagent/page-mdx-components.tsx",
      "fusion/page-mdx-components.tsx",
      "review/page-mdx-components.tsx",
      "quorum/page-mdx-components.tsx",
      "tts/page-mdx-components.tsx",
    ]);
  });

  test("foreign-recording classifier fails closed on mixed graphs", () => {
    const hits = findForeignPackagedRecordingHits(
      [
        "generated/goal.factory-recording.v1.json",
        "generated/tts.factory-recording.v1.json",
      ],
      "goal",
    );
    expect(hits).toEqual([
      {
        inputPath: "generated/tts.factory-recording.v1.json",
        recordingFilename: "tts.factory-recording.v1.json",
      },
    ]);
    expect(ownedPackagedFactoryRecordingFilename("goal")).toBe(
      "goal.factory-recording.v1.json",
    );
  });

  test("parent forbidden classifier observes replay and recording markers", () => {
    const hits = findForbiddenParentImportGraphHits([
      "src/features/factory-replay/index.ts",
      "generated/goal.factory-recording.v1.json",
    ]);
    expect(hits.map((hit) => hit.marker)).toEqual([
      "src/features/factory-replay/",
      ".factory-recording.v1.json",
    ]);
  });

  test("youi forbidden classifier observes non-goal corpus and generator", () => {
    const hits = findForbiddenYouiLandingImportGraphHits([
      "generated/tts.factory-recording.v1.json",
      "generated/index.json",
      "generated/deep-research.source.json",
      "generate-packaged-factories-index.ts",
    ]);
    expect(hits.map((hit) => hit.marker)).toEqual([
      "non-goal.factory-recording.v1.json",
      "generated/index.json",
      ".source.json",
      "generate-packaged-factories-index",
    ]);
  });
});

describe("packaged-factory-reference-family-closeout import graphs (tip)", () => {
  test("each standard child MDX map reaches only its owned recording", async () => {
    const evidence =
      await provePackagedFactoryCloseoutStandardChildImportGraphs();
    expect(evidence).toHaveLength(6);
    for (const child of evidence) {
      expect(child.includesOwnedRecording).toBe(true);
      expect(child.foreignHits).toEqual([]);
      expect(child.inputPathCount).toBeGreaterThan(0);
      expect(child.ownedRecordingFilename).toBe(
        ownedPackagedFactoryRecordingFilename(child.ownedSlug),
      );
    }
  });

  test("single child proof fails closed when slug ownership is asserted", async () => {
    const goalCase = PACKAGED_FACTORY_CLOSEOUT_CHILD_IMPORT_GRAPH_CASES.find(
      (entry) => entry.ownedSlug === "goal",
    );
    expect(goalCase).toBeDefined();
    if (goalCase === undefined) {
      throw new Error("Expected goal child ownership case");
    }
    const goal = await provePackagedFactoryCloseoutChildImportGraph(goalCase);
    expect(goal.ownedSlug).toBe("goal");
    expect(goal.foreignHits).toEqual([]);
  });

  test("parent index ownership surfaces stay free of replay modules", async () => {
    const evidence = await provePackagedFactoryCloseoutParentImportGraphs();
    expect(evidence.map((entry) => entry.entrypoint)).toEqual([
      ...PACKAGED_FACTORY_CLOSEOUT_PARENT_OWNERSHIP_ENTRYPOINTS,
    ]);
    for (const parent of evidence) {
      expect(parent.includesGeneratedIndex).toBe(true);
      expect(parent.forbiddenHits).toEqual([]);
      expect(parent.inputPathCount).toBeGreaterThan(0);
    }
  });

  test("landing Youi client graphs allow goal recording and exclude corpus", async () => {
    const evidence = await provePackagedFactoryCloseoutYouiImportGraphs();
    expect(evidence.map((entry) => entry.entrypoint)).toEqual([
      ...PACKAGED_FACTORY_CLOSEOUT_YOUI_OWNERSHIP_ENTRYPOINTS,
    ]);
    for (const youi of evidence) {
      expect(youi.includesGoalRecording).toBe(true);
      expect(youi.includesFactoryReplay).toBe(true);
      expect(youi.forbiddenHits).toEqual([]);
      expect(youi.inputPathCount).toBeGreaterThan(0);
    }
  });

  test("positive-control detectors observe polluted and replay entrypoints", async () => {
    const evidence =
      await provePackagedFactoryCloseoutImportGraphPositiveControls();
    expect(evidence.parentDetectorObservesReplay).toBe(true);
    expect(evidence.youiPollutedFixtureObservesForbidden).toBe(true);
    expect(evidence.youiPollutedMarkers).toContain(
      "non-goal.factory-recording.v1.json",
    );
    expect(evidence.youiPollutedMarkers).toContain("generated/index.json");
    expect(evidence.youiPollutedMarkers).toContain(".source.json");
  });

  test("composed closeout import-graph proof covers children, parent, youi, controls", async () => {
    const evidence =
      await provePackagedFactoryReferenceFamilyCloseoutImportGraphs();
    expect(evidence.children).toHaveLength(6);
    expect(evidence.parent).toHaveLength(2);
    expect(evidence.youi).toHaveLength(2);
    expect(evidence.positiveControl.parentDetectorObservesReplay).toBe(true);
    expect(evidence.positiveControl.youiPollutedFixtureObservesForbidden).toBe(
      true,
    );
  });

  test("error class carries a stable closeout code", () => {
    const error = new PackagedFactoryCloseoutImportGraphError(
      "foreign-recording",
      "fixture",
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("foreign-recording");
    expect(error.name).toBe("PackagedFactoryCloseoutImportGraphError");
  });
});
