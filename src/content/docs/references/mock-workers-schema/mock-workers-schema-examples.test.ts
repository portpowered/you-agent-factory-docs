/**
 * Observable proofs for page-local mock-workers schema examples.
 * Asserts schema-true keys and SchemaExampleInput projection — not workers/
 * workstations ownership trees.
 */
import { describe, expect, test } from "bun:test";
import {
  MOCK_WORKERS_SCHEMA_EXAMPLE_IDS,
  MOCK_WORKERS_SCHEMA_MINIMAL_ACCEPT_EXAMPLE,
  MOCK_WORKERS_SCHEMA_REJECT_WITH_POLICY_EXAMPLE,
  mockWorkersSchemaExampleInputs,
} from "./mock-workers-schema-examples";

describe("mockWorkersSchemaExampleInputs", () => {
  test("publishes at least one complete accept config with schema-true keys", () => {
    const inputs = mockWorkersSchemaExampleInputs();
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    const minimal = inputs.find(
      (entry) => entry.id === MOCK_WORKERS_SCHEMA_EXAMPLE_IDS.minimalAccept,
    );
    expect(minimal).toBeDefined();
    expect(minimal?.origin).toBe("authored");
    expect(minimal?.value).toEqual(MOCK_WORKERS_SCHEMA_MINIMAL_ACCEPT_EXAMPLE);

    const entry = MOCK_WORKERS_SCHEMA_MINIMAL_ACCEPT_EXAMPLE.mockWorkers[0];
    expect(entry.runType).toBe("accept");
    expect(entry.workerName).toBe("reviewer");
    expect(entry).not.toHaveProperty("name");
    expect(entry).not.toHaveProperty("type");
  });

  test("publishes a second schema-true case with rejectConfig and unmatched policy", () => {
    const inputs = mockWorkersSchemaExampleInputs();
    const reject = inputs.find(
      (entry) => entry.id === MOCK_WORKERS_SCHEMA_EXAMPLE_IDS.rejectWithPolicy,
    );
    expect(reject).toBeDefined();
    expect(reject?.origin).toBe("authored");
    expect(reject?.value).toEqual(
      MOCK_WORKERS_SCHEMA_REJECT_WITH_POLICY_EXAMPLE,
    );

    const entry = MOCK_WORKERS_SCHEMA_REJECT_WITH_POLICY_EXAMPLE.mockWorkers[0];
    expect(entry.runType).toBe("reject");
    expect(entry.rejectConfig.exitCode).toBe(42);
    expect(
      MOCK_WORKERS_SCHEMA_REJECT_WITH_POLICY_EXAMPLE.unmatchedDispatchPolicy,
    ).toBe("passthrough");
  });
});
