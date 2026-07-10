import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type ProfiledStaticExportSpawn,
  runProfiledStaticExport,
} from "./run-profiled-static-export";
import {
  STATIC_EXPORT_PROFILE_STAGE_COMMANDS,
  type StaticExportProfileStageCommand,
} from "./static-export-profile";

const repoRoot = join(import.meta.dir, "../../..");

function stubStages(): readonly StaticExportProfileStageCommand[] {
  return STATIC_EXPORT_PROFILE_STAGE_COMMANDS.map((stage) => ({
    ...stage,
    argv: ["stub", stage.id] as const,
  }));
}

describe("runProfiledStaticExport", () => {
  test("records wall-time measurements for every required stage when profiling runs", () => {
    const spawnCalls: string[] = [];
    let nowMs = 0;
    const spawn: ProfiledStaticExportSpawn = (argv) => {
      spawnCalls.push(argv.join(" "));
      nowMs += 10;
      return { status: 0, signal: null, stdout: "", stderr: "" };
    };

    const result = runProfiledStaticExport({
      cwd: repoRoot,
      stages: stubStages(),
      spawn,
      clock: () => nowMs,
      printSummary: false,
    });

    expect(result.ok).toBe(true);
    expect(spawnCalls).toEqual([
      "stub contentRuntimePreparation",
      "stub fumadocsGeneration",
      "stub nextCompilationStaticRendering",
      "stub searchIndexEmission",
      "stub fingerprintWriting",
    ]);
    expect(result.timings.contentRuntimePreparation).toBe(10);
    expect(result.timings.fumadocsGeneration).toBe(10);
    expect(result.timings.nextCompilationStaticRendering).toBe(10);
    expect(result.timings.searchIndexEmission).toBe(10);
    expect(result.timings.fingerprintWriting).toBe(10);
    expect(result.timings.totalWallTimeMs).toBe(50);
    expect(result.mode).toBe("warm");
    expect(result.summary).toContain("mode=warm");
    expect(result.summary).toContain("contentRuntimePreparationMs=10");
    expect(result.summary).toContain("totalWallTimeMs=50");
  });

  test("includes the requested clean mode label in the timing summary", () => {
    let nowMs = 0;
    const spawn: ProfiledStaticExportSpawn = () => {
      nowMs += 1;
      return { status: 0, signal: null, stdout: "", stderr: "" };
    };

    const result = runProfiledStaticExport({
      cwd: repoRoot,
      mode: "clean",
      stages: stubStages(),
      spawn,
      clock: () => nowMs,
      printSummary: false,
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("clean");
    expect(result.summary).toContain("mode=clean");
  });

  test("stops at the first failing stage and still returns a timing summary", () => {
    let nowMs = 0;
    const spawn: ProfiledStaticExportSpawn = (argv) => {
      const stageId = argv[1];
      nowMs += 5;
      if (stageId === "fumadocsGeneration") {
        return {
          status: 7,
          signal: null,
          stdout: "",
          stderr: "fumadocs failed",
        };
      }
      return { status: 0, signal: null, stdout: "", stderr: "" };
    };

    const result = runProfiledStaticExport({
      cwd: repoRoot,
      stages: stubStages(),
      spawn,
      clock: () => nowMs,
      printSummary: false,
    });

    expect(result.ok).toBe(false);
    expect(result.failedStageId).toBe("fumadocsGeneration");
    expect(result.status).toBe(7);
    expect(result.timings.contentRuntimePreparation).toBe(5);
    expect(result.timings.fumadocsGeneration).toBe(5);
    expect(result.timings.nextCompilationStaticRendering).toBe(0);
    expect(result.timings.totalWallTimeMs).toBe(10);
    expect(result.summary).toContain("fumadocsGenerationMs=5");
  });

  test("ordinary build:export package script stays the uninstrumented chain", () => {
    const packageJson = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["build:export"]).toBe(
      "fumadocs-mdx && NEXT_STATIC_EXPORT=1 bun ./scripts/run-next.ts build --webpack && bun ./scripts/emit-export-search-index.ts && bun ./scripts/write-build-source-fingerprint.ts",
    );
    expect(packageJson.scripts["build:export"]).not.toContain(
      "run-profiled-static-export",
    );
    expect(packageJson.scripts["build:export:profile"]).toContain(
      "PROFILE_STATIC_EXPORT=1",
    );
    expect(packageJson.scripts["build:export:profile"]).toContain(
      "run-profiled-static-export-build.ts",
    );
    expect(packageJson.scripts["benchmark:static-export"]).toContain(
      "PROFILE_STATIC_EXPORT=1",
    );
    expect(packageJson.scripts["benchmark:static-export"]).toContain(
      "run-static-export-benchmark.ts",
    );
  });
});
