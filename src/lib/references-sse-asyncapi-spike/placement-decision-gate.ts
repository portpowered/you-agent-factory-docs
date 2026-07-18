/**
 * Story 009 — SSE placement decision gate from plan.md.
 *
 * Choose the first outcome whose acceptance conditions are satisfied:
 * integrated-only → separate-catalog → hybrid.
 *
 * Pure helpers — callers supply recorded investigation evidence facts.
 */

import type { PlacementOption } from "./placement-comparison-evidence";

export const PLACEMENT_DECISION_GATE_ORDER = [
  "integrated-only",
  "separate-catalog",
  "hybrid",
] as const satisfies readonly PlacementOption[];

export type PlacementDecisionGateEvidence = {
  /**
   * Native OpenAPI renderer (or equivalent) already shows event envelopes and
   * all payload variants on the operation page without a custom catalog.
   */
  nativeRendersEnvelopesAndAllPayloadVariants: boolean;
  /**
   * Documented hook can inject a schema-backed catalog beside an operation
   * (for example content.renderOperationLayout).
   */
  documentedHookCanInjectCatalogBesideOperation: boolean;
  /**
   * Putting the full payload corpus on the API page makes it unwieldy
   * (payload / navigation / phone scroll evidence).
   */
  fullCorpusOnApiPageIsUnwieldy: boolean;
  /**
   * HTTP reconnect, cursor precedence, handshake headers, dual-Accept,
   * retained-history / replay, and compatibility semantics must stay on the
   * API operation page (projection information-loss ownership).
   */
  httpTransportSemanticsRequireApiOperationPage: boolean;
  /**
   * The event envelope + payload-variant corpus needs its own navigation and
   * search surface (variant count / catalog measurements).
   */
  payloadCorpusNeedsOwnNavigationAndSearch: boolean;
  /**
   * "Summarize the stream and link to /docs/references/events" is sufficient
   * for the API operation page's event-corpus role (Separate required
   * experience). False when the product requires richer transport ownership
   * on the API page plus a first-class events catalog (Hybrid).
   */
  summarizeAndLinkIsSufficientApiPageEventExperience: boolean;
};

export type PlacementDecisionGateOutcomeCheck = {
  option: PlacementOption;
  useWhenSatisfied: boolean;
  requiredReaderExperienceSatisfied: boolean;
  accepted: boolean;
  justification: string;
};

export type PlacementDecisionGateResult = {
  selected: PlacementOption;
  selectedIndex: number;
  checks: PlacementDecisionGateOutcomeCheck[];
  /**
   * Canonical data boundary for later lanes.
   */
  canonicalDataBoundary: {
    eventTruthOwner: "openapi";
    asyncApiRole: "generated-projection-only";
    statement: string;
  };
  /**
   * Temporary spike dependency surface — not a permanent production pin.
   */
  upgradeDependencySurface: {
    temporaryOpenApiRenderer: "fumadocs-openapi@10.10.3";
    temporaryAsyncApiRenderer: "@fumadocs/asyncapi@0.2.1";
    productionPinOwner: "W08";
    statement: string;
  };
  apiOperationPageOwnsHttpSemantics: readonly string[];
  spikeNonProductionFences: {
    mergesProductionEventUi: false;
    permanentlyPinsFumadocsOrAsyncApiDeps: false;
    handEditsGeneratedAsyncApiAsSecondCorpus: false;
    ownsOrRewritesW01OpenApiSpikeFiles: false;
    statement: string;
  };
  justification: string;
};

const API_OPERATION_PAGE_HTTP_SEMANTICS = [
  "reconnect",
  "cursor-precedence",
  "handshake-response-headers",
  "dual-accept",
  "replay-retained-history",
  "compatibility-only-status",
] as const;

/**
 * Default evidence facts recorded by W02 stories 001–008.
 */
