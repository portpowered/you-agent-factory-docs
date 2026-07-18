/**
 * Authored example payloads for the CLASSIFIER_WORKSTATION type page embeds.
 * Identities match production overlay example refs
 * (`workstation.classifier.minimal`,
 * `workstation.classifier.misuse-outputs`).
 */

/** Minimal valid CLASSIFIER_WORKSTATION workstation configuration. */
export const CLASSIFIER_TYPE_MINIMAL_EXAMPLE = {
  name: "label-route-step",
  worker: "hosted-main",
  type: "CLASSIFIER_WORKSTATION",
  behavior: "STANDARD",
  classificationRoutes: {
    accept: ["accepted"],
    reject: ["rejected"],
  },
  inputs: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `outputs` belongs on non-classifier WorkstationTypes,
 * not CLASSIFIER_WORKSTATION (which routes via classificationRoutes).
 */
export const CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE = {
  name: "label-route-step",
  worker: "hosted-main",
  type: "CLASSIFIER_WORKSTATION",
  behavior: "STANDARD",
  outputs: ["accepted"],
  onContinue: ["ready"],
  inputs: ["ready"],
  onFailure: ["failed"],
} as const;

export const CLASSIFIER_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.classifier.minimal",
  misuseOutputs: "workstation.classifier.misuse-outputs",
} as const;
