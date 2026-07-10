import { describe, expect, test } from "bun:test";
import { STATIC_EXPORT_BENCHMARK_CLEAN_DIRS } from "./static-export-benchmark-prep";
import {
  isNextCompilerCacheUsable,
  listNextCompilerCacheCleanRelativePaths,
  NEXT_COMPILER_CACHE_DIRECTORY,
  NEXT_COMPILER_CACHE_ROOT_DIR,
  shouldWipeNextCompilerCacheForBenchmarkMode,
} from "./static-export-compiler-cache";

describe("static-export-compiler-cache", () => {
  test("warm mode must not wipe the Next compiler cache", () => {
    expect(shouldWipeNextCompilerCacheForBenchmarkMode("warm")).toBe(false);
  });

  test("clean mode is the default wipe path for the Next compiler cache", () => {
    expect(shouldWipeNextCompilerCacheForBenchmarkMode("clean")).toBe(true);
  });

  test("clean prep dirs include the Next compiler cache root", () => {
    const cleanPaths = listNextCompilerCacheCleanRelativePaths();
    expect(cleanPaths).toContain(NEXT_COMPILER_CACHE_ROOT_DIR);
    for (const relativePath of cleanPaths) {
      expect(
        (STATIC_EXPORT_BENCHMARK_CLEAN_DIRS as readonly string[]).includes(
          relativePath,
        ),
      ).toBe(true);
    }
  });

  test("usable cache requires a non-empty .next/cache directory", () => {
    const present = new Set([`/repo/${NEXT_COMPILER_CACHE_DIRECTORY}`]);
    const directories = new Set([`/repo/${NEXT_COMPILER_CACHE_DIRECTORY}`]);
    const names = new Map<string, readonly string[]>([
      [`/repo/${NEXT_COMPILER_CACHE_DIRECTORY}`, ["webpack"]],
    ]);

    expect(
      isNextCompilerCacheUsable({
        cwd: "/repo",
        pathExists: (path) => present.has(path),
        isDirectory: (path) => directories.has(path),
        readDirectoryNames: (path) => names.get(path) ?? [],
      }),
    ).toBe(true);

    expect(
      isNextCompilerCacheUsable({
        cwd: "/repo",
        pathExists: (path) => present.has(path),
        isDirectory: (path) => directories.has(path),
        readDirectoryNames: () => [],
      }),
    ).toBe(false);

    expect(
      isNextCompilerCacheUsable({
        cwd: "/repo",
        pathExists: () => false,
        isDirectory: () => false,
        readDirectoryNames: () => [],
      }),
    ).toBe(false);
  });
});
