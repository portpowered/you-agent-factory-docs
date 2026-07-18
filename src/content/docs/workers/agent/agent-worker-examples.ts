/**
 * Authored example payloads for the AGENT_WORKER page embeds.
 * Identities match production overlay example refs
 * (`worker.agent.minimal`, `worker.agent.misuse-operations`).
 */

/** Minimal valid AGENT_WORKER configuration. */
export const AGENT_WORKER_MINIMAL_EXAMPLE = {
  name: "agent-main",
  type: "AGENT_WORKER",
  model: "gpt-5-codex",
  modelProvider: "CODEX",
  body: "You are a software engineer. Follow the workstation instructions and keep changes scoped to the current work item.",
  agentTools: {
    policy: "DISABLED",
  },
} as const;

/**
 * Incompatible misuse: `operations` belongs on INFERENCE_WORKER, not
 * AGENT_WORKER. Validation rejects capability declarations on agent workers.
 */
export const AGENT_WORKER_MISUSE_OPERATIONS_EXAMPLE = {
  name: "agent-main",
  type: "AGENT_WORKER",
  model: "gpt-5-codex",
  modelProvider: "CODEX",
  operations: ["CHAT"],
  body: "You are a software engineer.",
} as const;

export const AGENT_WORKER_EXAMPLE_IDS = {
  minimal: "worker.agent.minimal",
  misuseOperations: "worker.agent.misuse-operations",
} as const;