export function recordedW02PlacementDecisionGateEvidence(): PlacementDecisionGateEvidence {
  return {
    nativeRendersEnvelopesAndAllPayloadVariants: false,
    documentedHookCanInjectCatalogBesideOperation: true,
    fullCorpusOnApiPageIsUnwieldy: true,
    httpTransportSemanticsRequireApiOperationPage: true,
    payloadCorpusNeedsOwnNavigationAndSearch: true,
    // Separate's required experience underspecifies transport ownership once
    // projection loss assigns reconnect/cursor/headers/dual-Accept/replay to
    // the API operation page and the corpus needs its own nav/search surface.
    summarizeAndLinkIsSufficientApiPageEventExperience: false,
  };
}

function checkIntegrated(
  evidence: PlacementDecisionGateEvidence,
): PlacementDecisionGateOutcomeCheck {
  const canRenderEnvelopesAndVariants =
    evidence.nativeRendersEnvelopesAndAllPayloadVariants ||
    evidence.documentedHookCanInjectCatalogBesideOperation;

  const useWhenSatisfied =
    canRenderEnvelopesAndVariants && !evidence.fullCorpusOnApiPageIsUnwieldy;

  // Required experience: operation sections contain lifecycle prose,
  // headers/cursors, envelope, variants, and examples on the API page.
  const requiredReaderExperienceSatisfied = useWhenSatisfied;

  return {
    option: "integrated-only",
    useWhenSatisfied,
    requiredReaderExperienceSatisfied,
    accepted: useWhenSatisfied && requiredReaderExperienceSatisfied,
    justification: useWhenSatisfied
      ? "Fumadocs or a documented hook can render envelopes and all payload variants without making the API page unwieldy."
      : "Rejected: even though a documented hook can inject a catalog, native fumadocs-openapi ignores x-event-schema and placing the full corpus on the API page is unwieldy (hybrid HTML ~426k bytes; longest phone scroll among the three placements).",
  };
}

function checkSeparate(
  evidence: PlacementDecisionGateEvidence,
): PlacementDecisionGateOutcomeCheck {
  const useWhenSatisfied =
    evidence.fullCorpusOnApiPageIsUnwieldy ||
    !evidence.nativeRendersEnvelopesAndAllPayloadVariants;

  const requiredReaderExperienceSatisfied =
    evidence.summarizeAndLinkIsSufficientApiPageEventExperience;

  return {
    option: "separate-catalog",
    useWhenSatisfied,
    requiredReaderExperienceSatisfied,
    accepted: useWhenSatisfied && requiredReaderExperienceSatisfied,
    justification: requiredReaderExperienceSatisfied
      ? "API page can summarize the stream and link to /docs/references/events while the catalog owns variants."
      : "Use-when triggers (cannot traverse x-event-schema; full corpus unwieldy on API page), but Separate's required experience (summarize + link only) is insufficient: HTTP reconnect/cursor/headers/dual-Accept/replay must stay fully documented on the API operation page, and the payload corpus needs its own navigation/search surface (Hybrid).",
  };
}

function checkHybrid(
  evidence: PlacementDecisionGateEvidence,
): PlacementDecisionGateOutcomeCheck {
  const useWhenSatisfied =
    evidence.httpTransportSemanticsRequireApiOperationPage &&
    evidence.payloadCorpusNeedsOwnNavigationAndSearch;

  // Required experience: API page documents transport/reconnect; events page
  // owns the full canonical + ephemeral catalogs. Documented hooks may preview
  // catalog beside operations but are not required for Hybrid acceptance.
  const requiredReaderExperienceSatisfied = useWhenSatisfied;

  return {
    option: "hybrid",
    useWhenSatisfied,
    requiredReaderExperienceSatisfied,
    accepted: useWhenSatisfied && requiredReaderExperienceSatisfied,
    justification: useWhenSatisfied
      ? `Endpoint HTTP mechanics belong on the API operation page; the FactoryEvent / FactoryResponseEvent corpus needs its own /docs/references/events navigation and search.${
          evidence.documentedHookCanInjectCatalogBesideOperation
            ? " Documented content.renderOperationLayout can optionally preview catalog beside operations without undocumented internals."
            : ""
        }`
      : "Rejected: evidence does not require splitting transport ownership from a dedicated event catalog.",
  };
}

/**
 * Evaluate the plan decision gate against recorded evidence and select the
 * first accepted outcome.
 */
