/**
 * Maintainer bake-off entrypoint: evaluate webpack and Turbopack against the
 * shared static-export correctness suite and print a stable comparison summary.
 *
 * Modes:
 * - Default: print the recorded bake-off decision (no full rebuild).
 * - `--live`: run both bundlers via `run-static-export-next-build.ts` (slow;
 *   captures stdout/stderr for NFT checks). Prefer a clean tree and set
 *   `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs` for project-site proofs.
 *
 * Does not change the locked `build:export` default; adoption requires updating
 * `static-export-bundler-bakeoff.ts` after a full-pass Turbopack result.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { gatherStaticExportBundlerCorrectnessObservation } from "@/lib/build/gather-static-export-bundler-observation";
import type { StaticExportBundler } from "@/lib/build/static-export-bundler";
import { STATIC_EXPORT_BUNDLER_ENV } from "@/lib/build/static-export-bundler";
import {
  recordedStaticExportBundlerComparison,
  resolveLockedStaticExportDefaultBundler,
} from "@/lib/build/static-export-bundler-bakeoff";
import { compareStaticExportBundlers } from "@/lib/build/static-export-bundler-comparison";
import { evaluateStaticExportBundlerCorrectness } from "@/lib/build/static-export-bundler-correctness";

const cwd = process.cwd();
const live = process.argv.includes("--live");
const nextBuildScript = resolve(
  import.meta.dir,
  "run-static-export-next-build.ts",
);

function runBundlerExport(bundler: StaticExportBundler): {
  exportCompleted: boolean;
  buildOutput: string;
  cleanWallTimeMs: number;
} {
  const started = performance.now();
  const result = spawnSync("bun", [nextBuildScript], {
    cwd,
    env: {
      ...process.env,
      [STATIC_EXPORT_BUNDLER_ENV]: bundler,
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH:
        process.env.GITHUB_PAGES_BASE_PATH ?? BUILT_APP_GITHUB_PAGES_BASE_PATH,
    },
    encoding: "utf8",
  });
  const cleanWallTimeMs = Math.max(0, performance.now() - started);
  const buildOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return {
    exportCompleted: result.status === 0,
    buildOutput,
    cleanWallTimeMs,
  };
}

function printComparison(
  label: string,
  lines: readonly string[],
  lockedDefault: string,
): void {
  console.log(`static-export-bundler-comparison=${label}`);
  for (const line of lines) {
    console.log(line);
  }
  console.log(`lockedDefaultBundler=${lockedDefault}`);
}

if (!live) {
  const comparison = recordedStaticExportBundlerComparison();
  printComparison(
    "recorded",
    comparison.summaryLines,
    resolveLockedStaticExportDefaultBundler(),
  );
  process.exit(0);
}

const webpackRun = runBundlerExport("webpack");
const webpackObservation = gatherStaticExportBundlerCorrectnessObservation({
  bundler: "webpack",
  exportCompleted: webpackRun.exportCompleted,
  buildOutput: webpackRun.buildOutput,
  cwd,
  cleanWallTimeMs: webpackRun.cleanWallTimeMs,
});

const turbopackRun = runBundlerExport("turbopack");
const turbopackObservation = gatherStaticExportBundlerCorrectnessObservation({
  bundler: "turbopack",
  exportCompleted: turbopackRun.exportCompleted,
  buildOutput: turbopackRun.buildOutput,
  cwd,
  cleanWallTimeMs: turbopackRun.cleanWallTimeMs,
});

const liveComparison = compareStaticExportBundlers({
  webpack: evaluateStaticExportBundlerCorrectness(webpackObservation),
  turbopack: evaluateStaticExportBundlerCorrectness(turbopackObservation),
});

printComparison(
  "live",
  liveComparison.summaryLines,
  resolveLockedStaticExportDefaultBundler(),
);

if (!liveComparison.webpackFullyCompatible) {
  process.exit(1);
}
process.exit(0);
