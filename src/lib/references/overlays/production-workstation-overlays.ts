/**
 * Production Factory Workstation variant overlays (W14).
 *
 * Authored editorial overlays for every installed Factory `WorkstationType`
 * and `WorkstationKind` (behavior). Field slots list applicability identities
 * only — never copied canonical prose. Companion Worker / cross-axis refs come
 * from the W06 compatibility matrix. Example refs are catalog identities for
 * later page embeds.
 *
 * Pure data builders — no filesystem IO. Call sites validate through the
 * existing W06 validator against installed Factory schema projections.
 */

import {
  applyFactoryVariantCompatibilityFactToOverlay,
  createMinimalFactoryVariantCompatibilityMatrix,
} from "./factory-variant-compatibility-matrix";
import {
  createCanonicalFactoryVariantOverlay,
  type FactoryVariantOverlayAxis,
} from "./factory-variant-overlay-registry";
import {
  createFactoryVariantOverlay,
  type FactoryVariantFieldApplicability,
  type FactoryVariantOverlayId,
  type FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

/** Installed Factory WorkstationType discriminator values (overlay axis order). */
export const PRODUCTION_WORKSTATION_TYPE_VALUES = [
  "INFERENCE_RUN",
  "AGENT_RUN",
  "SCRIPT_RUN",
  "POLLER_RUN",
  "MODEL_WORKSTATION",
  "MODEL_INVOKE",
  "LOGICAL_MOVE",
  "CLASSIFIER_WORKSTATION",
] as const;

export type ProductionWorkstationTypeValue =
  (typeof PRODUCTION_WORKSTATION_TYPE_VALUES)[number];

/** Installed Factory WorkstationKind (behavior) discriminator values. */
export const PRODUCTION_WORKSTATION_BEHAVIOR_VALUES = [
  "STANDARD",
  "REPEATER",
  "CRON",
  "POLLER",
] as const;

export type ProductionWorkstationBehaviorValue =
  (typeof PRODUCTION_WORKSTATION_BEHAVIOR_VALUES)[number];

/** Stable overlay IDs for every production Workstation type overlay. */
export const PRODUCTION_WORKSTATION_TYPE_OVERLAY_IDS = [
  "workstation:INFERENCE_RUN",
  "workstation:AGENT_RUN",
  "workstation:SCRIPT_RUN",
  "workstation:POLLER_RUN",
  "workstation:MODEL_WORKSTATION",
  "workstation:MODEL_INVOKE",
  "workstation:LOGICAL_MOVE",
  "workstation:CLASSIFIER_WORKSTATION",
] as const satisfies readonly FactoryVariantOverlayId[];

/** Stable overlay IDs for every production Workstation behavior overlay. */
export const PRODUCTION_WORKSTATION_BEHAVIOR_OVERLAY_IDS = [
  "behavior:STANDARD",
  "behavior:REPEATER",
  "behavior:CRON",
  "behavior:POLLER",
] as const satisfies readonly FactoryVariantOverlayId[];

/** All production Workstation overlay IDs (types then behaviors). */
export const PRODUCTION_WORKSTATION_OVERLAY_IDS = [
  ...PRODUCTION_WORKSTATION_TYPE_OVERLAY_IDS,
  ...PRODUCTION_WORKSTATION_BEHAVIOR_OVERLAY_IDS,
] as const satisfies readonly FactoryVariantOverlayId[];

/**
 * Authored example identities referenced by production Workstation overlays.
 * Page content for these IDs lands in later W14 stories; existence is proven
 * here against an explicit catalog at validation time.
 */
export const PRODUCTION_WORKSTATION_EXAMPLE_IDS = [
  "workstation.inference-run.minimal",
  "workstation.inference-run.misuse-classification-routes",
  "workstation.agent-run.minimal",
  "workstation.agent-run.misuse-operation",
  "workstation.script-run.minimal",
  "workstation.script-run.misuse-prompt-file",
  "workstation.poller-run.minimal",
  "workstation.poller-run.misuse-poller-behavior-collapse",
  "workstation.model-workstation.minimal",
  "workstation.model-workstation.misuse-operation",
  "workstation.model-invoke.minimal",
  "workstation.model-invoke.misuse-outcome-format",
  "workstation.logical-move.minimal",
  "workstation.logical-move.misuse-classification-routes",
  "workstation.classifier.minimal",
  "workstation.classifier.misuse-outputs",
  "behavior.standard.minimal",
  "behavior.standard.misuse-cron",
  "behavior.repeater.minimal",
  "behavior.repeater.misuse-cron",
  "behavior.cron.minimal",
  "behavior.cron.misuse-missing-cron",
  "behavior.poller.minimal",
  "behavior.poller.misuse-poller-run-collapse",
] as const;

/** Identity fields always applicable across Workstation variants. */
const WORKSTATION_IDENTITY_SHARED = [
  "name",
  "worker",
  "inputs",
  "type",
  "behavior",
  "id",
] as const;

/**
 * Dispatch / routing fields shared by non-classifier Workstation types.
 * CLASSIFIER_WORKSTATION excludes success/continue/rejection outputs in favor
 * of `classificationRoutes`.
 */
const WORKSTATION_DISPATCH_SHARED = [
  "outputs",
  "onContinue",
  "onFailure",
  "onRejection",
  "limits",
  "resources",
  "env",
  "runner",
  "workingDirectory",
  "worktree",
  "workPropagation",
  "body",
  "copyReferencedScripts",
] as const;

/** Classifier still shares failure routing and capacity fields. */
const CLASSIFIER_DISPATCH_SHARED = [
  "onFailure",
  "limits",
  "resources",
  "env",
  "runner",
  "workingDirectory",
  "worktree",
  "workPropagation",
  "body",
  "copyReferencedScripts",
] as const;

/** Fields exclusive to AGENT_RUN OpenCode overrides. */
const AGENT_RUN_EXCLUSIVE = ["openCodeAgent"] as const;

/** Fields exclusive to CLASSIFIER_WORKSTATION label routing. */
const CLASSIFIER_EXCLUSIVE = ["classificationRoutes"] as const;

/** Fields exclusive to LOGICAL_MOVE guarded loop breakers. */
const LOGICAL_MOVE_EXCLUSIVE = ["guards"] as const;

/**
 * Fields exclusive to MODEL_WORKSTATION prompt / parse surfaces.
 * MODEL_INVOKE must not put these in `selected` (types are not companions).
 */
const MODEL_WORKSTATION_EXCLUSIVE = [
  "promptFile",
  "outcomeFormat",
  "outputSchema",
  "stopWords",
] as const;

/** Fields exclusive to MODEL_INVOKE operation bindings. */
const MODEL_INVOKE_EXCLUSIVE = ["operation", "operationBindings"] as const;

/** Field exclusive to CRON scheduling behavior. */
const CRON_EXCLUSIVE = ["cron"] as const;

/** Classifier must not declare normal success / continue / rejection outputs. */
const CLASSIFIER_EXCLUDED_DISPATCH = [
  "outputs",
  "onContinue",
  "onRejection",
] as const;

const ALL_TYPE_EXCLUSIVES = [
  ...AGENT_RUN_EXCLUSIVE,
  ...CLASSIFIER_EXCLUSIVE,
  ...LOGICAL_MOVE_EXCLUSIVE,
  ...MODEL_WORKSTATION_EXCLUSIVE,
  ...MODEL_INVOKE_EXCLUSIVE,
] as const;

function applyCompanions(
  overlay: FactoryVariantOverlaySchema,
): FactoryVariantOverlaySchema {
  const matrix = createMinimalFactoryVariantCompatibilityMatrix();
  return applyFactoryVariantCompatibilityFactToOverlay(overlay, matrix);
}

function createWorkstationAxisOverlay(
  axis: Extract<FactoryVariantOverlayAxis, "workstation" | "behavior">,
  discriminatorValue: string,
  fields: FactoryVariantFieldApplicability,
  examples: FactoryVariantOverlaySchema["examples"],
): FactoryVariantOverlaySchema {
  const canonical = createCanonicalFactoryVariantOverlay(
    axis,
    discriminatorValue,
  );
  return applyCompanions(
    createFactoryVariantOverlay({
      ...canonical,
      fields,
      examples,
    }),
  );
}

function createTypeOverlay(
  workstationType: ProductionWorkstationTypeValue,
  fields: FactoryVariantFieldApplicability,
  examples: FactoryVariantOverlaySchema["examples"],
): FactoryVariantOverlaySchema {
  return createWorkstationAxisOverlay(
    "workstation",
    workstationType,
    fields,
    examples,
  );
}

function createBehaviorOverlay(
  behavior: ProductionWorkstationBehaviorValue,
  fields: FactoryVariantFieldApplicability,
  examples: FactoryVariantOverlaySchema["examples"],
): FactoryVariantOverlaySchema {
  return createWorkstationAxisOverlay("behavior", behavior, fields, examples);
}

/** Non-specialized run types share identity + dispatch and exclude exclusives. */
function createGenericRunTypeOverlay(
  workstationType: "INFERENCE_RUN" | "SCRIPT_RUN" | "POLLER_RUN",
  examples: FactoryVariantOverlaySchema["examples"],
): FactoryVariantOverlaySchema {
  return createTypeOverlay(
    workstationType,
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...WORKSTATION_DISPATCH_SHARED],
      selected: [],
      excluded: [...ALL_TYPE_EXCLUSIVES, ...CRON_EXCLUSIVE],
      conditional: [],
    },
    examples,
  );
}

