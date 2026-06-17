import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");

function stepIndex(workflow: string, command: string): number {
  return workflow.indexOf(`run: ${command}`);
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

    expect(setupIndex).toBeGreaterThan(-1);
    expect(playwrightIndex).toBeGreaterThan(setupIndex);
    expect(checkIndex).toBeGreaterThan(playwrightIndex);
    expect(testIndex).toBeGreaterThan(checkIndex);
    expect(buildIndex).toBeGreaterThan(testIndex);

    expect(ciWorkflow).not.toContain("make quality-gate");
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
    const budgetIndex = stepIndex(ciWorkflow, "make budget");
    const coverageIndex = stepIndex(ciWorkflow, "make component-coverage");

    expect(budgetIndex).toBeGreaterThan(buildIndex);
    expect(coverageIndex).toBeGreaterThan(budgetIndex);
    expect(ciWorkflow).not.toContain("bun run budget");
    expect(ciWorkflow).not.toContain("bun run component-coverage");
    expect(ciWorkflow).not.toContain("scripts/enforce-component-coverage");
  });
});
