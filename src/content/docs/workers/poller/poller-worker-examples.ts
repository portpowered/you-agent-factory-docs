/**
 * Authored example payloads for the POLLER_WORKER page embeds.
 * Identities match production overlay example refs
 * (`worker.poller.minimal`, `worker.poller.misuse-inline-secret`).
 */

/** Minimal valid POLLER_WORKER configuration with hosted Linear provider auth. */
export const POLLER_WORKER_MINIMAL_EXAMPLE = {
  name: "linear-poller",
  type: "POLLER_WORKER",
  provider: "LINEAR",
  auth: {
    secretRef: "secrets/linear-api-key",
  },
  linear: {
    pollInterval: "2m",
    teamIds: ["team-a"],
    stateIds: ["state-b"],
    mapping: {
      workType: "task",
      state: "init",
    },
  },
  body: "Repository-owned Linear poller.",
} as const;

/**
 * Incompatible misuse: inline credentials on auth. V1 hosted workers accept
 * only auth.secretRef. Validation rejects inline API keys and other credential
 * fields on the worker body.
 */
export const POLLER_WORKER_MISUSE_INLINE_SECRET_EXAMPLE = {
  name: "linear-poller",
  type: "POLLER_WORKER",
  provider: "LINEAR",
  auth: {
    apiKey: "lin_api_inline_secret",
  },
  linear: {
    pollInterval: "2m",
    teamIds: ["team-a"],
    stateIds: ["state-b"],
    mapping: {
      workType: "task",
      state: "init",
    },
  },
  body: "Repository-owned Linear poller.",
} as const;

export const POLLER_WORKER_EXAMPLE_IDS = {
  minimal: "worker.poller.minimal",
  misuseInlineSecret: "worker.poller.misuse-inline-secret",
} as const;
