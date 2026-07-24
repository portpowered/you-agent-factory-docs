/**
 * Closeout story 008 — tip proofs for the family browser evidence pack and
 * reproducible gate/SHA notes.
 */
import { describe, expect, test } from "bun:test";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import { PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS } from "./packaged-factory-reference-family-closeout-deep-research";
import {
  assertPackagedFactoryCloseoutEvidencePackIsComplete,
  buildPackagedFactoryCloseoutEvidencePack,
  buildPackagedFactoryCloseoutPassingGateOutcomes,
  listPackagedFactoryCloseoutEvidenceGateTargets,
  PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE,
  PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY,
  PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT,
  type PackagedFactoryCloseoutBrowserSurfaceObservation,
  PackagedFactoryCloseoutEvidenceError,
  provePackagedFactoryReferenceFamilyCloseoutEvidenceContract,
} from "./packaged-factory-reference-family-closeout-evidence";
import { PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID } from "./packaged-factory-reference-family-closeout-replay";

const TIP_SHA = "a".repeat(40);
const RECORDED_AT = "2026-07-24T12:00:00.000Z";

function greenBrowserSurfaces(): PackagedFactoryCloseoutBrowserSurfaceObservation[] {
  return [
    {
      surfaceId: "parent-index",
      ok: true,
      orderedChildSlugs: [...PACKAGED_FACTORIES_ALLOWLIST_SLUGS],
      definitionPanelCount: PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length,
      childLinkCount: PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length,
    },
    {
      surfaceId: "standard-child-replay",
      ok: true,
      children:
        PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY.map(
          (slug) => ({
            slug,
            path: `/docs/references/packaged-factories-index/${slug}`,
            replayMode: "full" as const,
            playPause: true as const,
          }),
        ),
    },
    {
      surfaceId: "deep-research-child",
      ok: true,
      purposeVisible: true,
      usageExampleVisible: true,
      javascriptRuntimeHref:
        PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.javascriptRuntime,
      dynamicWorkflowsHref:
        PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.dynamicWorkflows,
      forbiddenSelectorHits: [],
    },
    {
      surfaceId: "home-youi",
      ok: true,
      compactReplayActivated: true,
      playPause: true,
      recordingId: PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
    },
  ];
}

