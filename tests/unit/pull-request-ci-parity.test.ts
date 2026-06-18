import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");

function stepIndex(workflow: string, command: string): number {
  return workflow.indexOf(`run: ${command}`);
}

function workflowStepCommand(workflow: string, stepName: string): string {
  const stepPattern = new RegExp(`- name: ${stepName}\\s+run: ([^\\n]+)`);
  const command = workflow.match(stepPattern)?.[1];

  if (!command) {
    throw new Error(`Could not find workflow command for step: ${stepName}`);
  }

  return command.trim();
}

function runWorkflowStepWithFailingMake(
  workflow: string,
  stepName: string,
  failingTarget: string,
) {
  const sandboxDir = mkdtempSync(join(tmpdir(), "pr-ci-parity-"));
  const fakeMakePath = join(sandboxDir, "make");
  const command = workflowStepCommand(workflow, stepName);

  writeFileSync(
    fakeMakePath,
    `#!/bin/sh
if [ "$1" = "${failingTarget}" ]; then
  echo "Simulated ${failingTarget} failure from fake make" >&2
  exit 1
fi

echo "fake make handled: $1"
exit 0
`,
    { mode: 0o755 },
  );

  try {
    const result = spawnSync("sh", ["-c", command], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${sandboxDir}:${process.env.PATH ?? ""}`,
      },
    });

    return {
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } finally {
    rmSync(sandboxDir, { recursive: true, force: true });
  }
}

describe("pull request CI workflow parity", () => {
  test("pull request workflow runs the authoritative root make verification path in order", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );

    const setupIndex = stepIndex(ciWorkflow, "make setup");
    const playwrightIndex = ciWorkflow.indexOf(
      "bunx playwright install --with-deps chromium",
    );
    const checkIndex = stepIndex(ciWorkflow, "make check");
    const testIndex = stepIndex(ciWorkflow, "make test");
    const buildIndex = stepIndex(ciWorkflow, "make build");
    const qualityGateIndex = stepIndex(ciWorkflow, "make quality-gate");

    expect(setupIndex).toBeGreaterThan(-1);
    expect(playwrightIndex).toBeGreaterThan(setupIndex);
    expect(checkIndex).toBeGreaterThan(playwrightIndex);
    expect(testIndex).toBeGreaterThan(checkIndex);
    expect(buildIndex).toBeGreaterThan(testIndex);
    expect(qualityGateIndex).toBeGreaterThan(buildIndex);

    expect(ciWorkflow).not.toContain("bun run typecheck");
    expect(ciWorkflow).not.toContain("bun run lint");
    expect(ciWorkflow).not.toContain("bun test");
    expect(ciWorkflow).not.toContain("bun run build");
  });

  test("pull request workflow preserves reviewer-visible adjacent verification gates", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );

    const buildIndex = stepIndex(ciWorkflow, "make build");
    const qualityGateIndex = stepIndex(ciWorkflow, "make quality-gate");
    const budgetIndex = stepIndex(ciWorkflow, "make budget");
    const coverageIndex = stepIndex(ciWorkflow, "make component-coverage");

    expect(qualityGateIndex).toBeGreaterThan(buildIndex);
    expect(budgetIndex).toBeGreaterThan(qualityGateIndex);
    expect(coverageIndex).toBeGreaterThan(budgetIndex);
    expect(ciWorkflow).not.toContain("bun run quality-gate");
    expect(ciWorkflow).not.toContain("bun run budget");
    expect(ciWorkflow).not.toContain("bun run component-coverage");
    expect(ciWorkflow).not.toContain("scripts/enforce-component-coverage");
  });

  test("pull request validation fails when the workflow test command fails", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );

    const result = runWorkflowStepWithFailingMake(
      ciWorkflow,
      "Run tests",
      "test",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Simulated test failure from fake make");
  });

  test("pull request validation fails when the workflow build command fails", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );

    const result = runWorkflowStepWithFailingMake(
      ciWorkflow,
      "Build static export",
      "build",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Simulated build failure from fake make");
  });
});
