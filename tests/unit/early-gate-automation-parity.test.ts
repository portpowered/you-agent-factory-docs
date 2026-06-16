import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dryRunMake } from "../helpers/make";

const repoRoot = join(import.meta.dir, "../..");
const workflowPath = join(repoRoot, ".github/workflows/ci.yml");

describe("early gate automation parity", () => {
  test("ci workflow runs make setup then make quality-gate", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    const setupIndex = workflow.indexOf("run: make setup");
    const gateIndex = workflow.indexOf("run: make quality-gate");

    expect(setupIndex).toBeGreaterThanOrEqual(0);
    expect(gateIndex).toBeGreaterThanOrEqual(0);
    expect(setupIndex).toBeLessThan(gateIndex);
    expect(workflow).not.toMatch(/run: make check/);
    expect(workflow).not.toMatch(/run: make test/);
    expect(workflow).not.toMatch(/run: make build/);
  });

  test("make quality-gate delegates to the bun quality-gate script", () => {
    expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
  });
});
