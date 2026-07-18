/**
 * Authored example payloads for the POLLER behavior page embeds.
 * Identities match production overlay example refs
 * (`behavior.poller.minimal`, `behavior.poller.misuse-poller-run-collapse`).
 */

/** Minimal valid POLLER workstation with type POLLER_RUN. */
export const POLLER_BEHAVIOR_MINIMAL_EXAMPLE = {
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
 * Incompatible misuse: collapsing axes by putting POLLER on `type`.
 * POLLER is a WorkstationKind behavior value; runtime type must be a
 * WorkstationType such as POLLER_RUN.
 */
export const POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE = {
  name: "long-lived-ingress",
  worker: "poller-main",
  type: "POLLER",
  behavior: "STANDARD",
  inputs: ["ready"],
  outputs: ["accepted"],
} as const;

export const POLLER_BEHAVIOR_EXAMPLE_IDS = {
  minimal: "behavior.poller.minimal",
  misusePollerRunCollapse: "behavior.poller.misuse-poller-run-collapse",
} as const;
