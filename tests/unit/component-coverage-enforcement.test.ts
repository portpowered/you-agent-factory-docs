import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { COMPONENT_COVERAGE_THRESHOLD_PERCENT } from "../../src/lib/component-coverage/boundary";
import {
  COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX,
  COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX,
  evaluateComponentCoverageEnforcement,
  formatComponentCoverageEnforcementFailure,
  formatComponentCoverageEnforcementSuccess,
  parseBunCoverageTable,
} from "../../src/lib/component-coverage/enforce";

const repoRoot = join(import.meta.dir, "../..");

const passingCoverageOutput = `
------------------------------------------|---------|---------|-------------------
File                                      | % Funcs | % Lines | Uncovered Line #s
------------------------------------------|---------|---------|-------------------
All files                                 |  100.00 |  100.00 |
 src/components/docs/docs-shell.tsx       |  100.00 |  100.00 |
 src/components/landing/landing-shell.tsx |  100.00 |  100.00 |
------------------------------------------|---------|---------|-------------------
`;

const failingCoverageOutput = `
------------------------------------------|---------|---------|-------------------
File                                      | % Funcs | % Lines | Uncovered Line #s
------------------------------------------|---------|---------|-------------------
All files                                 |   50.00 |   50.00 |
 src/components/docs/docs-shell.tsx       |  100.00 |  100.00 |
 src/components/landing/landing-shell.tsx |    0.00 |    0.00 | 1-20
------------------------------------------|---------|---------|-------------------
`;

describe("component coverage enforcement logic", () => {
  test("parses bun coverage table rows for enforced component files", () => {
    const rows = parseBunCoverageTable(passingCoverageOutput);

    expect(rows).toEqual([
      {
        filePath: "src/components/docs/docs-shell.tsx",
        functionCoveragePercent: 100,
        lineCoveragePercent: 100,
      },
      {
        filePath: "src/components/landing/landing-shell.tsx",
        functionCoveragePercent: 100,
        lineCoveragePercent: 100,
      },
    ]);
  });

  test("evaluates aggregate line coverage for the enforced component surface", () => {
    const enforcedFiles = [
      "src/components/docs/docs-shell.tsx",
      "src/components/landing/landing-shell.tsx",
    ];

    const passingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageTable(passingCoverageOutput),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    expect(passingEvaluation.passed).toBe(true);
    expect(passingEvaluation.measuredLineCoveragePercent).toBe(100);

    const failingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageTable(failingCoverageOutput),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    expect(failingEvaluation.passed).toBe(false);
    expect(failingEvaluation.measuredLineCoveragePercent).toBe(50);
  });

  test("failure and success messages name component coverage enforcement explicitly", () => {
    const enforcedFiles = [
      "src/components/docs/docs-shell.tsx",
      "src/components/landing/landing-shell.tsx",
    ];
    const failingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageTable(failingCoverageOutput),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    expect(
      formatComponentCoverageEnforcementFailure(failingEvaluation),
    ).toContain(COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX);
    expect(
      formatComponentCoverageEnforcementFailure(failingEvaluation),
    ).toContain("src/components");

    const passingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageTable(passingCoverageOutput),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    expect(
      formatComponentCoverageEnforcementSuccess(passingEvaluation),
    ).toContain(COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX);
  });
});

describe("component coverage enforcement command surface", () => {
  test("make component-coverage delegates to the bun component-coverage script", () => {
    const result = Bun.spawnSync({
      cmd: ["make", "-n", "component-coverage"],
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("bun run component-coverage");
  });

  test("enforce-component-coverage script passes on the current component baseline", () => {
    const result = Bun.spawnSync({
      cmd: ["bun", "run", "component-coverage"],
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;

    expect(result.exitCode).toBe(0);
    expect(output).toContain("Running component coverage enforcement.");
    expect(output).toContain(COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX);
    expect(output).toContain("src/components/landing/landing-shell.tsx");
  }, 120_000);
});
