/**
 * Authored example payloads for the CRON behavior page embeds.
 * Identities match production overlay example refs
 * (`behavior.cron.minimal`, `behavior.cron.misuse-missing-cron`).
 */

/** Minimal valid CRON workstation configuration. */
export const CRON_BEHAVIOR_MINIMAL_EXAMPLE = {
  name: "nightly-review",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "CRON",
  cron: "0 2 * * *",
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: `cron` is required under behavior CRON.
 * Omitting the schedule leaves the CRON contract incomplete.
 */
export const CRON_BEHAVIOR_MISUSE_MISSING_CRON_EXAMPLE = {
  name: "nightly-review",
  worker: "agent-main",
  type: "AGENT_RUN",
  behavior: "CRON",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const CRON_BEHAVIOR_EXAMPLE_IDS = {
  minimal: "behavior.cron.minimal",
  misuseMissingCron: "behavior.cron.misuse-missing-cron",
} as const;
