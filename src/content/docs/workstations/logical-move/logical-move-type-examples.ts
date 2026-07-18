/**
 * Authored example payloads for the LOGICAL_MOVE type page embeds.
 * Identities match production overlay example refs
 * (`workstation.logical-move.minimal`,
 * `workstation.logical-move.misuse-classification-routes`).
 */

/** Minimal valid LOGICAL_MOVE workstation configuration. */
export const LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE = {
  name: "loop-break-step",
  worker: "hosted-main",
  type: "LOGICAL_MOVE",
  behavior: "STANDARD",
  guards: ["loop-exit-ready"],
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `classificationRoutes` belongs on
 * CLASSIFIER_WORKSTATION, not LOGICAL_MOVE.
 */
export const LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE = {
  name: "loop-break-step",
  worker: "hosted-main",
  type: "LOGICAL_MOVE",
  behavior: "STANDARD",
  classificationRoutes: {
    accept: ["accepted"],
    reject: ["rejected"],
  },
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const LOGICAL_MOVE_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.logical-move.minimal",
  misuseClassificationRoutes:
    "workstation.logical-move.misuse-classification-routes",
} as const;
