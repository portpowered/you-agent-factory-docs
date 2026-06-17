import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");

type WorkflowStep = {
  name?: string;
  run?: string;
  uses?: string;
};

function normalizeWorkflowLines(workflow: string) {
  return workflow.replace(/\r\n/g, "\n").split("\n");
}

function extractVerifyJobLines(workflow: string) {
  const lines = normalizeWorkflowLines(workflow);
  const verifyJobStart = lines.findIndex((line) => line === "  verify:");

  expect(verifyJobStart).toBeGreaterThanOrEqual(0);

  const verifyJobLines: string[] = [];

  for (const line of lines.slice(verifyJobStart + 1)) {
    if (/^ {2}[^ ]/.test(line)) {
      break;
    }

    verifyJobLines.push(line);
  }

  return verifyJobLines;
}

function extractVerifyJobSteps(workflow: string) {
  const verifyJobLines = extractVerifyJobLines(workflow);
  const stepsStart = verifyJobLines.findIndex((line) => line === "    steps:");

  expect(stepsStart).toBeGreaterThanOrEqual(0);

  const steps: WorkflowStep[] = [];
  let currentStep: WorkflowStep | null = null;

  for (const line of verifyJobLines.slice(stepsStart + 1)) {
    if (line.startsWith("      - ")) {
      if (currentStep) {
        steps.push(currentStep);
      }

      currentStep = {};
      const trimmed = line.trim();

      if (trimmed.startsWith("- name: ")) {
        currentStep.name = trimmed.slice("- name: ".length);
      }

      continue;
    }

    if (!currentStep) {
      continue;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith("name: ")) {
      currentStep.name = trimmed.slice("name: ".length);
    }

    if (trimmed.startsWith("run: ")) {
      currentStep.run = trimmed.slice("run: ".length);
    }

    if (trimmed.startsWith("uses: ")) {
      currentStep.uses = trimmed.slice("uses: ".length);
    }
  }

  if (currentStep) {
    steps.push(currentStep);
  }

  return steps;
}

describe("pull-request CI command parity", () => {
  test("workflow visibly runs the required pull-request command path in the verify job", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );
    const steps = extractVerifyJobSteps(ciWorkflow);
    const runnableSteps = steps.filter((step) => step.run);
    const runnableCommands = runnableSteps.map((step) => step.run);

    expect(ciWorkflow).toContain("pull_request:");
    expect(steps.map((step) => step.name)).toEqual([
      "Checkout",
      "Setup Bun",
      "Setup",
      "Install Playwright Chromium",
      "Run typecheck and lint",
      "Run tests",
      "Build static export",
      "Run early foundation quality gate",
      "Exported-site budget gate",
      "Component coverage enforcement",
    ]);
    expect(runnableCommands).toEqual([
      "make setup",
      "bunx playwright install --with-deps chromium",
      "make check",
      "make test",
      "make build",
      "make quality-gate",
      "make budget",
      "make component-coverage",
    ]);

    for (const step of runnableSteps) {
      expect(step.run).not.toContain("bun run typecheck");
      expect(step.run).not.toContain("bun run lint");
      expect(step.run).not.toContain("bun test");
      expect(step.run).not.toContain("bun run build");
      expect(step.run).not.toContain("scripts/enforce-component-coverage");
    }
  });
});
