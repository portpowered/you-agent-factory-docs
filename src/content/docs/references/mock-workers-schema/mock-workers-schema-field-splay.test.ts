/**
 * Page-local proofs for mock-workers recursive field splay.
 */
import { describe, expect, test } from "bun:test";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { splayMockWorkersSchemaFieldNodes } from "./mock-workers-schema-field-splay";

describe("splayMockWorkersSchemaFieldNodes", () => {
  test("inlines mockWorker fields under mockWorkers and keeps unmatched policy", () => {
    const model = loadSchemaVerificationPackageModel("schemas/mock-workers");
    const nodes = splayMockWorkersSchemaFieldNodes(
      model.root,
      model.definitions,
    );

    const mockWorkers = nodes.find((node) => node.field.path === "mockWorkers");
    expect(mockWorkers).toBeDefined();
    expect(mockWorkers?.field.refTarget).toBeUndefined();
    expect(mockWorkers?.children?.length).toBeGreaterThan(0);

    const childPaths = new Set(
      (mockWorkers?.children ?? []).map((child) => child.field.path),
    );
    expect(childPaths.has("mockWorkers[].runType")).toBe(true);
    expect(childPaths.has("mockWorkers[].workerName")).toBe(true);
    expect(childPaths.has("mockWorkers[].rejectConfig")).toBe(true);
    expect(childPaths.has("mockWorkers[].scriptConfig")).toBe(true);
    expect(childPaths.has("mockWorkers[].workInputs")).toBe(true);

    const rejectConfig = mockWorkers?.children?.find(
      (child) => child.field.path === "mockWorkers[].rejectConfig",
    );
    expect(rejectConfig?.field.refTarget).toBeUndefined();
    expect(
      rejectConfig?.children?.some(
        (child) => child.field.path === "mockWorkers[].rejectConfig.exitCode",
      ),
    ).toBe(true);

    const workInputs = mockWorkers?.children?.find(
      (child) => child.field.path === "mockWorkers[].workInputs",
    );
    expect(
      workInputs?.children?.some(
        (child) => child.field.path === "mockWorkers[].workInputs[].workId",
      ),
    ).toBe(true);

    const unmatched = nodes.find(
      (node) => node.field.path === "unmatchedDispatchPolicy",
    );
    expect(unmatched).toBeDefined();
    expect(unmatched?.field.enum).toEqual(["accept", "passthrough"]);
  });
});