describe("packaged-factory-reference-family-closeout evidence (pure)", () => {
  test("locks browser surfaces, standard children, gates, and ownership fence", () => {
    const contract =
      provePackagedFactoryReferenceFamilyCloseoutEvidenceContract();
    expect(contract.ownershipFence).toBe(
      PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE,
    );
    expect(contract.browserSurfaceIds).toEqual([
      "parent-index",
      "standard-child-replay",
      "deep-research-child",
      "home-youi",
    ]);
    expect(contract.allowlistOrder).toEqual([
      "goal",
      "subagent",
      "fusion",
      "review",
      "quorum",
      "tts",
      "deep-research",
    ]);
    expect(contract.standardChildrenForReplay).toEqual(["goal", "subagent"]);
    expect(contract.repositoryGateCommands).toEqual([
      "make validate-data",
      "make linkcheck",
      "make check",
      "make build",
      "make a11y",
      "make budget",
      "make ci",
    ]);
    expect(contract.completeStatement).toBe(
      PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT,
    );
  });

  test("catalogues PRD repository gate targets in order", () => {
    expect(
      listPackagedFactoryCloseoutEvidenceGateTargets().map(
        (gate) => gate.makeTarget,
      ),
    ).toEqual([
      "validate-data",
      "linkcheck",
      "check",
      "build",
      "a11y",
      "budget",
      "ci",
    ]);
  });

  test("builds a complete evidence pack when gates and browser surfaces are green", () => {
    const pack = buildPackagedFactoryCloseoutEvidencePack({
      tipCommitSha: TIP_SHA,
      recordedAtUtc: RECORDED_AT,
      gateOutcomes:
        buildPackagedFactoryCloseoutPassingGateOutcomes(RECORDED_AT),
      browserSurfaces: greenBrowserSurfaces(),
      narrowIntegrationFixes: [
        "launchPlaywrightBrowser CDP handshake retries (story 007 mergeability)",
      ],
    });

    expect(pack.closeoutStatus).toBe("complete");
    expect(pack.residualFollowUps).toEqual([]);
    expect(pack.closeoutStatement).toBe(
      PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT,
    );
    expect(pack.tipCommitSha).toBe(TIP_SHA);
    expect(pack.gateOutcomes.every((gate) => gate.status === "pass")).toBe(
      true,
    );
    expect(pack.browserSurfaces).toHaveLength(4);
    assertPackagedFactoryCloseoutEvidencePackIsComplete(pack);
  });

  test("fails closed on tip SHA drift from 40-char hex", () => {
    expect(() =>
      buildPackagedFactoryCloseoutEvidencePack({
        tipCommitSha: "not-a-sha",
        recordedAtUtc: RECORDED_AT,
        gateOutcomes:
          buildPackagedFactoryCloseoutPassingGateOutcomes(RECORDED_AT),
        browserSurfaces: greenBrowserSurfaces(),
      }),
    ).toThrow(PackagedFactoryCloseoutEvidenceError);
  });

  test("fails closed when parent index order drifts from allowlist", () => {
    const surfaces = greenBrowserSurfaces();
    const parent = surfaces[0];
    if (parent?.surfaceId !== "parent-index") {
      throw new Error("expected parent-index fixture");
    }
    surfaces[0] = {
      ...parent,
      orderedChildSlugs: [...parent.orderedChildSlugs].reverse(),
    };

    expect(() =>
      buildPackagedFactoryCloseoutEvidencePack({
        tipCommitSha: TIP_SHA,
        recordedAtUtc: RECORDED_AT,
        gateOutcomes:
          buildPackagedFactoryCloseoutPassingGateOutcomes(RECORDED_AT),
        browserSurfaces: surfaces,
      }),
    ).toThrow(PackagedFactoryCloseoutEvidenceError);
  });

  test("fails closed when fewer than two standard children report Play/Pause", () => {
    const surfaces = greenBrowserSurfaces();
    const children = surfaces[1];
    if (children?.surfaceId !== "standard-child-replay") {
      throw new Error("expected standard-child-replay fixture");
    }
    surfaces[1] = {
      ...children,
      children: children.children.slice(0, 1),
    };

    expect(() =>
      buildPackagedFactoryCloseoutEvidencePack({
        tipCommitSha: TIP_SHA,
        recordedAtUtc: RECORDED_AT,
        gateOutcomes:
          buildPackagedFactoryCloseoutPassingGateOutcomes(RECORDED_AT),
        browserSurfaces: surfaces,
      }),
    ).toThrow(PackagedFactoryCloseoutEvidenceError);
  });

  test("requires residual follow-ups when a repository gate fails", () => {
    const gates = buildPackagedFactoryCloseoutPassingGateOutcomes(RECORDED_AT);
    const lastGate = gates.at(-1);
    if (lastGate === undefined) {
      throw new Error("expected repository gate inventory");
    }
    gates[gates.length - 1] = {
      ...lastGate,
      status: "fail",
    };

    expect(() =>
      buildPackagedFactoryCloseoutEvidencePack({
        tipCommitSha: TIP_SHA,
        recordedAtUtc: RECORDED_AT,
        gateOutcomes: gates,
        browserSurfaces: greenBrowserSurfaces(),
        residualFollowUps: [],
      }),
    ).toThrow(PackagedFactoryCloseoutEvidenceError);

    const incomplete = buildPackagedFactoryCloseoutEvidencePack({
      tipCommitSha: TIP_SHA,
      recordedAtUtc: RECORDED_AT,
      gateOutcomes: gates,
      browserSurfaces: greenBrowserSurfaces(),
      residualFollowUps: ["make ci still failing on tip"],
    });
    expect(incomplete.closeoutStatus).toBe("incomplete");
    expect(incomplete.residualFollowUps).toEqual([
      "make ci still failing on tip",
    ]);
    expect(() =>
      assertPackagedFactoryCloseoutEvidencePackIsComplete(incomplete),
    ).toThrow(PackagedFactoryCloseoutEvidenceError);
  });

  test("rejects residual follow-ups when every gate already passes", () => {
    expect(() =>
      buildPackagedFactoryCloseoutEvidencePack({
        tipCommitSha: TIP_SHA,
        recordedAtUtc: RECORDED_AT,
        gateOutcomes:
          buildPackagedFactoryCloseoutPassingGateOutcomes(RECORDED_AT),
        browserSurfaces: greenBrowserSurfaces(),
        residualFollowUps: ["spurious leftover"],
      }),
    ).toThrow(PackagedFactoryCloseoutEvidenceError);
  });

  test("rejects ownership fence expansion beyond closeout evidence", () => {
    expect(() =>
      buildPackagedFactoryCloseoutEvidencePack({
        tipCommitSha: TIP_SHA,
        recordedAtUtc: RECORDED_AT,
        gateOutcomes:
          buildPackagedFactoryCloseoutPassingGateOutcomes(RECORDED_AT),
        browserSurfaces: greenBrowserSurfaces(),
        ownershipFence: "redesign-batch-4-landing",
      }),
    ).toThrow(PackagedFactoryCloseoutEvidenceError);
  });
});
