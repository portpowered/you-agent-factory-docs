/**
 * Maintainer benchmark entrypoint for clean / warm profiled static export.
 *
 * Clean mode wipes `.next`, `out`, `.source`, and ignored generated outputs
 * (dependencies stay installed) before the measured run. Warm mode leaves
 * those artifacts in place for an unchanged repeat.
 *
 * Usage:
 *   bun run benchmark:static-export -- --mode=clean
 *   bun run benchmark:static-export -- --mode=warm
 *   make benchmark-static-export MODE=clean
 *   make benchmark-static-export MODE=warm
 *
 * Ordinary `make build` / `bun run build:export` do not use this script.
 */

import { runProfiledStaticExport } from "../src/lib/build/run-profiled-static-export";
import { prepareStaticExportBenchmark } from "../src/lib/build/static-export-benchmark-prep";
import {
  isStaticExportProfilingEnabled,
  PROFILE_STATIC_EXPORT_ENV,
  resolveStaticExportBenchmarkMode,
  STATIC_EXPORT_BENCHMARK_MODE_ENV,
  STATIC_EXPORT_BENCHMARK_MODES,
} from "../src/lib/build/static-export-profile";

function readCliMode(argv: readonly string[]): string | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode" || arg === "-m") {
      return argv[index + 1];
    }
    if (arg.startsWith("--mode=")) {
      return arg.slice("--mode=".length);
    }
  }
  return undefined;
}

function main(): void {
  if (!isStaticExportProfilingEnabled(process.env)) {
    console.error(
      `Profiling is opt-in. Set ${PROFILE_STATIC_EXPORT_ENV}=1 or use \`bun run benchmark:static-export\`.`,
    );
    process.exit(2);
  }

  const mode = resolveStaticExportBenchmarkMode(
    process.env,
    readCliMode(process.argv.slice(2)),
  );
  if (!mode) {
    console.error(
      `Benchmark mode is required. Pass --mode=clean|warm or set ${STATIC_EXPORT_BENCHMARK_MODE_ENV}=clean|warm. Supported: ${STATIC_EXPORT_BENCHMARK_MODES.join(", ")}.`,
    );
    process.exit(2);
  }

  const prep = prepareStaticExportBenchmark({
    cwd: process.cwd(),
    mode,
  });

  if (prep.mode === "clean") {
    console.error(
      `[static-export-benchmark] clean prep removed: ${prep.removedRelativePaths.join(", ")}`,
    );
  } else {
    console.error(
      "[static-export-benchmark] warm prep: left build artifacts in place",
    );
  }

  const result = runProfiledStaticExport({
    cwd: process.cwd(),
    env: process.env,
    mode,
  });

  if (!result.ok) {
    if (result.failedStageId) {
      console.error(
        `Profiled static export failed at stage "${result.failedStageId}" (status ${result.status ?? "null"}).`,
      );
    }
    if (result.stderr) {
      console.error(result.stderr);
    }
    process.exit(result.status ?? 1);
  }
}

main();
