/**
 * Authored example payloads for the MODEL_INVOKE type page embeds.
 * Identities match production overlay example refs
 * (`workstation.model-invoke.minimal`,
 * `workstation.model-invoke.misuse-outcome-format`).
 */

/** Minimal valid MODEL_INVOKE workstation configuration. */
export const MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE = {
  name: "chat-invoke-step",
  worker: "model-main",
  type: "MODEL_INVOKE",
  behavior: "STANDARD",
  operation: "chat.completions",
  operationBindings: {
    model: "primary",
  },
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `outcomeFormat` belongs on MODEL_WORKSTATION, not
 * MODEL_INVOKE.
 */
export const MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE = {
  name: "chat-invoke-step",
  worker: "model-main",
  type: "MODEL_INVOKE",
  behavior: "STANDARD",
  outcomeFormat: "json",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const MODEL_INVOKE_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.model-invoke.minimal",
  misuseOutcomeFormat: "workstation.model-invoke.misuse-outcome-format",
} as const;
