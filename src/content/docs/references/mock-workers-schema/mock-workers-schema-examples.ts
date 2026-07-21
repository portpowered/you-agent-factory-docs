/**
 * Page-local authored mock-workers configuration examples for
 * `/docs/references/mock-workers-schema`.
 *
 * Adapted from existing docs/customer samples (workers/mock minimal accept
 * pattern) and grounded in `@you-agent-factory/api/schemas/mock-workers`.
 * Ownership stays on this reference page — do not edit workers/workstations
 * authored pages, and do not invent fields absent from the packaged schema.
 * Hermetic upstream packaging remains HOLD; these examples are hermetic-looking
 * only.
 */

import type { SchemaExampleInput } from "@/features/references/schema";

/**
 * Minimal valid mock-workers config: one accept entry that matches a named
 * factory worker. Unmatched dispatches follow the default accept policy.
 */
export const MOCK_WORKERS_SCHEMA_MINIMAL_ACCEPT_EXAMPLE = {
  mockWorkers: [
    {
      id: "reviewer-accepts",
      workerName: "reviewer",
      runType: "accept",
    },
  ],
} as const;

/**
 * Reject runType with optional rejectConfig observables, plus an explicit
 * unmatchedDispatchPolicy for dispatches that miss every mockWorkers entry.
 */
export const MOCK_WORKERS_SCHEMA_REJECT_WITH_POLICY_EXAMPLE = {
  mockWorkers: [
    {
      id: "reviewer-rejects",
      workerName: "reviewer",
      runType: "reject",
      rejectConfig: {
        exitCode: 42,
        stderr: "mock reject",
      },
    },
  ],
  unmatchedDispatchPolicy: "passthrough",
} as const;

export const MOCK_WORKERS_SCHEMA_EXAMPLE_IDS = {
  minimalAccept: "mock-workers-schema.minimal-accept",
  rejectWithPolicy: "mock-workers-schema.reject-with-policy",
} as const;

/**
 * Authored example inputs for SchemaReference / SchemaExamplePanel.
 * Origin is always authored — values are page-owned, not package-generated.
 */
export function mockWorkersSchemaExampleInputs(): readonly SchemaExampleInput[] {
  return [
    {
      id: MOCK_WORKERS_SCHEMA_EXAMPLE_IDS.minimalAccept,
      label: "Minimal accept match",
      origin: "authored",
      language: "json",
      value: MOCK_WORKERS_SCHEMA_MINIMAL_ACCEPT_EXAMPLE,
    },
    {
      id: MOCK_WORKERS_SCHEMA_EXAMPLE_IDS.rejectWithPolicy,
      label: "Reject with unmatched policy",
      origin: "authored",
      language: "json",
      value: MOCK_WORKERS_SCHEMA_REJECT_WITH_POLICY_EXAMPLE,
    },
  ];
}
