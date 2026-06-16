import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dryRunMake } from "../helpers/make";

const repoRoot = join(import.meta.dir, "../..");
const workflowPath = join(repoRoot, ".github/workflows/ci.yml");

function readCiWorkflow(): string {
  return readFileSync(workflowPath, "utf8");
}

function stripYamlComments(content: string): string {
  return content.replace(/#.*$/gm, "");
}

describe("automation command parity", () => {
  test("ci workflow invokes make setup, check, test, and build directly", () => {
    const workflow = readCiWorkflow();

    for (const target of ["setup", "check", "test", "build"]) {
      expect(workflow).toMatch(new RegExp(`make\\s+${target}\\b`));
    }

    const setupIndex = workflow.indexOf("make setup");
    const checkIndex = workflow.indexOf("make check");
    const testIndex = workflow.indexOf("make test");
    const buildIndex = workflow.indexOf("make build");

    expect(setupIndex).toBeLessThan(checkIndex);
    expect(checkIndex).toBeLessThan(testIndex);
    expect(testIndex).toBeLessThan(buildIndex);
  });

  test("ci workflow does not bypass the makefile for verification commands", () => {
    const workflow = stripYamlComments(readCiWorkflow());

    expect(workflow).not.toMatch(/\bbun\s+install\b/);
    expect(workflow).not.toMatch(/\bbun\s+test\b/);
    expect(workflow).not.toMatch(/\bbun\s+run\s+typecheck\b/);
    expect(workflow).not.toMatch(/\bbun\s+run\s+lint\b/);
    expect(workflow).not.toMatch(/\bbun\s+run\s+build\b/);
  });

  test("automation inherits bun test delegation through make test", () => {
    expect(dryRunMake("test")).toContain("bun test");
  });
});