/** Production overlay for `INFERENCE_RUN`. */
export function createInferenceRunOverlay(): FactoryVariantOverlaySchema {
  return createGenericRunTypeOverlay("INFERENCE_RUN", [
    { exampleId: "workstation.inference-run.minimal" },
    { exampleId: "workstation.inference-run.misuse-classification-routes" },
  ]);
}

/** Production overlay for `AGENT_RUN`. */
export function createAgentRunOverlay(): FactoryVariantOverlaySchema {
  return createTypeOverlay(
    "AGENT_RUN",
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...WORKSTATION_DISPATCH_SHARED],
      selected: [...AGENT_RUN_EXCLUSIVE],
      excluded: [
        ...CLASSIFIER_EXCLUSIVE,
        ...LOGICAL_MOVE_EXCLUSIVE,
        ...MODEL_WORKSTATION_EXCLUSIVE,
        ...MODEL_INVOKE_EXCLUSIVE,
        ...CRON_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "workstation.agent-run.minimal" },
      { exampleId: "workstation.agent-run.misuse-operation" },
    ],
  );
}

/** Production overlay for `SCRIPT_RUN`. */
export function createScriptRunOverlay(): FactoryVariantOverlaySchema {
  return createGenericRunTypeOverlay("SCRIPT_RUN", [
    { exampleId: "workstation.script-run.minimal" },
    { exampleId: "workstation.script-run.misuse-prompt-file" },
  ]);
}

