/**
 * Webpack vs Turbopack static-export bake-off: compare shared correctness
 * evaluations and decide whether the default bundler may switch.
 *
 * Turbopack becomes the recommended default only when it is fully compatible
 * with the shared suite (including NFT tracing). Otherwise webpack remains
 * default and comparison evidence is retained.
 */

import type { StaticExportBundler } from "@/lib/build/static-export-bundler";
import { DEFAULT_STATIC_EXPORT_BUNDLER } from "@/lib/build/static-export-bundler";
import type { StaticExportBundlerCorrectnessEvaluation } from "@/lib/build/static-export-bundler-correctness";

export type StaticExportBundlerComparisonInput = {
  webpack: StaticExportBundlerCorrectnessEvaluation;
  turbopack: StaticExportBundlerCorrectnessEvaluation;
};

export type StaticExportBundlerComparisonResult = {
  webpackFullyCompatible: boolean;
  turbopackFullyCompatible: boolean;
  /** Bundler that won on correctness (or webpack when Turbopack is incomplete). */
  correctnessWinner: StaticExportBundler;
  /**
   * Recommended default for `build:export` / `make build`. Turbopack only when
   * fully compatible; otherwise the locked webpack default.
   */
  recommendedDefault: StaticExportBundler;
  /** True only when Turbopack passed the full shared suite. */
  adoptTurbopackAsDefault: boolean;
  /** Relative clean timing when both reported wall times. */
  relativeCleanTiming:
    | {
        available: true;
        webpackCleanWallTimeMs: number;
        turbopackCleanWallTimeMs: number;
        fasterBundler: StaticExportBundler | "tie";
      }
    | { available: false; reason: string };
  summaryLines: readonly string[];
};

function resolveRelativeCleanTiming(
  webpack: StaticExportBundlerCorrectnessEvaluation,
  turbopack: StaticExportBundlerCorrectnessEvaluation,
): StaticExportBundlerComparisonResult["relativeCleanTiming"] {
  const webpackMs = webpack.cleanWallTimeMs;
  const turbopackMs = turbopack.cleanWallTimeMs;
  if (
    typeof webpackMs !== "number" ||
    typeof turbopackMs !== "number" ||
    !Number.isFinite(webpackMs) ||
    !Number.isFinite(turbopackMs)
  ) {
    return {
      available: false,
      reason: "clean-wall-time-missing-for-one-or-both-bundlers",
    };
  }

  let fasterBundler: StaticExportBundler | "tie" = "tie";
  if (turbopackMs < webpackMs) {
    fasterBundler = "turbopack";
  } else if (webpackMs < turbopackMs) {
    fasterBundler = "webpack";
  }

  return {
    available: true,
    webpackCleanWallTimeMs: webpackMs,
    turbopackCleanWallTimeMs: turbopackMs,
    fasterBundler,
  };
}

function formatCheckLine(
  bundler: StaticExportBundler,
  evaluation: StaticExportBundlerCorrectnessEvaluation,
): string[] {
  return evaluation.checks.map(
    (check) => `${bundler}.${check.id}=${check.status}:${check.reason}`,
  );
}

/**
 * Compares webpack and Turbopack evaluations from the same correctness suite.
 */
export function compareStaticExportBundlers(
  input: StaticExportBundlerComparisonInput,
): StaticExportBundlerComparisonResult {
  if (input.webpack.bundler !== "webpack") {
    throw new Error(
      `compareStaticExportBundlers expected webpack evaluation, got ${input.webpack.bundler}`,
    );
  }
  if (input.turbopack.bundler !== "turbopack") {
    throw new Error(
      `compareStaticExportBundlers expected turbopack evaluation, got ${input.turbopack.bundler}`,
    );
  }

  const webpackFullyCompatible = input.webpack.fullyCompatible;
  const turbopackFullyCompatible = input.turbopack.fullyCompatible;
  const adoptTurbopackAsDefault = turbopackFullyCompatible;
  const recommendedDefault: StaticExportBundler = adoptTurbopackAsDefault
    ? "turbopack"
    : DEFAULT_STATIC_EXPORT_BUNDLER;
  const correctnessWinner: StaticExportBundler = turbopackFullyCompatible
    ? "turbopack"
    : webpackFullyCompatible
      ? "webpack"
      : DEFAULT_STATIC_EXPORT_BUNDLER;

  const relativeCleanTiming = resolveRelativeCleanTiming(
    input.webpack,
    input.turbopack,
  );

  const summaryLines: string[] = [
    `webpackFullyCompatible=${webpackFullyCompatible}`,
    `turbopackFullyCompatible=${turbopackFullyCompatible}`,
    `correctnessWinner=${correctnessWinner}`,
    `recommendedDefault=${recommendedDefault}`,
    `adoptTurbopackAsDefault=${adoptTurbopackAsDefault}`,
    ...formatCheckLine("webpack", input.webpack),
    ...formatCheckLine("turbopack", input.turbopack),
  ];

  if (relativeCleanTiming.available) {
    summaryLines.push(
      `webpackCleanWallTimeMs=${relativeCleanTiming.webpackCleanWallTimeMs}`,
      `turbopackCleanWallTimeMs=${relativeCleanTiming.turbopackCleanWallTimeMs}`,
      `fasterCleanBundler=${relativeCleanTiming.fasterBundler}`,
    );
  } else {
    summaryLines.push(
      `relativeCleanTiming=not-available:${relativeCleanTiming.reason}`,
    );
  }

  return {
    webpackFullyCompatible,
    turbopackFullyCompatible,
    correctnessWinner,
    recommendedDefault,
    adoptTurbopackAsDefault,
    relativeCleanTiming,
    summaryLines,
  };
}

/**
 * True only when Turbopack is fully compatible — the sole condition for
 * switching `build:export` / `make build` off webpack.
 */
export function shouldAdoptTurbopackAsDefault(
  comparison: StaticExportBundlerComparisonResult,
): boolean {
  return comparison.adoptTurbopackAsDefault;
}
