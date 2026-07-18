/**
 * Authored example payloads for the SCRIPT_RUN type page embeds.
 * Identities match production overlay example refs
 * (`workstation.script-run.minimal`,
 * `workstation.script-run.misuse-prompt-file`).
 */

/** Minimal valid SCRIPT_RUN workstation configuration. */
export const SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE = {
  name: "lint-step",
  worker: "script-main",
  type: "SCRIPT_RUN",
  behavior: "STANDARD",
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `promptFile` belongs on MODEL_WORKSTATION, not
 * SCRIPT_RUN.
 */
export const SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE = {
  name: "lint-step",
  worker: "script-main",
  type: "SCRIPT_RUN",
  behavior: "STANDARD",
  promptFile: "prompts/lint.md",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const SCRIPT_RUN_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.script-run.minimal",
  misusePromptFile: "workstation.script-run.misuse-prompt-file",
} as const;