/**
 * Production overlay for `POLLER_RUN` (runtime type).
 * Keep distinct from scheduling behavior `POLLER` — different overlay axis.
 */
export function createPollerRunOverlay(): FactoryVariantOverlaySchema {
  return createGenericRunTypeOverlay("POLLER_RUN", [
    { exampleId: "workstation.poller-run.minimal" },
    { exampleId: "workstation.poller-run.misuse-poller-behavior-collapse" },
  ]);
}

/** Production overlay for `MODEL_WORKSTATION`. */
export function createModelWorkstationOverlay(): FactoryVariantOverlaySchema {
  return createTypeOverlay(
    "MODEL_WORKSTATION",
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...WORKSTATION_DISPATCH_SHARED],
      selected: [...MODEL_WORKSTATION_EXCLUSIVE],
      excluded: [
        ...AGENT_RUN_EXCLUSIVE,
        ...CLASSIFIER_EXCLUSIVE,
        ...LOGICAL_MOVE_EXCLUSIVE,
        ...MODEL_INVOKE_EXCLUSIVE,
        ...CRON_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "workstation.model-workstation.minimal" },
      { exampleId: "workstation.model-workstation.misuse-operation" },
    ],
  );
}

/** Production overlay for `MODEL_INVOKE`. */
export function createModelInvokeOverlay(): FactoryVariantOverlaySchema {
  return createTypeOverlay(
    "MODEL_INVOKE",
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...WORKSTATION_DISPATCH_SHARED],
      selected: [...MODEL_INVOKE_EXCLUSIVE],
      excluded: [
        ...AGENT_RUN_EXCLUSIVE,
        ...CLASSIFIER_EXCLUSIVE,
        ...LOGICAL_MOVE_EXCLUSIVE,
        ...MODEL_WORKSTATION_EXCLUSIVE,
        ...CRON_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "workstation.model-invoke.minimal" },
      { exampleId: "workstation.model-invoke.misuse-outcome-format" },
    ],
  );
}

