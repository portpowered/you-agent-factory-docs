/**
 * Authored example payloads for the AGENT_RUN type page embeds.
 * Identities match production overlay example refs
 * (`workstation.agent-run.minimal`,
 * `workstation.agent-run.misuse-operation`).
 */

/** Minimal valid AGENT_RUN workstation configuration. */
export const AGENT_RUN_TYPE_MINIMAL_EXAMPLE = {
  name: "writer-step",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "STANDARD",
  openCodeAgent: {
    model: "default",
  },
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `operation` belongs on MODEL_INVOKE, not AGENT_RUN.
 */
export const AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE = {
  name: "writer-step",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "STANDARD",
  operation: "chat.completions",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const AGENT_RUN_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.agent-run.minimal",
  misuseOperation: "workstation.agent-run.misuse-operation",
} as const;
