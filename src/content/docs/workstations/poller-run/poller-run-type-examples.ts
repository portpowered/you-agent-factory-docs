/**
 * Authored example payloads for the POLLER_RUN type page embeds.
 * Identities match production overlay example refs
 * (`workstation.poller-run.minimal`,
 * `workstation.poller-run.misuse-poller-behavior-collapse`).
 */

/** Minimal valid POLLER_RUN workstation with behavior POLLER. */
export const POLLER_RUN_TYPE_MINIMAL_EXAMPLE = {
  name: "long-lived-ingress",
  worker: "poller-main",
  type: "POLLER_RUN",
  behavior: "POLLER",
  inputs: ["ready"],
  outputs: ["accepted"],
  onContinue: ["ready"],
  onFailure: ["failed"],
} as const;

/**
 * Incompatible misuse: collapsing axes by putting POLLER_RUN on `behavior`.
 * POLLER_RUN is a WorkstationType; scheduling must use a WorkstationKind such
 * as POLLER.
 */
export const POLLER_RUN_TYPE_MISUSE_POLLER_BEHAVIOR_COLLAPSE_EXAMPLE = {
  name: "long-lived-ingress",
  worker: "poller-main",
  type: "POLLER_RUN",
  behavior: "POLLER_RUN",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const POLLER_RUN_TYPE_EXAMPLE_IDS = {
  minimal: "workstation.poller-run.minimal",
  misusePollerBehaviorCollapse:
    "workstation.poller-run.misuse-poller-behavior-collapse",
} as const;
