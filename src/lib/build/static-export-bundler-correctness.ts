/**
 * Shared static-export correctness suite used to evaluate webpack and
 * Turbopack bake-off runs against the same checks.
 *
 * Minimum contracted checks:
 * - export completes (exit 0)
 * - build-contract / base-path expectations
 * - search-bootstrap expectations
 * - Turbopack whole-project NFT tracing must not fire when Turbopack is under test
 */

import type { StaticExportBundler } from "@/lib/build/static-export-bundler";
import { buildOutputHasTurbopackWholeProjectTracingWarning } from "@/lib/build/turbopack-nft-tracing-warning";

export const STATIC_EXPORT_BUNDLER_CORRECTNESS_CHECK_IDS = [
  "exportCompletes",
  "buildContractBasePath",
  "searchBootstrap",
  "turbopackNftTracing",
] as const;

export type StaticExportBundlerCorrectnessCheckId =
  (typeof STATIC_EXPORT_BUNDLER_CORRECTNESS_CHECK_IDS)[number];

export type StaticExportBundlerCorrectnessCheckStatus =
  | "pass"
  | "fail"
  | "not-applicable";

export type StaticExportBundlerCorrectnessCheckResult = {
  id: StaticExportBundlerCorrectnessCheckId;
  status: StaticExportBundlerCorrectnessCheckStatus;
  reason: string;
};

/**
 * Observable inputs from one bundler export attempt. Callers gather filesystem
 * / consumer proofs separately; this module stays pure.
 */
export type StaticExportBundlerCorrectnessObservation = {
  bundler: StaticExportBundler;
  /** True when the Next export process exited 0. */
  exportCompleted: boolean;
  /** Combined stdout/stderr from the Next build (NFT warning scan). */
  buildOutput: string;
  /** True when `out/` (or equivalent) exists after the export. */
  hasExportOutDirectory: boolean;
  /**
   * True when project-site base-path / asset-prefix contracts hold for the
   * exported HTML (or the suite was run without a project-site base path and
   * root-site contracts hold).
   */
  basePathContractOk: boolean;
  /**
   * True when Orama/static search bootstrap under `out/api/search` (and client
   * bake when applicable) satisfies the project-site bootstrap path contract.
   */
  searchBootstrapOk: boolean;
  /** Optional clean-mode wall time for relative timing notes. */
  cleanWallTimeMs?: number;
};

export type StaticExportBundlerCorrectnessEvaluation = {
  bundler: StaticExportBundler;
  checks: readonly StaticExportBundlerCorrectnessCheckResult[];
  /** True when every required check passes (not-applicable is allowed). */
  fullyCompatible: boolean;
  cleanWallTimeMs?: number;
};

function evaluateExportCompletes(
  observation: StaticExportBundlerCorrectnessObservation,
): StaticExportBundlerCorrectnessCheckResult {
  if (observation.exportCompleted && observation.hasExportOutDirectory) {
    return {
      id: "exportCompletes",
      status: "pass",
      reason: "export-exit-0-and-out-present",
    };
  }
  if (!observation.exportCompleted) {
    return {
      id: "exportCompletes",
      status: "fail",
      reason: "export-did-not-complete",
    };
  }
  return {
    id: "exportCompletes",
    status: "fail",
    reason: "export-out-directory-missing",
  };
}

function evaluateBuildContractBasePath(
  observation: StaticExportBundlerCorrectnessObservation,
): StaticExportBundlerCorrectnessCheckResult {
  if (observation.basePathContractOk) {
    return {
      id: "buildContractBasePath",
      status: "pass",
      reason: "base-path-contract-ok",
    };
  }
  return {
    id: "buildContractBasePath",
    status: "fail",
    reason: "base-path-contract-failed",
  };
}

function evaluateSearchBootstrap(
  observation: StaticExportBundlerCorrectnessObservation,
): StaticExportBundlerCorrectnessCheckResult {
  if (observation.searchBootstrapOk) {
    return {
      id: "searchBootstrap",
      status: "pass",
      reason: "search-bootstrap-ok",
    };
  }
  return {
    id: "searchBootstrap",
    status: "fail",
    reason: "search-bootstrap-failed",
  };
}

function evaluateTurbopackNftTracing(
  observation: StaticExportBundlerCorrectnessObservation,
): StaticExportBundlerCorrectnessCheckResult {
  if (observation.bundler === "webpack") {
    return {
      id: "turbopackNftTracing",
      status: "not-applicable",
      reason: "webpack-bundler",
    };
  }

  if (
    buildOutputHasTurbopackWholeProjectTracingWarning(observation.buildOutput)
  ) {
    return {
      id: "turbopackNftTracing",
      status: "fail",
      reason: "turbopack-whole-project-nft-tracing-warning",
    };
  }

  return {
    id: "turbopackNftTracing",
    status: "pass",
    reason: "no-turbopack-whole-project-nft-tracing-warning",
  };
}

/**
 * Evaluates one bundler observation against the shared correctness suite.
 */
export function evaluateStaticExportBundlerCorrectness(
  observation: StaticExportBundlerCorrectnessObservation,
): StaticExportBundlerCorrectnessEvaluation {
  const checks: StaticExportBundlerCorrectnessCheckResult[] = [
    evaluateExportCompletes(observation),
    evaluateBuildContractBasePath(observation),
    evaluateSearchBootstrap(observation),
    evaluateTurbopackNftTracing(observation),
  ];

  const fullyCompatible = checks.every(
    (check) => check.status === "pass" || check.status === "not-applicable",
  );

  return {
    bundler: observation.bundler,
    checks,
    fullyCompatible,
    cleanWallTimeMs: observation.cleanWallTimeMs,
  };
}
