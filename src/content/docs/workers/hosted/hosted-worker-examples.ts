/**
 * Authored example payloads for the HOSTED_WORKER page embeds.
 * Identities match production overlay example refs
 * (`worker.hosted.minimal`, `worker.hosted.misuse-inline-secret`).
 */

/**
 * Minimal valid HOSTED_WORKER configuration with hosted Linear provider auth.
 * Prefer POLLER_WORKER for new configs; this legacy surface remains loadable
 * for migration review.
 */
export const HOSTED_WORKER_MINIMAL_EXAMPLE = {
  name: "linear-hosted",
  type: "HOSTED_WORKER",
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
  body: "Legacy hosted Linear provider backend.",
} as const;

/**
 * Incompatible misuse: inline credentials on auth. V1 hosted workers accept
 * only auth.secretRef. Validation rejects inline API keys and other credential
 * fields on the worker body.
 */
export const HOSTED_WORKER_MISUSE_INLINE_SECRET_EXAMPLE = {
  name: "linear-hosted",
  type: "HOSTED_WORKER",
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
  body: "Legacy hosted Linear provider backend.",
} as const;

export const HOSTED_WORKER_EXAMPLE_IDS = {
  minimal: "worker.hosted.minimal",
  misuseInlineSecret: "worker.hosted.misuse-inline-secret",
} as const;
