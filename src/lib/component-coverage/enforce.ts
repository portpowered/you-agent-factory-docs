import {
  COMPONENT_COVERAGE_ENFORCED_ROOT,
  COMPONENT_COVERAGE_THRESHOLD_PERCENT,
} from "./boundary";

export const COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX =
  "Component coverage enforcement failed";

export const COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX =
  "Component coverage enforcement passed";

/**
 * Test files that invoke the enforcement command via subprocess must be ignored
 * when the enforcement script runs `bun test --coverage` to avoid recursion.
 */
export const COMPONENT_COVERAGE_ENFORCEMENT_TEST_IGNORE_PATTERNS = [
  "tests/unit/component-coverage-enforcement.test.ts",
] as const;

export type ParsedCoverageRow = {
  filePath: string;
  functionCoveragePercent: number;
  lineCoveragePercent: number;
};

export type ComponentCoverageEnforcementEvaluation = {
  passed: boolean;
  measuredLineCoveragePercent: number;
  thresholdPercent: number;
  enforcedFiles: string[];
  perFileCoverage: Array<{ file: string; lineCoveragePercent: number }>;
};

const COVERAGE_TABLE_ROW =
  /^\s*(.+?)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)(?:\s+\|.*)?$/;

function normalizeRepoRelativePath(relativePath: string): string {
  return relativePath.trim().split("\\").join("/");
}

export function parseBunCoverageTable(output: string): ParsedCoverageRow[] {
  const rows: ParsedCoverageRow[] = [];

  for (const line of output.split("\n")) {
    const match = line.match(COVERAGE_TABLE_ROW);
    if (!match) {
      continue;
    }

    const filePath = normalizeRepoRelativePath(match[1]);
    if (filePath === "File" || filePath === "All files") {
      continue;
    }

    rows.push({
      filePath,
      functionCoveragePercent: Number(match[2]),
      lineCoveragePercent: Number(match[3]),
    });
  }

  return rows;
}

export function evaluateComponentCoverageEnforcement(
  coverageRows: ParsedCoverageRow[],
  enforcedFiles: string[],
  thresholdPercent: number = COMPONENT_COVERAGE_THRESHOLD_PERCENT,
): ComponentCoverageEnforcementEvaluation {
  const coverageByFile = new Map<string, number>();

  for (const row of coverageRows) {
    coverageByFile.set(row.filePath, row.lineCoveragePercent);
  }

  const perFileCoverage = enforcedFiles.map((file) => ({
    file,
    lineCoveragePercent: coverageByFile.get(file) ?? 0,
  }));

  const measuredLineCoveragePercent =
    perFileCoverage.length === 0
      ? 0
      : perFileCoverage.reduce(
          (total, entry) => total + entry.lineCoveragePercent,
          0,
        ) / perFileCoverage.length;

  return {
    passed: measuredLineCoveragePercent >= thresholdPercent,
    measuredLineCoveragePercent,
    thresholdPercent,
    enforcedFiles,
    perFileCoverage,
  };
}

export function formatComponentCoverageEnforcementFailure(
  evaluation: ComponentCoverageEnforcementEvaluation,
): string {
  const perFileLines = evaluation.perFileCoverage.map(
    (entry) =>
      `  - ${entry.file}: ${entry.lineCoveragePercent.toFixed(2)}% line coverage`,
  );

  return [
    `${COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX}: measured line coverage ${evaluation.measuredLineCoveragePercent.toFixed(2)}% is below the required ${evaluation.thresholdPercent}% threshold for the practical component-package surface (${COMPONENT_COVERAGE_ENFORCED_ROOT}).`,
    "Enforced component files:",
    ...perFileLines,
  ].join("\n");
}

export function formatComponentCoverageEnforcementSuccess(
  evaluation: ComponentCoverageEnforcementEvaluation,
): string {
  return `${COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX}: ${evaluation.measuredLineCoveragePercent.toFixed(2)}% line coverage meets the ${evaluation.thresholdPercent}% threshold for ${COMPONENT_COVERAGE_ENFORCED_ROOT}.`;
}
