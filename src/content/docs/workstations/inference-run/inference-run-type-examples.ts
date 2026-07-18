/**
 * Authored example payloads for the INFERENCE_RUN type page embeds.
 * Identities match production overlay example refs
 * (`workstation.inference-run.minimal`,
 * `workstation.inference-run.misuse-classification-routes`).
 */

/** Minimal valid INFERENCE_RUN workstation configuration. */
export const INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE = {
  name: "tts-step",
  worker: "inference-main",
  type: "INFERENCE_RUN",
  behavior: "STANDARD",
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `classificationRoutes` belongs on
 * CLASSIFIER_WORKSTATION, not INFERENCE_RUN.
 */
export const INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE = {
  name: "tts-step",
  worker: "inference-main",
  type: "INFERENCE_RUN",
  behavior: "STANDARD",
  classificationRoutes: {
    accept: ["accepted"],
    reject: ["rejected"],
  },
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const INFERENCE_RUN_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.inference-run.minimal",
  misuseClassificationRoutes:
    "workstation.inference-run.misuse-classification-routes",
} as const;
