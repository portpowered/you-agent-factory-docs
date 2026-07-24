/**
 * Batch 5 packaged-factory reference family closeout — story 008 proofs.
 *
 * Tip-owned evidence pack for cross-surface in-app browser verification plus
 * reproducible gate/SHA notes a later closeout loopback can trust without
 * replaying the whole investigation. Ownership stays limited to cross-surface
 * evidence and minimal integration corrections — no B1–B4 redesign.
 */

import type { PackagedFactoryRecordingSlug } from "@/lib/packaged-factory-generated-source-corpus/recording-samples-model";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS,
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS,
} from "./packaged-factory-reference-family-closeout-deep-research";
import {
  PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES,
  PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_GATE_COMMANDS,
} from "./packaged-factory-reference-family-closeout-gates";

/** Ownership fence for Batch 5 closeout story 008. */
export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE =
  "cross-surface-evidence-and-minimal-integration-corrections-only" as const;

/**
 * Statement recorded when every acceptance surface and repository gate is
 * green — residual follow-ups must be empty in that case.
 */
export const PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT =
  "Packaged-factory reference family closeout is complete; no residual acceptance follow-ups remain." as const;

/** Parent index route under verification. */
export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_PARENT_INDEX_PATH =
  "/docs/references/packaged-factories-index" as const;

/** Deep-research child route under verification. */
export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_DEEP_RESEARCH_PATH =
  "/docs/references/packaged-factories-index/deep-research" as const;

/** Home / landing Youi route under verification. */
export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_HOME_PATH = "/" as const;

/**
 * At least two standard children must show full-mode Play/Pause during the
 * family browser evidence pass. Goal + subagent are the representative pair.
 */
export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY = [
  "goal",
  "subagent",
] as const satisfies readonly PackagedFactoryRecordingSlug[];

export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_USAGE_EXAMPLE =
  'you run --named @you/deep-research "Compare event sourcing and state machines for workflow orchestration"' as const;

export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_PURPOSE_SNIPPET =
  "@you/deep-research investigates a research topic with a lead research pass" as const;

export type PackagedFactoryCloseoutEvidenceSurfaceId =
  | "parent-index"
  | "standard-child-replay"
  | "deep-research-child"
  | "home-youi";

export const PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_BROWSER_SURFACES = [
  {
    id: "parent-index" as const,
    path: PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_PARENT_INDEX_PATH,
    label: "Ordered parent index with definition panels and child links",
  },
  {
    id: "standard-child-replay" as const,
    path: "/docs/references/packaged-factories-index/{slug}",
    label: "At least two standard children with full-mode Play/Pause",
  },
  {
    id: "deep-research-child" as const,
    path: PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_DEEP_RESEARCH_PATH,
    label: "Deep-research purpose + usage + two links",
  },
  {
    id: "home-youi" as const,
    path: PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_HOME_PATH,
    label: "Home Youi compact goal replay near viewport",
  },
] as const;

export type PackagedFactoryCloseoutGateOutcomeStatus = "pass" | "fail";

export type PackagedFactoryCloseoutGateOutcome = {
  readonly makeTarget: string;
  readonly command: string;
  readonly status: PackagedFactoryCloseoutGateOutcomeStatus;
  readonly recordedAtUtc: string;
};

export type PackagedFactoryCloseoutParentIndexObservation = {
  readonly surfaceId: "parent-index";
  readonly ok: true;
  readonly orderedChildSlugs: readonly string[];
  readonly definitionPanelCount: number;
  readonly childLinkCount: number;
};

export type PackagedFactoryCloseoutStandardChildReplayObservation = {
  readonly surfaceId: "standard-child-replay";
  readonly ok: true;
  readonly children: readonly {
    readonly slug: string;
    readonly path: string;
    readonly replayMode: "full";
    readonly playPause: true;
  }[];
};

export type PackagedFactoryCloseoutDeepResearchObservation = {
  readonly surfaceId: "deep-research-child";
  readonly ok: true;
  readonly purposeVisible: true;
  readonly usageExampleVisible: true;
  readonly javascriptRuntimeHref: string;
  readonly dynamicWorkflowsHref: string;
  readonly forbiddenSelectorHits: readonly string[];
};

export type PackagedFactoryCloseoutHomeYouiObservation = {
  readonly surfaceId: "home-youi";
  readonly ok: true;
  readonly compactReplayActivated: true;
  readonly playPause: true;
  readonly recordingId: string;
};