export function evaluatePlacementDecisionGate(
  evidence: PlacementDecisionGateEvidence = recordedW02PlacementDecisionGateEvidence(),
): PlacementDecisionGateResult {
  const checks: PlacementDecisionGateOutcomeCheck[] = [
    checkIntegrated(evidence),
    checkSeparate(evidence),
    checkHybrid(evidence),
  ];

  const selectedIndex = checks.findIndex((check) => check.accepted);
  if (selectedIndex === -1) {
    throw new Error(
      "SSE placement decision gate: no outcome accepted; evidence is incomplete or contradictory.",
    );
  }

  const selected = checks[selectedIndex]?.option;
  if (!selected) {
    throw new Error(
      "SSE placement decision gate: selected check missing option.",
    );
  }

  const selectedCheck = checks[selectedIndex];
  if (!selectedCheck) {
    throw new Error("SSE placement decision gate: selected check missing.");
  }

  return {
    selected,
    selectedIndex,
    checks,
    canonicalDataBoundary: {
      eventTruthOwner: "openapi",
      asyncApiRole: "generated-projection-only",
      statement:
        "OpenAPI from @you-agent-factory/api owns event truth (including x-event-schema roots). AsyncAPI is a regenerated projection only — never a second authored corpus and never hand-edited to restore HTTP semantics.",
    },
    upgradeDependencySurface: {
      temporaryOpenApiRenderer: "fumadocs-openapi@10.10.3",
      temporaryAsyncApiRenderer: "@fumadocs/asyncapi@0.2.1",
      productionPinOwner: "W08",
      statement:
        "This spike temporarily installed fumadocs-openapi@10.10.3 and @fumadocs/asyncapi@0.2.1 for evidence only. Production dependency pins and peer-compatibility policy belong to W08 after W01/W02; this lane does not permanently pin those versions.",
    },
    apiOperationPageOwnsHttpSemantics: API_OPERATION_PAGE_HTTP_SEMANTICS,
    spikeNonProductionFences: {
      mergesProductionEventUi: false,
      permanentlyPinsFumadocsOrAsyncApiDeps: false,
      handEditsGeneratedAsyncApiAsSecondCorpus: false,
      ownsOrRewritesW01OpenApiSpikeFiles: false,
      statement:
        "Spike stays non-production: no production event UI merge, no permanent Fumadocs/AsyncAPI pins, no hand-edited AsyncAPI second corpus, and no ownership/rewrite of W01 OpenAPI spike files under src/lib/references-openapi-spike/.",
    },
    justification: [
      `Selected ${selected} as the first decision-gate outcome whose acceptance conditions are satisfied (index ${selectedIndex} in integrated → separate → hybrid).`,
      selectedCheck.justification,
      "Earlier outcomes were not accepted:",
      ...checks
        .slice(0, selectedIndex)
        .map((check) => `- ${check.option}: ${check.justification}`),
    ].join("\n"),
  };
}

/**
 * True when the selected placement is hybrid and every required HTTP semantic
 * remains assigned to the API operation page.
 */
export function decisionPreservesApiPageHttpSemantics(
  result: PlacementDecisionGateResult = evaluatePlacementDecisionGate(),
): boolean {
  return (
    result.apiOperationPageOwnsHttpSemantics.length ===
      API_OPERATION_PAGE_HTTP_SEMANTICS.length &&
    API_OPERATION_PAGE_HTTP_SEMANTICS.every((concern) =>
      result.apiOperationPageOwnsHttpSemantics.includes(concern),
    )
  );
}

/**
 * True when spike fences remain non-production / non-owning.
 */
export function decisionKeepsSpikeNonProduction(
  result: PlacementDecisionGateResult = evaluatePlacementDecisionGate(),
): boolean {
  const fences = result.spikeNonProductionFences;
  return (
    fences.mergesProductionEventUi === false &&
    fences.permanentlyPinsFumadocsOrAsyncApiDeps === false &&
    fences.handEditsGeneratedAsyncApiAsSecondCorpus === false &&
    fences.ownsOrRewritesW01OpenApiSpikeFiles === false
  );
}
