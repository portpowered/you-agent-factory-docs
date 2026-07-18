/**
 * Authored example payloads for the mock worker page embeds.
 * Grounded in `@you-agent-factory/api/schemas/mock-workers` — not Factory
 * WorkerType overlays.
 */

/**
 * Minimal valid mock-workers config: one accept entry that matches a named
 * factory worker. Unmatched dispatches still follow the default accept policy.
 */
export const MOCK_WORKER_MINIMAL_EXAMPLE = {
  mockWorkers: [
    {
      id: "reviewer-accepts",
      workerName: "reviewer",
      runType: "accept",
    },
  ],
} as const;

/**
 * Incompatible misuse: Factory Worker shape (`name` + `type`) mixed into a
 * mock-workers selection entry. Mock entries use workerName (not name), require
 * runType, and never accept Factory WorkerType discriminators.
 */
export const MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE = {
  mockWorkers: [
    {
      name: "reviewer",
      type: "MOCK_WORKER",
      runType: "accept",
    },
  ],
} as const;

export const MOCK_WORKER_EXAMPLE_IDS = {
  minimal: "worker.mock.minimal",
  misuseWorkerType: "worker.mock.misuse-worker-type",
} as const;