export type PackagedFactoryCloseoutBrowserSurfaceObservation =
  | PackagedFactoryCloseoutParentIndexObservation
  | PackagedFactoryCloseoutStandardChildReplayObservation
  | PackagedFactoryCloseoutDeepResearchObservation
  | PackagedFactoryCloseoutHomeYouiObservation;

export type PackagedFactoryCloseoutEvidencePack = {
  readonly ownershipFence: typeof PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE;
  readonly tipCommitSha: string;
  readonly recordedAtUtc: string;
  readonly gateOutcomes: readonly PackagedFactoryCloseoutGateOutcome[];
  readonly browserSurfaces: readonly PackagedFactoryCloseoutBrowserSurfaceObservation[];
  readonly narrowIntegrationFixes: readonly string[];
  readonly residualFollowUps: readonly string[];
  readonly closeoutStatus: "complete" | "incomplete";
  readonly closeoutStatement: string;
};

export class PackagedFactoryCloseoutEvidenceError extends Error {
  readonly code:
    | "missing-tip-sha"
    | "gate-inventory-mismatch"
    | "gate-failed"
    | "browser-surface-missing"
    | "browser-surface-failed"
    | "parent-index-order"
    | "standard-children-insufficient"
    | "residual-followups-inconsistent"
    | "ownership-fence";

  constructor(
    code: PackagedFactoryCloseoutEvidenceError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCloseoutEvidenceError";
    this.code = code;
  }
}

const SHA1_HEX_PATTERN = /^[a-f0-9]{40}$/;

export function packagedFactoryCloseoutEvidenceChildPath(
  slug: (typeof PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY)[number],
): `/docs/references/packaged-factories-index/${typeof slug}` {
  return `/docs/references/packaged-factories-index/${slug}`;
}

/**
 * Tip contract for story 008: browser surfaces, representative standard
 * children, repository gate inventory, and ownership fence.
 */
export function provePackagedFactoryReferenceFamilyCloseoutEvidenceContract(): {
  ownershipFence: typeof PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE;
  browserSurfaceIds: readonly PackagedFactoryCloseoutEvidenceSurfaceId[];
  allowlistOrder: readonly string[];
  standardChildrenForReplay: readonly string[];
  repositoryGateCommands: readonly string[];
  deepResearchRequiredHrefs: typeof PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS;
  deepResearchForbiddenSelectors: typeof PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS;
  completeStatement: typeof PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT;
} {
  return {
    ownershipFence: PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE,
    browserSurfaceIds: PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_BROWSER_SURFACES.map(
      (surface) => surface.id,
    ),
    allowlistOrder: [...PACKAGED_FACTORIES_ALLOWLIST_SLUGS],
    standardChildrenForReplay: [
      ...PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY,
    ],
    repositoryGateCommands: [
      ...PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_GATE_COMMANDS,
    ],
    deepResearchRequiredHrefs:
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS,
    deepResearchForbiddenSelectors:
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_FORBIDDEN_SELECTORS,
    completeStatement: PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT,
  };
}

/**
 * Build the PRD-ordered gate outcome skeleton. Callers fill `status` /
 * `recordedAtUtc` after live `make *` runs.
 */
export function listPackagedFactoryCloseoutEvidenceGateTargets(): readonly {
  makeTarget: string;
  command: string;
}[] {
  return PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES.map((gate) => ({
    makeTarget: gate.makeTarget,
    command: `make ${gate.makeTarget}`,
  }));
}

function assertTipCommitSha(tipCommitSha: string): string {
  const sha = tipCommitSha.trim().toLowerCase();
  if (!SHA1_HEX_PATTERN.test(sha)) {
    throw new PackagedFactoryCloseoutEvidenceError(
      "missing-tip-sha",
      `Evidence pack requires a 40-char lowercase tip commit SHA, got ${JSON.stringify(tipCommitSha)}.`,
    );
  }
  return sha;
}

