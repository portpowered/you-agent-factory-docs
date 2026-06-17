import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { COMPONENT_COVERAGE_THRESHOLD_PERCENT } from "../../src/lib/component-coverage/boundary";
import {
  COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX,
  COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX,
  evaluateComponentCoverageEnforcement,
  formatComponentCoverageEnforcementFailure,
  formatComponentCoverageEnforcementSuccess,
  parseBunCoverageLcov,
  parseBunCoverageTable,
} from "../../src/lib/component-coverage/enforce";

const repoRoot = join(import.meta.dir, "../..");

const passingCoverageLcov = `
SF:src/components/docs/docs-shell.tsx
LF:43
LH:43
end_of_record
SF:src/components/landing/landing-shell.tsx
LF:42
LH:42
end_of_record
`;

const failingCoverageLcov = `
SF:src/components/docs/docs-shell.tsx
LF:43
LH:43
end_of_record
SF:src/components/landing/landing-shell.tsx
LF:42
LH:0
end_of_record
`;

const misleadingAverageCoverageLcov = `
SF:src/components/docs/docs-shell.tsx
LF:10
LH:10
end_of_record
SF:src/components/landing/landing-shell.tsx
LF:100
LH:85
end_of_record
`;

const passingCoverageOutput = `
------------------------------------------|---------|---------|-------------------
File                                      | % Funcs | % Lines | Uncovered Line #s
------------------------------------------|---------|---------|-------------------
All files                                 |  100.00 |  100.00 |
 src/components/docs/docs-shell.tsx       |  100.00 |  100.00 |
 src/components/landing/landing-shell.tsx |  100.00 |  100.00 |
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

  test("evaluates aggregate line coverage from lcov LF/LH totals for the enforced surface", () => {
    const enforcedFiles = [
      "src/components/docs/docs-shell.tsx",
      "src/components/landing/landing-shell.tsx",
    ];

    const passingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageLcov(passingCoverageLcov),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    expect(passingEvaluation.passed).toBe(true);
    expect(passingEvaluation.measuredLineCoveragePercent).toBe(100);

    const failingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageLcov(failingCoverageLcov),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    expect(failingEvaluation.passed).toBe(false);
    expect(failingEvaluation.measuredLineCoveragePercent).toBeCloseTo(
      (43 / 85) * 100,
      5,
    );
  });

  test("does not treat equal per-file averages as aggregate coverage", () => {
    const enforcedFiles = [
      "src/components/docs/docs-shell.tsx",
      "src/components/landing/landing-shell.tsx",
    ];
    const evaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageLcov(misleadingAverageCoverageLcov),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    const averageOfPerFilePercentages =
      ((10 / 10) * 100 + (85 / 100) * 100) / 2;

    expect(averageOfPerFilePercentages).toBeGreaterThanOrEqual(
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );
    expect(evaluation.passed).toBe(false);
    expect(evaluation.measuredLineCoveragePercent).toBeCloseTo(
      (95 / 110) * 100,
      5,
    );
  });

  test("failure and success messages name component coverage enforcement explicitly", () => {
    const enforcedFiles = [
      "src/components/docs/docs-shell.tsx",
      "src/components/landing/landing-shell.tsx",
    ];
    const failingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageLcov(failingCoverageLcov),
      enforcedFiles,
      COMPONENT_COVERAGE_THRESHOLD_PERCENT,
    );

    expect(
      formatComponentCoverageEnforcementFailure(failingEvaluation),
    ).toContain(COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX);
    expect(
      formatComponentCoverageEnforcementFailure(failingEvaluation),
    ).toContain("src/components");
    expect(
      formatComponentCoverageEnforcementFailure(failingEvaluation),
    ).toContain("43/43 lines");

    const passingEvaluation = evaluateComponentCoverageEnforcement(
      parseBunCoverageLcov(passingCoverageLcov),
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
      env: {
        ...process.env,
        COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE: "passing-threshold",
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;

    expect(result.exitCode).toBe(0);
    expect(output).toContain("Running component coverage enforcement.");
    expect(output).toContain("Component coverage enforcement contract");
    expect(output).toContain("Extension path for later coverage expansion:");
    expect(output).toContain(COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX);
  }, 120_000);
});
