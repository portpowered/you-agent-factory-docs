/**
 * Clean / warm prep for the local static-export benchmark.
 *
 * Clean: dependencies stay installed; wipe build/export caches and ignored
 * generated outputs before the measured profiled export (including the Next
 * compiler cache under `.next`).
 * Warm: leave those artifacts in place (unchanged repeat) so a valid
 * `.next/cache` can be reused by the next compilation stage.
 */

import { rmSync } from "node:fs";
import { join } from "node:path";
import {
  NEXT_COMPILER_CACHE_ROOT_DIR,
  shouldWipeNextCompilerCacheForBenchmarkMode,
} from "@/lib/build/static-export-compiler-cache";
import type { StaticExportBenchmarkMode } from "@/lib/build/static-export-profile";
import { CONTENT_RUNTIME_PREPARATION_STEPS } from "@/lib/content/content-runtime-preparation";

/** Directory artifacts removed in clean mode (relative to repo root). */
export const STATIC_EXPORT_BENCHMARK_CLEAN_DIRS = [
  NEXT_COMPILER_CACHE_ROOT_DIR,
  "out",
  ".source",
  "src/generated",
] as const;

/**
 * Ignored generated runtime files removed in clean mode. Mirrors content-runtime
 * steps classified as git-ignored (not committed generated helpers).
 */
export function listStaticExportBenchmarkIgnoredGeneratedOutputs(): readonly string[] {
  return CONTENT_RUNTIME_PREPARATION_STEPS.filter(
    (step) => step.gitClassification === "ignored",
  ).map((step) => step.outputPath);
}

export type RemoveDirectoryFn = (
  path: string,
  options: { force: boolean; recursive: boolean },
) => void;

export type RemoveFileFn = (path: string, options: { force: boolean }) => void;

export type PrepareStaticExportBenchmarkOptions = {
  cwd: string;
  mode: StaticExportBenchmarkMode;
  removeDirectory?: RemoveDirectoryFn;
  removeFile?: RemoveFileFn;
};

export type PrepareStaticExportBenchmarkResult = {
  mode: StaticExportBenchmarkMode;
  /** Relative paths that clean mode attempted to remove. Empty for warm. */
  removedRelativePaths: readonly string[];
};

/**
 * Prepares the workspace for a clean or warm profiled static-export benchmark.
 * Does not touch `node_modules` or reinstall dependencies.
 */
export function prepareStaticExportBenchmark(
  options: PrepareStaticExportBenchmarkOptions,
): PrepareStaticExportBenchmarkResult {
  // Warm / ordinary export must preserve a valid Next compiler cache.
  if (!shouldWipeNextCompilerCacheForBenchmarkMode(options.mode)) {
    return {
      mode: "warm",
      removedRelativePaths: [],
    };
  }

  const removeDirectory = options.removeDirectory ?? rmSync;
  const removeFile = options.removeFile ?? rmSync;
  const removedRelativePaths: string[] = [];

  for (const relativeDir of STATIC_EXPORT_BENCHMARK_CLEAN_DIRS) {
    removeDirectory(join(options.cwd, relativeDir), {
      force: true,
      recursive: true,
    });
    removedRelativePaths.push(relativeDir);
  }

  for (const relativeFile of listStaticExportBenchmarkIgnoredGeneratedOutputs()) {
    removeFile(join(options.cwd, relativeFile), { force: true });
    removedRelativePaths.push(relativeFile);
  }

  return {
    mode: "clean",
    removedRelativePaths,
  };
}
