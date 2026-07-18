/**
 * Authored example payloads for the REPEATER behavior page embeds.
 * Identities match production overlay example refs
 * (`behavior.repeater.minimal`, `behavior.repeater.misuse-cron`).
 */

/** Minimal valid REPEATER workstation configuration. */
export const REPEATER_BEHAVIOR_MINIMAL_EXAMPLE = {
  name: "review-loop",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "REPEATER",
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onRejection: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `cron` belongs on behavior CRON, not REPEATER.
 * REPEATER excludes cron scheduling fields.
 */
export const REPEATER_BEHAVIOR_MISUSE_CRON_EXAMPLE = {
  name: "review-loop",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "REPEATER",
  cron: "0 * * * *",
  inputs: ["ready"],
  outputs: ["accepted"],
  onRejection: ["ready"],
} as const;

export const REPEATER_BEHAVIOR_EXAMPLE_IDS = {
  minimal: "behavior.repeater.minimal",
  misuseCron: "behavior.repeater.misuse-cron",
} as const;
