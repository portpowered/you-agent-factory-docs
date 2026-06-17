import {
  COMPONENT_COVERAGE_ENFORCED_ROOT,
  COMPONENT_COVERAGE_THRESHOLD_PERCENT,
} from "./boundary";

export const COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX =
  "Component coverage enforcement failed";

export const COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX =
  "Component coverage enforcement passed";

/**
 * Test files excluded from the enforcement script's `bun test --coverage` subprocess.
 * These either recurse through the enforcement command or spawn full-suite make targets
 * that are validated separately through `make quality-gate`.
 */
export const COMPONENT_COVERAGE_ENFORCEMENT_TEST_IGNORE_PATTERNS = [
  "tests/unit/component-coverage-enforcement.test.ts",
  "tests/unit/component-coverage-enforcement-failing-path.test.ts",
  "tests/unit/static-export.test.ts",
  "tests/unit/reconciled-export-browser.test.ts",
  "tests/unit/root-command-path.test.ts",
  "tests/unit/root-workflow.test.ts",
  "tests/unit/quality-gate.test.ts",
  "tests/unit/quality-gate-validation-failing-path.test.ts",
  "tests/unit/early-gate-automation-parity.test.ts",
  "tests/unit/early-gate-contributor-guidance.test.ts",
  "tests/unit/contributor-guidance.test.ts",
  "tests/unit/automation-parity.test.ts",
] as const;

export type ParsedCoverageRow = {
  filePath: string;
  functionCoveragePercent: number;
  lineCoveragePercent: number;
};

export type LcovFileCoverage = {
  linesFound: number;
  linesHit: number;
};

export type ComponentCoverageEnforcementEvaluation = {
  passed: boolean;
  measuredLineCoveragePercent: number;
  thresholdPercent: number;
  enforcedFiles: string[];
  perFileCoverage: Array<{
    file: string;
    linesFound: number;
    linesHit: number;
    lineCoveragePercent: number;
  }>;
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

export function parseBunCoverageLcov(
  lcov: string,
): Map<string, LcovFileCoverage> {
  const coverageByFile = new Map<string, LcovFileCoverage>();
  let currentFile: string | undefined;
  let linesFound = 0;
  let linesHit = 0;

  for (const line of lcov.split("\n")) {
    if (line.startsWith("SF:")) {
      currentFile = normalizeRepoRelativePath(line.slice(3));
      linesFound = 0;
      linesHit = 0;
      continue;
    }

    if (!currentFile) {
      continue;
    }

    if (line.startsWith("LF:")) {
      linesFound = Number(line.slice(3));
      continue;
    }

    if (line.startsWith("LH:")) {
      linesHit = Number(line.slice(3));
      continue;
    }

    if (line === "end_of_record") {
      coverageByFile.set(currentFile, { linesFound, linesHit });
      currentFile = undefined;
    }
  }

  return coverageByFile;
}

function toPerFileLineCoveragePercent(
  linesFound: number,
  linesHit: number,
): number {
  return linesFound === 0 ? 0 : (linesHit / linesFound) * 100;
}

export function evaluateComponentCoverageEnforcement(
  lcovByFile: Map<string, LcovFileCoverage>,
  enforcedFiles: string[],
  thresholdPercent: number = COMPONENT_COVERAGE_THRESHOLD_PERCENT,
): ComponentCoverageEnforcementEvaluation {
  const perFileCoverage = enforcedFiles.map((file) => {
    const entry = lcovByFile.get(file);
    const linesFound = entry?.linesFound ?? 0;
    const linesHit = entry?.linesHit ?? 0;

    return {
      file,
      linesFound,
      linesHit,
      lineCoveragePercent: toPerFileLineCoveragePercent(linesFound, linesHit),
    };
  });

  const totalLinesFound = perFileCoverage.reduce(
    (total, entry) => total + entry.linesFound,
    0,
  );
  const totalLinesHit = perFileCoverage.reduce(
    (total, entry) => total + entry.linesHit,
    0,
  );
  const measuredLineCoveragePercent = toPerFileLineCoveragePercent(
    totalLinesFound,
    totalLinesHit,
  );

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
      `  - ${entry.file}: ${entry.lineCoveragePercent.toFixed(2)}% line coverage (${entry.linesHit}/${entry.linesFound} lines)`,
  );

  return [
    `${COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX}: measured aggregate line coverage ${evaluation.measuredLineCoveragePercent.toFixed(2)}% is below the required ${evaluation.thresholdPercent}% threshold for the practical component-package surface (${COMPONENT_COVERAGE_ENFORCED_ROOT}).`,
    "Enforced component files:",
    ...perFileLines,
  ].join("\n");
}

export function formatComponentCoverageEnforcementSuccess(
  evaluation: ComponentCoverageEnforcementEvaluation,
): string {
  return `${COMPONENT_COVERAGE_ENFORCEMENT_SUCCESS_PREFIX}: ${evaluation.measuredLineCoveragePercent.toFixed(2)}% aggregate line coverage meets the ${evaluation.thresholdPercent}% threshold for ${COMPONENT_COVERAGE_ENFORCED_ROOT}.`;
}
