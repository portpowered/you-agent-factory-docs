/**
 * Authored example payloads for the MODEL_WORKSTATION type page embeds.
 * Identities match production overlay example refs
 * (`workstation.model-workstation.minimal`,
 * `workstation.model-workstation.misuse-operation`).
 */

/** Minimal valid MODEL_WORKSTATION workstation configuration. */
export const MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE = {
  name: "summarize-step",
  worker: "model-main",
  type: "MODEL_WORKSTATION",
  behavior: "STANDARD",
  promptFile: "prompts/summarize.md",
  outcomeFormat: "json",
  stopWords: ["END"],
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `operation` belongs on MODEL_INVOKE, not
 * MODEL_WORKSTATION.
 */
export const MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE = {
  name: "summarize-step",
  worker: "model-main",
  type: "MODEL_WORKSTATION",
  behavior: "STANDARD",
  operation: "chat.completions",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const MODEL_WORKSTATION_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.model-workstation.minimal",
  misuseOperation: "workstation.model-workstation.misuse-operation",
} as const;
