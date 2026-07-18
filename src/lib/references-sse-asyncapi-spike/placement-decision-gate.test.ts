/**
 * Story 009 — placement decision gate + API-page HTTP ownership.
 */

import { describe, expect, test } from "bun:test";
import {
  decisionKeepsSpikeNonProduction,
  decisionPreservesApiPageHttpSemantics,
  evaluatePlacementDecisionGate,
  PLACEMENT_DECISION_GATE_ORDER,
  type PlacementDecisionGateEvidence,
  recordedW02PlacementDecisionGateEvidence,
} from "./placement-decision-gate";

describe("W02 SSE spike — placement decision gate (009)", () => {
  test("recorded W02 evidence selects hybrid as the first accepted outcome", () => {
    const evidence = recordedW02PlacementDecisionGateEvidence();
    const result = evaluatePlacementDecisionGate(evidence);

    expect(PLACEMENT_DECISION_GATE_ORDER).toEqual([
      "integrated-only",
      "separate-catalog",
      "hybrid",
    ]);
    expect(result.selected).toBe("hybrid");
    expect(result.selectedIndex).toBe(2);
    expect(result.checks[0]?.accepted).toBe(false);
    expect(result.checks[1]?.accepted).toBe(false);
    expect(result.checks[2]?.accepted).toBe(true);
    expect(result.justification).toContain("hybrid");
    expect(result.justification).toContain("integrated-only");
    expect(result.justification).toContain("separate-catalog");
  });

  test("states OpenAPI event-truth boundary and temporary dependency surface", () => {
    const result = evaluatePlacementDecisionGate();

    expect(result.canonicalDataBoundary.eventTruthOwner).toBe("openapi");
    expect(result.canonicalDataBoundary.asyncApiRole).toBe(
      "generated-projection-only",
    );
    expect(result.canonicalDataBoundary.statement).toContain("OpenAPI");
    expect(result.canonicalDataBoundary.statement).toContain(
      "generated projection",
    );

    expect(result.upgradeDependencySurface.temporaryOpenApiRenderer).toBe(
      "fumadocs-openapi@10.10.3",
    );
    expect(result.upgradeDependencySurface.temporaryAsyncApiRenderer).toBe(
      "@fumadocs/asyncapi@0.2.1",
    );
    expect(result.upgradeDependencySurface.productionPinOwner).toBe("W08");
    expect(result.upgradeDependencySurface.statement).toContain(
      "does not permanently pin",
    );
  });

  test("preserves HTTP reconnect semantics on the API operation page", () => {
    const result = evaluatePlacementDecisionGate();

    expect(result.apiOperationPageOwnsHttpSemantics).toEqual([
      "reconnect",
      "cursor-precedence",
      "handshake-response-headers",
      "dual-accept",
      "replay-retained-history",
      "compatibility-only-status",
    ]);
    expect(decisionPreservesApiPageHttpSemantics(result)).toBe(true);
  });

  test("keeps spike non-production fences", () => {
    const result = evaluatePlacementDecisionGate();

    expect(result.spikeNonProductionFences.mergesProductionEventUi).toBe(false);
    expect(
      result.spikeNonProductionFences.permanentlyPinsFumadocsOrAsyncApiDeps,
    ).toBe(false);
    expect(
      result.spikeNonProductionFences.handEditsGeneratedAsyncApiAsSecondCorpus,
    ).toBe(false);
    expect(
      result.spikeNonProductionFences.ownsOrRewritesW01OpenApiSpikeFiles,
    ).toBe(false);
    expect(decisionKeepsSpikeNonProduction(result)).toBe(true);
  });

  test("selects integrated-only when native rendering is complete and not unwieldy", () => {
    const evidence: PlacementDecisionGateEvidence = {
      ...recordedW02PlacementDecisionGateEvidence(),
      nativeRendersEnvelopesAndAllPayloadVariants: true,
      fullCorpusOnApiPageIsUnwieldy: false,
    };
    const result = evaluatePlacementDecisionGate(evidence);
    expect(result.selected).toBe("integrated-only");
    expect(result.selectedIndex).toBe(0);
  });

  test("selects separate-catalog when summarize-and-link is sufficient", () => {
    const evidence: PlacementDecisionGateEvidence = {
      ...recordedW02PlacementDecisionGateEvidence(),
      summarizeAndLinkIsSufficientApiPageEventExperience: true,
      // Keep hybrid use-when true so we prove Separate wins first when accepted.
      httpTransportSemanticsRequireApiOperationPage: true,
      payloadCorpusNeedsOwnNavigationAndSearch: true,
    };
    const result = evaluatePlacementDecisionGate(evidence);
    expect(result.selected).toBe("separate-catalog");
    expect(result.selectedIndex).toBe(1);
    expect(result.checks[0]?.accepted).toBe(false);
    expect(result.checks[1]?.accepted).toBe(true);
  });
});