/** Production overlay for `LOGICAL_MOVE`. */
export function createLogicalMoveOverlay(): FactoryVariantOverlaySchema {
  return createTypeOverlay(
    "LOGICAL_MOVE",
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...WORKSTATION_DISPATCH_SHARED],
      selected: [...LOGICAL_MOVE_EXCLUSIVE],
      excluded: [
        ...AGENT_RUN_EXCLUSIVE,
        ...CLASSIFIER_EXCLUSIVE,
        ...MODEL_WORKSTATION_EXCLUSIVE,
        ...MODEL_INVOKE_EXCLUSIVE,
        ...CRON_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "workstation.logical-move.minimal" },
      { exampleId: "workstation.logical-move.misuse-classification-routes" },
    ],
  );
}

/** Production overlay for `CLASSIFIER_WORKSTATION`. */
export function createClassifierWorkstationOverlay(): FactoryVariantOverlaySchema {
  return createTypeOverlay(
    "CLASSIFIER_WORKSTATION",
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...CLASSIFIER_DISPATCH_SHARED],
      selected: [...CLASSIFIER_EXCLUSIVE],
      excluded: [
        ...CLASSIFIER_EXCLUDED_DISPATCH,
        ...AGENT_RUN_EXCLUSIVE,
        ...LOGICAL_MOVE_EXCLUSIVE,
        ...MODEL_WORKSTATION_EXCLUSIVE,
        ...MODEL_INVOKE_EXCLUSIVE,
        ...CRON_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "workstation.classifier.minimal" },
      { exampleId: "workstation.classifier.misuse-outputs" },
    ],
  );
}

/**
 * Non-CRON behaviors share identity fields and exclude `cron`.
 * Type-exclusive fields stay excluded so joint attribution stays conflict-free.
 */
function createNonCronBehaviorOverlay(
  behavior: "STANDARD" | "REPEATER" | "POLLER",
  examples: FactoryVariantOverlaySchema["examples"],
): FactoryVariantOverlaySchema {
  return createBehaviorOverlay(
    behavior,
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...WORKSTATION_DISPATCH_SHARED],
      selected: [],
      excluded: [...ALL_TYPE_EXCLUSIVES, ...CRON_EXCLUSIVE],
      conditional: [],
    },
    examples,
  );
}

/** Production overlay for behavior `STANDARD`. */
export function createStandardBehaviorOverlay(): FactoryVariantOverlaySchema {
  return createNonCronBehaviorOverlay("STANDARD", [
    { exampleId: "behavior.standard.minimal" },
    { exampleId: "behavior.standard.misuse-cron" },
  ]);
}

/** Production overlay for behavior `REPEATER`. */
export function createRepeaterBehaviorOverlay(): FactoryVariantOverlaySchema {
  return createNonCronBehaviorOverlay("REPEATER", [
    { exampleId: "behavior.repeater.minimal" },
    { exampleId: "behavior.repeater.misuse-cron" },
  ]);
}

/** Production overlay for behavior `CRON`. */
export function createCronBehaviorOverlay(): FactoryVariantOverlaySchema {
  return createBehaviorOverlay(
    "CRON",
    {
      shared: [...WORKSTATION_IDENTITY_SHARED, ...WORKSTATION_DISPATCH_SHARED],
      selected: [...CRON_EXCLUSIVE],
      excluded: [...ALL_TYPE_EXCLUSIVES],
      conditional: [],
    },
    [
      { exampleId: "behavior.cron.minimal" },
      { exampleId: "behavior.cron.misuse-missing-cron" },
    ],
  );
}

/**
 * Production overlay for behavior `POLLER` (scheduling).
 * Keep distinct from runtime type `POLLER_RUN` — different overlay axis.
 */
