/**
 * Authored example payloads for the STANDARD behavior page embeds.
 * Identities match production overlay example refs
 * (`behavior.standard.minimal`, `behavior.standard.misuse-cron`).
 */

/** Minimal valid STANDARD workstation configuration. */
export const STANDARD_BEHAVIOR_MINIMAL_EXAMPLE = {
  name: "review-step",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "STANDARD",
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `cron` belongs on behavior CRON, not STANDARD.
 * STANDARD excludes cron scheduling fields.
 */
export const STANDARD_BEHAVIOR_MISUSE_CRON_EXAMPLE = {
  name: "review-step",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "STANDARD",
  cron: "0 * * * *",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const STANDARD_BEHAVIOR_EXAMPLE_IDS = {
  minimal: "behavior.standard.minimal",
  misuseCron: "behavior.standard.misuse-cron",
} as const;
