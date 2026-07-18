/**
 * Production Factory Worker variant overlays (W13).
 *
 * Authored editorial overlays for every installed Factory `WorkerType`. Field
 * slots list applicability identities only — never copied canonical prose.
 * Companion Workstation refs come from the W06 compatibility matrix. Example
 * refs are catalog identities for later page embeds; mock workers are excluded.
 *
 * Pure data builders — no filesystem IO. Call sites validate through the
 * existing W06 validator against installed Factory schema projections.
 */

import {
  applyFactoryVariantCompatibilityFactToOverlay,
  createMinimalFactoryVariantCompatibilityMatrix,
} from "./factory-variant-compatibility-matrix";
import { createCanonicalFactoryVariantOverlay } from "./factory-variant-overlay-registry";
import {
  createFactoryVariantOverlay,
  type FactoryVariantFieldApplicability,
  type FactoryVariantOverlayId,
  type FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

/** Installed Factory WorkerType discriminator values (overlay axis order). */
export const PRODUCTION_WORKER_TYPE_VALUES = [
  "INFERENCE_WORKER",
  "AGENT_WORKER",
  "SCRIPT_WORKER",
  "POLLER_WORKER",
  "MODEL_WORKER",
  "HOSTED_WORKER",
] as const;

export type ProductionWorkerTypeValue =
  (typeof PRODUCTION_WORKER_TYPE_VALUES)[number];

/** Stable overlay IDs for every production Worker overlay. */
export const PRODUCTION_WORKER_OVERLAY_IDS = [
  "worker:INFERENCE_WORKER",
  "worker:AGENT_WORKER",
  "worker:SCRIPT_WORKER",
  "worker:POLLER_WORKER",
  "worker:MODEL_WORKER",
  "worker:HOSTED_WORKER",
] as const satisfies readonly FactoryVariantOverlayId[];

/**
 * Authored example identities referenced by production Worker overlays.
 * Page content for these IDs lands in later W13 stories; existence is proven
 * here against an explicit catalog at validation time.
 */
export const PRODUCTION_WORKER_EXAMPLE_IDS = [
  "worker.inference.minimal",
  "worker.inference.misuse-agent-tools",
  "worker.agent.minimal",
  "worker.agent.misuse-operations",
  "worker.script.minimal",
  "worker.script.misuse-model-fields",
  "worker.poller.minimal",
  "worker.poller.misuse-inline-secret",
  "worker.model.minimal",
  "worker.model.misuse-agent-tools",
  "worker.hosted.minimal",
  "worker.hosted.misuse-inline-secret",
] as const;

/** Identity + operational fields always applicable across Worker variants. */
const WORKER_IDENTITY_SHARED = [
  "name",
  "type",
  "id",
  "body",
  "timeout",
  "resources",
] as const;

/** Model-routing fields shared by inference / agent / model worker families. */
const MODEL_ROUTING_SHARED = ["model", "modelProvider", "stopToken"] as const;

/**
 * Fields exclusive to script/command execution. Selected only on SCRIPT_WORKER
 * so cross-overlay field attribution stays conflict-free.
 */
const SCRIPT_EXCLUSIVE = ["command", "args", "executorProvider"] as const;

/** Fields exclusive to agent-loop tooling. Selected only on AGENT_WORKER. */
const AGENT_EXCLUSIVE = [
  "agentTools",
  "openCodeAgent",
  "skipPermissions",
] as const;

/**
 * Fields exclusive to one-shot inference capability declarations. Selected on
 * INFERENCE_WORKER; MODEL_WORKER lists them as shared (legacy projection).
 */
const INFERENCE_EXCLUSIVE = ["operations", "modelLocality"] as const;

/**
 * Fields exclusive to hosted/poller provider auth. Selected on POLLER_WORKER;
 * HOSTED_WORKER lists them as shared (legacy projection).
 */
const HOSTED_POLLER_EXCLUSIVE = ["provider", "auth", "linear"] as const;

function applyCompanions(
  overlay: FactoryVariantOverlaySchema,
): FactoryVariantOverlaySchema {
  const matrix = createMinimalFactoryVariantCompatibilityMatrix();
  return applyFactoryVariantCompatibilityFactToOverlay(overlay, matrix);
}

function createWorkerOverlay(
  workerType: ProductionWorkerTypeValue,
  fields: FactoryVariantFieldApplicability,
  examples: FactoryVariantOverlaySchema["examples"],
): FactoryVariantOverlaySchema {
  const canonical = createCanonicalFactoryVariantOverlay("worker", workerType);
  return applyCompanions(
    createFactoryVariantOverlay({
      ...canonical,
      fields,
      examples,
    }),
  );
}

/** Production overlay for `INFERENCE_WORKER`. */
export function createInferenceWorkerOverlay(): FactoryVariantOverlaySchema {
  return createWorkerOverlay(
    "INFERENCE_WORKER",
    {
      shared: [...WORKER_IDENTITY_SHARED, ...MODEL_ROUTING_SHARED],
      selected: [...INFERENCE_EXCLUSIVE],
      excluded: [
        ...AGENT_EXCLUSIVE,
        ...SCRIPT_EXCLUSIVE,
        ...HOSTED_POLLER_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "worker.inference.minimal" },
      { exampleId: "worker.inference.misuse-agent-tools" },
    ],
  );
}

/** Production overlay for `AGENT_WORKER`. */
export function createAgentWorkerOverlay(): FactoryVariantOverlaySchema {
  return createWorkerOverlay(
    "AGENT_WORKER",
    {
      shared: [...WORKER_IDENTITY_SHARED, ...MODEL_ROUTING_SHARED],
      selected: [...AGENT_EXCLUSIVE],
      excluded: [
        ...INFERENCE_EXCLUSIVE,
        ...SCRIPT_EXCLUSIVE,
        ...HOSTED_POLLER_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "worker.agent.minimal" },
      { exampleId: "worker.agent.misuse-operations" },
    ],
  );
}

/** Production overlay for `SCRIPT_WORKER`. */
export function createScriptWorkerOverlay(): FactoryVariantOverlaySchema {
  return createWorkerOverlay(
    "SCRIPT_WORKER",
    {
      shared: [...WORKER_IDENTITY_SHARED],
      selected: [...SCRIPT_EXCLUSIVE],
      excluded: [
        ...MODEL_ROUTING_SHARED,
        ...INFERENCE_EXCLUSIVE,
        ...AGENT_EXCLUSIVE,
        ...HOSTED_POLLER_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "worker.script.minimal" },
      { exampleId: "worker.script.misuse-model-fields" },
    ],
  );
}

/** Production overlay for `POLLER_WORKER`. */
export function createPollerWorkerOverlay(): FactoryVariantOverlaySchema {
  return createWorkerOverlay(
    "POLLER_WORKER",
    {
      shared: [...WORKER_IDENTITY_SHARED],
      selected: [...HOSTED_POLLER_EXCLUSIVE],
      excluded: [
        ...MODEL_ROUTING_SHARED,
        ...INFERENCE_EXCLUSIVE,
        ...AGENT_EXCLUSIVE,
        ...SCRIPT_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "worker.poller.minimal" },
      { exampleId: "worker.poller.misuse-inline-secret" },
    ],
  );
}

/**
 * Production overlay for `MODEL_WORKER` (legacy projection surface).
 * Lists inference-capability fields as shared so they do not conflict with
 * INFERENCE_WORKER selected attribution under joint validation.
 */
export function createModelWorkerOverlay(): FactoryVariantOverlaySchema {
  return createWorkerOverlay(
    "MODEL_WORKER",
    {
      shared: [
        ...WORKER_IDENTITY_SHARED,
        ...MODEL_ROUTING_SHARED,
        ...INFERENCE_EXCLUSIVE,
        "openCodeAgent",
      ],
      selected: [],
      excluded: [
        "agentTools",
        "skipPermissions",
        ...SCRIPT_EXCLUSIVE,
        ...HOSTED_POLLER_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "worker.model.minimal" },
      { exampleId: "worker.model.misuse-agent-tools" },
    ],
  );
}

/**
 * Production overlay for `HOSTED_WORKER` (legacy projection surface).
 * Lists hosted provider fields as shared so they do not conflict with
 * POLLER_WORKER selected attribution under joint validation.
 */
export function createHostedWorkerOverlay(): FactoryVariantOverlaySchema {
  return createWorkerOverlay(
    "HOSTED_WORKER",
    {
      shared: [...WORKER_IDENTITY_SHARED, ...HOSTED_POLLER_EXCLUSIVE],
      selected: [],
      excluded: [
        ...MODEL_ROUTING_SHARED,
        ...INFERENCE_EXCLUSIVE,
        ...AGENT_EXCLUSIVE,
        ...SCRIPT_EXCLUSIVE,
      ],
      conditional: [],
    },
    [
      { exampleId: "worker.hosted.minimal" },
      { exampleId: "worker.hosted.misuse-inline-secret" },
    ],
  );
}

const PRODUCTION_WORKER_OVERLAY_BUILDERS: Record<
  ProductionWorkerTypeValue,
  () => FactoryVariantOverlaySchema
> = {
  INFERENCE_WORKER: createInferenceWorkerOverlay,
  AGENT_WORKER: createAgentWorkerOverlay,
  SCRIPT_WORKER: createScriptWorkerOverlay,
  POLLER_WORKER: createPollerWorkerOverlay,
  MODEL_WORKER: createModelWorkerOverlay,
  HOSTED_WORKER: createHostedWorkerOverlay,
};

/**
 * Build the production overlay for one Factory WorkerType value.
 */
export function createProductionWorkerOverlay(
  workerType: ProductionWorkerTypeValue,
): FactoryVariantOverlaySchema {
  return PRODUCTION_WORKER_OVERLAY_BUILDERS[workerType]();
}

/**
 * Build every production Factory Worker overlay (mock workers excluded).
 */
export function createAllProductionWorkerOverlays(): FactoryVariantOverlaySchema[] {
  return PRODUCTION_WORKER_TYPE_VALUES.map((workerType) =>
    createProductionWorkerOverlay(workerType),
  );
}

/**
 * Look up one production Worker overlay by stable overlay ID.
 * Returns undefined for unknown IDs (including mock-worker identities).
 */
export function getProductionWorkerOverlay(
  overlayId: FactoryVariantOverlayId,
): FactoryVariantOverlaySchema | undefined {
  const prefix = "worker:";
  if (!overlayId.startsWith(prefix)) {
    return undefined;
  }
  const workerType = overlayId.slice(prefix.length);
  if (
    !PRODUCTION_WORKER_TYPE_VALUES.includes(
      workerType as ProductionWorkerTypeValue,
    )
  ) {
    return undefined;
  }
  return createProductionWorkerOverlay(workerType as ProductionWorkerTypeValue);
}
