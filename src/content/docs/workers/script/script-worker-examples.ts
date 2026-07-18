/**
 * Authored example payloads for the SCRIPT_WORKER page embeds.
 * Identities match production overlay example refs
 * (`worker.script.minimal`, `worker.script.misuse-model-fields`).
 */

/** Minimal valid SCRIPT_WORKER configuration with command and args. */
export const SCRIPT_WORKER_MINIMAL_EXAMPLE = {
  name: "go-test",
  type: "SCRIPT_WORKER",
  command: "go",
  args: ["test", "./..."],
  timeout: "10m",
  body: "Runs the Go test suite.",
} as const;

/**
 * Incompatible misuse: model / modelProvider / modelLocality belong on
 * inference and agent families, not SCRIPT_WORKER. Validation rejects
 * model-routing fields on script workers.
 */
export const SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE = {
  name: "go-test",
  type: "SCRIPT_WORKER",
  command: "go",
  args: ["test", "./..."],
  model: "OMNIVOICE_Q4_K_M",
  modelProvider: "CODEX",
  modelLocality: "LOCAL",
  body: "Runs the Go test suite.",
} as const;

export const SCRIPT_WORKER_EXAMPLE_IDS = {
  minimal: "worker.script.minimal",
  misuseModelFields: "worker.script.misuse-model-fields",
} as const;