function assertGateOutcomes(
  gateOutcomes: readonly PackagedFactoryCloseoutGateOutcome[],
): void {
  const expected = listPackagedFactoryCloseoutEvidenceGateTargets();
  if (gateOutcomes.length !== expected.length) {
    throw new PackagedFactoryCloseoutEvidenceError(
      "gate-inventory-mismatch",
      `Expected ${expected.length} gate outcomes (${expected.map((g) => g.makeTarget).join(", ")}), got ${gateOutcomes.length}.`,
    );
  }

  for (let index = 0; index < expected.length; index += 1) {
    const want = expected[index];
    const got = gateOutcomes[index];
    if (
      want === undefined ||
      got === undefined ||
      got.makeTarget !== want.makeTarget ||
      got.command !== want.command
    ) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "gate-inventory-mismatch",
        `Gate outcome #${index} must be ${want?.command}, got ${got?.command ?? "missing"}.`,
      );
    }
    if (got.status !== "pass" && got.status !== "fail") {
      throw new PackagedFactoryCloseoutEvidenceError(
        "gate-inventory-mismatch",
        `Gate ${got.makeTarget} status must be pass|fail.`,
      );
    }
    if (got.recordedAtUtc.trim().length === 0) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "gate-inventory-mismatch",
        `Gate ${got.makeTarget} is missing recordedAtUtc.`,
      );
    }
  }
}

function assertBrowserSurfaces(
  browserSurfaces: readonly PackagedFactoryCloseoutBrowserSurfaceObservation[],
): void {
  const byId = new Map(
    browserSurfaces.map((surface) => [surface.surfaceId, surface]),
  );
  for (const required of PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_BROWSER_SURFACES) {
    const observation = byId.get(required.id);
    if (observation === undefined) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "browser-surface-missing",
        `Evidence pack missing browser surface "${required.id}".`,
      );
    }
    if (!observation.ok) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "browser-surface-failed",
        `Browser surface "${required.id}" is not ok.`,
      );
    }
  }

  const parent = byId.get("parent-index");
  if (parent?.surfaceId === "parent-index") {
    const expectedOrder = [...PACKAGED_FACTORIES_ALLOWLIST_SLUGS];
    if (parent.orderedChildSlugs.join("\0") !== expectedOrder.join("\0")) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "parent-index-order",
        `Parent index order ${JSON.stringify(parent.orderedChildSlugs)} !== allowlist ${JSON.stringify(expectedOrder)}.`,
      );
    }
    if (
      parent.definitionPanelCount < expectedOrder.length ||
      parent.childLinkCount < expectedOrder.length
    ) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "parent-index-order",
        `Parent index must expose definition panels and child links for every allowlisted entry (panels=${parent.definitionPanelCount}, links=${parent.childLinkCount}).`,
      );
    }
  }

  const children = byId.get("standard-child-replay");
  if (children?.surfaceId === "standard-child-replay") {
    if (
      children.children.length <
      PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY.length
    ) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "standard-children-insufficient",
        `Need at least ${PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY.length} standard children with full-mode Play/Pause.`,
      );
    }
    for (const requiredSlug of PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_STANDARD_CHILDREN_FOR_REPLAY) {
      const hit = children.children.find(
        (child) => child.slug === requiredSlug,
      );
      if (
        hit === undefined ||
        hit.replayMode !== "full" ||
        hit.playPause !== true
      ) {
        throw new PackagedFactoryCloseoutEvidenceError(
          "standard-children-insufficient",
          `Standard child "${requiredSlug}" must report full-mode Play/Pause.`,
        );
      }
    }
  }

  const deepResearch = byId.get("deep-research-child");
  if (deepResearch?.surfaceId === "deep-research-child") {
    if (deepResearch.forbiddenSelectorHits.length > 0) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "browser-surface-failed",
        `Deep-research child mounted forbidden surfaces: ${deepResearch.forbiddenSelectorHits.join(", ")}.`,
      );
    }
    if (
      deepResearch.javascriptRuntimeHref !==
        PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.javascriptRuntime ||
      deepResearch.dynamicWorkflowsHref !==
        PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.dynamicWorkflows
    ) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "browser-surface-failed",
        "Deep-research child required link hrefs drifted.",
      );
    }
  }
}

function deriveCloseoutStatus(input: {
  gateOutcomes: readonly PackagedFactoryCloseoutGateOutcome[];
  residualFollowUps: readonly string[];
}): {
  closeoutStatus: "complete" | "incomplete";
  closeoutStatement: string;
} {
  const anyGateFailed = input.gateOutcomes.some(
    (outcome) => outcome.status === "fail",
  );
  if (anyGateFailed) {
    if (input.residualFollowUps.length === 0) {
      throw new PackagedFactoryCloseoutEvidenceError(
        "residual-followups-inconsistent",
        "A failed repository gate requires residualFollowUps explaining the unmet criterion.",
      );
    }
    return {
      closeoutStatus: "incomplete",
      closeoutStatement: input.residualFollowUps.join(" "),
    };
  }

  if (input.residualFollowUps.length > 0) {
    throw new PackagedFactoryCloseoutEvidenceError(
      "residual-followups-inconsistent",
      "residualFollowUps must be empty when every repository gate passes and browser surfaces are green; otherwise the family closeout is not complete.",
    );
  }

  return {
    closeoutStatus: "complete",
    closeoutStatement: PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT,
  };
}