export function createPollerBehaviorOverlay(): FactoryVariantOverlaySchema {
  return createNonCronBehaviorOverlay("POLLER", [
    { exampleId: "behavior.poller.minimal" },
    { exampleId: "behavior.poller.misuse-poller-run-collapse" },
  ]);
}

const PRODUCTION_WORKSTATION_TYPE_OVERLAY_BUILDERS: Record<
  ProductionWorkstationTypeValue,
  () => FactoryVariantOverlaySchema
> = {
  INFERENCE_RUN: createInferenceRunOverlay,
  AGENT_RUN: createAgentRunOverlay,
  SCRIPT_RUN: createScriptRunOverlay,
  POLLER_RUN: createPollerRunOverlay,
  MODEL_WORKSTATION: createModelWorkstationOverlay,
  MODEL_INVOKE: createModelInvokeOverlay,
  LOGICAL_MOVE: createLogicalMoveOverlay,
  CLASSIFIER_WORKSTATION: createClassifierWorkstationOverlay,
};

const PRODUCTION_WORKSTATION_BEHAVIOR_OVERLAY_BUILDERS: Record<
  ProductionWorkstationBehaviorValue,
  () => FactoryVariantOverlaySchema
> = {
  STANDARD: createStandardBehaviorOverlay,
  REPEATER: createRepeaterBehaviorOverlay,
  CRON: createCronBehaviorOverlay,
  POLLER: createPollerBehaviorOverlay,
};

/**
 * Build the production overlay for one Factory WorkstationType value.
 */
export function createProductionWorkstationTypeOverlay(
  workstationType: ProductionWorkstationTypeValue,
): FactoryVariantOverlaySchema {
  return PRODUCTION_WORKSTATION_TYPE_OVERLAY_BUILDERS[workstationType]();
}

/**
 * Build the production overlay for one Factory WorkstationKind behavior value.
 */
export function createProductionWorkstationBehaviorOverlay(
  behavior: ProductionWorkstationBehaviorValue,
): FactoryVariantOverlaySchema {
  return PRODUCTION_WORKSTATION_BEHAVIOR_OVERLAY_BUILDERS[behavior]();
}

/**
 * Build every production Workstation type overlay.
 */
export function createAllProductionWorkstationTypeOverlays(): FactoryVariantOverlaySchema[] {
  return PRODUCTION_WORKSTATION_TYPE_VALUES.map((workstationType) =>
    createProductionWorkstationTypeOverlay(workstationType),
  );
}

/**
 * Build every production Workstation behavior overlay.
 */
export function createAllProductionWorkstationBehaviorOverlays(): FactoryVariantOverlaySchema[] {
  return PRODUCTION_WORKSTATION_BEHAVIOR_VALUES.map((behavior) =>
    createProductionWorkstationBehaviorOverlay(behavior),
  );
}

/**
 * Build every production Workstation overlay (eight types + four behaviors).
 */
export function createAllProductionWorkstationOverlays(): FactoryVariantOverlaySchema[] {
  return [
    ...createAllProductionWorkstationTypeOverlays(),
    ...createAllProductionWorkstationBehaviorOverlays(),
  ];
}

/**
 * Look up one production Workstation overlay by stable overlay ID.
 * Returns undefined for unknown IDs (including Worker overlays).
 */
export function getProductionWorkstationOverlay(
  overlayId: FactoryVariantOverlayId,
): FactoryVariantOverlaySchema | undefined {
  if (overlayId.startsWith("workstation:")) {
    const workstationType = overlayId.slice("workstation:".length);
    if (
      !PRODUCTION_WORKSTATION_TYPE_VALUES.includes(
        workstationType as ProductionWorkstationTypeValue,
      )
    ) {
      return undefined;
    }
    return createProductionWorkstationTypeOverlay(
      workstationType as ProductionWorkstationTypeValue,
    );
  }

  if (overlayId.startsWith("behavior:")) {
    const behavior = overlayId.slice("behavior:".length);
    if (
      !PRODUCTION_WORKSTATION_BEHAVIOR_VALUES.includes(
        behavior as ProductionWorkstationBehaviorValue,
      )
    ) {
      return undefined;
    }
    return createProductionWorkstationBehaviorOverlay(
      behavior as ProductionWorkstationBehaviorValue,
    );
  }

  return undefined;
}
