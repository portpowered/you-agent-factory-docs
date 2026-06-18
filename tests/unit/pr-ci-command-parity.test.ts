import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dryRunMake } from "../helpers/make";
import { runMakeTarget } from "../helpers/make-target";

const repoRoot = join(import.meta.dir, "../..");

function normalizeWorkflowLines(workflow: string) {
  return workflow.replace(/\r\n/g, "\n").split("\n");
}

function extractVerifyJobRunCommands(workflow: string) {
  const lines = normalizeWorkflowLines(workflow);
  const verifyJobStart = lines.findIndex((line) => line === "  verify:");

  expect(verifyJobStart).toBeGreaterThanOrEqual(0);

  const commands: string[] = [];

  for (const line of lines.slice(verifyJobStart + 1)) {
    if (/^ {2}[^ ]/.test(line)) {
      break;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("run: ")) {
      commands.push(trimmed.slice("run: ".length));
    }
  }

  return commands;
}

function expectOrderedSubsequence(commands: string[], expected: string[]) {
  let nextIndex = 0;

  for (const command of commands) {
    if (command === expected[nextIndex]) {
      nextIndex += 1;
    }
  }

  expect(nextIndex).toBe(expected.length);
}

describe("pull-request CI command parity", () => {
  test("verify job keeps the required root make path ahead of supplemental gates and the commands succeed through that same surface", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );
    const commands = extractVerifyJobRunCommands(ciWorkflow);

    expect(ciWorkflow).toContain("pull_request:");
    expectOrderedSubsequence(commands, [
      "make setup",
      "make check",
      "make test",
      "make build",
      "make quality-gate",
      "make budget",
      "make component-coverage",
    ]);

    expect(commands).not.toContain("bun run typecheck");
    expect(commands).not.toContain("bun run lint");
    expect(commands).not.toContain("bun test");
    expect(commands).not.toContain("bun run build");
    expect(commands).not.toContain("scripts/enforce-component-coverage");

    const setup = runMakeTarget("setup");
    expect(setup.status).toBe(0);
    expect(setup.output).toMatch(/bun install/);

    const check = runMakeTarget("check");
    expect(check.status).toBe(0);
    expect(check.output).toMatch(/typecheck/);
    expect(check.output).toMatch(/lint/);

    const testResult = runMakeTarget("test", { VERIFYING_MAKE_TEST: "1" });
    expect(testResult.status).toBe(0);
    expect(testResult.output).toContain("tests/unit/project.test.ts");
    expect(testResult.output).toContain("tests/unit/site.test.ts");

    const build = runMakeTarget("build");
    expect(build.status).toBe(0);
    expect(build.output).toMatch(/Exporting/);
    expect(existsSync(join(repoRoot, "out"))).toBe(true);
  }, 240_000);

  test("supplemental root make targets keep their own command surfaces", () => {
    expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
    expect(dryRunMake("budget")).toContain("bun run budget");
    expect(dryRunMake("component-coverage")).toContain(
      "bun run component-coverage",
    );
  });
});
