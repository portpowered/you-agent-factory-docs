/**
 * Next/compiler cache policy for static-export warm vs clean builds.
 *
 * Warm / ordinary `build:export` preserve a valid `.next` (and `.next/cache`)
 * so Next can reuse webpack/compiler artifacts. Only the explicit clean
 * benchmark prep path wipes those artifacts for a true cold measurement.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { StaticExportBenchmarkMode } from "@/lib/build/static-export-profile";

/** Top-level Next build directory (includes compiler cache under `cache/`). */
export const NEXT_COMPILER_CACHE_ROOT_DIR = ".next";

/** Persistent Next/webpack compiler cache directory. */
export const NEXT_COMPILER_CACHE_DIRECTORY = ".next/cache";

export type PathExistsFn = (path: string) => boolean;
export type ReadDirectoryNamesFn = (path: string) => readonly string[];
export type IsDirectoryFn = (path: string) => boolean;

export type NextCompilerCacheUsabilityOptions = {
  cwd: string;
  pathExists?: PathExistsFn;
  readDirectoryNames?: ReadDirectoryNamesFn;
  isDirectory?: IsDirectoryFn;
};

function defaultReadDirectoryNames(path: string): readonly string[] {
  return readdirSync(path);
}

function defaultIsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * True when `.next/cache` exists as a non-empty directory — the observable
 * signal that a prior Next build left reusable compiler artifacts.
 */
export function isNextCompilerCacheUsable(
  options: NextCompilerCacheUsabilityOptions,
): boolean {
  const pathExists = options.pathExists ?? existsSync;
  const readDirectoryNames =
    options.readDirectoryNames ?? defaultReadDirectoryNames;
  const isDirectory = options.isDirectory ?? defaultIsDirectory;
  const cachePath = join(options.cwd, NEXT_COMPILER_CACHE_DIRECTORY);

  if (!pathExists(cachePath) || !isDirectory(cachePath)) {
    return false;
  }

  try {
    return readDirectoryNames(cachePath).length > 0;
  } catch {
    return false;
  }
}

/**
 * Only clean benchmark prep may wipe the Next compiler cache by default.
 * Warm mode and ordinary `build:export` must leave a valid cache in place.
 */
export function shouldWipeNextCompilerCacheForBenchmarkMode(
  mode: StaticExportBenchmarkMode,
): boolean {
  return mode === "clean";
}

/**
 * Relative paths the clean benchmark prep removes that cover the Next
 * compiler cache. Warm prep must not remove any of these.
 */
export function listNextCompilerCacheCleanRelativePaths(): readonly string[] {
  return [NEXT_COMPILER_CACHE_ROOT_DIR];
}
