import { describe, expect, test } from "bun:test";
import {
  listStaticExportBenchmarkIgnoredGeneratedOutputs,
  prepareStaticExportBenchmark,
  STATIC_EXPORT_BENCHMARK_CLEAN_DIRS,
} from "./static-export-benchmark-prep";

describe("static-export-benchmark-prep", () => {
  test("clean mode removes .next, out, .source, and ignored generated outputs", () => {
    const removedDirs: string[] = [];
    const removedFiles: string[] = [];

    const result = prepareStaticExportBenchmark({
      cwd: "/repo",
      mode: "clean",
      removeDirectory: (path) => {
        removedDirs.push(path);
      },
      removeFile: (path) => {
        removedFiles.push(path);
      },
    });

    expect(result.mode).toBe("clean");
    expect(removedDirs).toEqual(
      STATIC_EXPORT_BENCHMARK_CLEAN_DIRS.map((dir) => `/repo/${dir}`),
    );
    expect(removedFiles).toEqual(
      listStaticExportBenchmarkIgnoredGeneratedOutputs().map(
        (file) => `/repo/${file}`,
      ),
    );
    expect(result.removedRelativePaths).toEqual([
      ...STATIC_EXPORT_BENCHMARK_CLEAN_DIRS,
      ...listStaticExportBenchmarkIgnoredGeneratedOutputs(),
    ]);
    expect(result.removedRelativePaths).toContain(".next");
    expect(result.removedRelativePaths).toContain("out");
    expect(result.removedRelativePaths).toContain(".source");
    expect(result.removedRelativePaths).toContain(
      "src/lib/content/generated/registry-runtime.generated.ts",
    );
    expect(result.removedRelativePaths).not.toContain("node_modules");
  });

  test("warm mode does not wipe build artifacts or the Next compiler cache", () => {
    let removeDirectoryCalls = 0;
    let removeFileCalls = 0;

    const result = prepareStaticExportBenchmark({
      cwd: "/repo",
      mode: "warm",
      removeDirectory: () => {
        removeDirectoryCalls += 1;
      },
      removeFile: () => {
        removeFileCalls += 1;
      },
    });

    expect(result.mode).toBe("warm");
    expect(result.removedRelativePaths).toEqual([]);
    expect(removeDirectoryCalls).toBe(0);
    expect(removeFileCalls).toBe(0);
  });

  test("clean mode is the only prep path that removes .next compiler cache", () => {
    expect(STATIC_EXPORT_BENCHMARK_CLEAN_DIRS).toContain(".next");

    const warm = prepareStaticExportBenchmark({
      cwd: "/repo",
      mode: "warm",
      removeDirectory: () => {
        throw new Error("warm must not remove directories");
      },
      removeFile: () => {
        throw new Error("warm must not remove files");
      },
    });
    expect(warm.removedRelativePaths).toEqual([]);

    const removedDirs: string[] = [];
    const clean = prepareStaticExportBenchmark({
      cwd: "/repo",
      mode: "clean",
      removeDirectory: (path) => {
        removedDirs.push(path);
      },
      removeFile: () => {},
    });
    expect(clean.removedRelativePaths).toContain(".next");
    expect(removedDirs).toContain("/repo/.next");
  });
});