/**
 * Assemble and fail-closed-validate the reproducible closeout evidence pack.
 */
export function buildPackagedFactoryCloseoutEvidencePack(input: {
  tipCommitSha: string;
  recordedAtUtc: string;
  gateOutcomes: readonly PackagedFactoryCloseoutGateOutcome[];
  browserSurfaces: readonly PackagedFactoryCloseoutBrowserSurfaceObservation[];
  narrowIntegrationFixes?: readonly string[];
  residualFollowUps?: readonly string[];
  ownershipFence?: string;
}): PackagedFactoryCloseoutEvidencePack {
  const ownershipFence =
    input.ownershipFence ?? PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE;
  if (ownershipFence !== PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE) {
    throw new PackagedFactoryCloseoutEvidenceError(
      "ownership-fence",
      `Evidence ownership fence must remain ${PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE}.`,
    );
  }

  const tipCommitSha = assertTipCommitSha(input.tipCommitSha);
  if (input.recordedAtUtc.trim().length === 0) {
    throw new PackagedFactoryCloseoutEvidenceError(
      "missing-tip-sha",
      "Evidence pack requires recordedAtUtc (UTC).",
    );
  }

  assertGateOutcomes(input.gateOutcomes);
  assertBrowserSurfaces(input.browserSurfaces);

  const residualFollowUps = [...(input.residualFollowUps ?? [])];
  const { closeoutStatus, closeoutStatement } = deriveCloseoutStatus({
    gateOutcomes: input.gateOutcomes,
    residualFollowUps,
  });

  return {
    ownershipFence: PACKAGED_FACTORY_CLOSEOUT_EVIDENCE_OWNERSHIP_FENCE,
    tipCommitSha,
    recordedAtUtc: input.recordedAtUtc,
    gateOutcomes: input.gateOutcomes,
    browserSurfaces: input.browserSurfaces,
    narrowIntegrationFixes: [...(input.narrowIntegrationFixes ?? [])],
    residualFollowUps,
    closeoutStatus,
    closeoutStatement,
  };
}

/**
 * Fail closed unless the pack is the green family-closeout-complete record.
 * Browser probes and story tests use this after assembling observations.
 */
export function assertPackagedFactoryCloseoutEvidencePackIsComplete(
  pack: PackagedFactoryCloseoutEvidencePack,
): asserts pack is PackagedFactoryCloseoutEvidencePack & {
  closeoutStatus: "complete";
  residualFollowUps: readonly [];
} {
  if (pack.closeoutStatus !== "complete") {
    throw new PackagedFactoryCloseoutEvidenceError(
      "gate-failed",
      [
        "Closeout evidence pack is incomplete.",
        pack.closeoutStatement,
        `Residual: ${pack.residualFollowUps.join(" ") || "(none)"}`,
      ].join(" "),
    );
  }
  if (pack.residualFollowUps.length > 0) {
    throw new PackagedFactoryCloseoutEvidenceError(
      "residual-followups-inconsistent",
      "Complete evidence packs must not list residual follow-ups.",
    );
  }
  if (
    pack.closeoutStatement !==
    PACKAGED_FACTORY_CLOSEOUT_FAMILY_COMPLETE_STATEMENT
  ) {
    throw new PackagedFactoryCloseoutEvidenceError(
      "residual-followups-inconsistent",
      "Complete evidence packs must use the family closeout complete statement.",
    );
  }
}

/**
 * Convenience: all PRD repository gates marked pass at one UTC timestamp.
 */
export function buildPackagedFactoryCloseoutPassingGateOutcomes(
  recordedAtUtc: string,
): PackagedFactoryCloseoutGateOutcome[] {
  return listPackagedFactoryCloseoutEvidenceGateTargets().map((gate) => ({
    makeTarget: gate.makeTarget,
    command: gate.command,
    status: "pass" as const,
    recordedAtUtc,
  }));
}
