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
  const stubCacheReasons = {
    contentRuntimePreparation: {
      status: "hit" as const,
      reason: "fingerprint-store-and-outputs-present",
    },
    fumadocsGeneration: {
      status: "miss" as const,
      reason: "immutable-snapshot-store-or-source-absent",
    },
    nextCompilationStaticRendering: {
      status: "miss" as const,
      reason: "next-compiler-cache-absent",
    },
    searchIndexEmission: {
      status: "not-applicable" as const,
      reason: "always-regenerates-from-export",
    },
    fingerprintWriting: {
      status: "not-applicable" as const,
      reason: "always-writes-fingerprint",
    },
  };

  const stubScaleCounts = {
    staticRouteCount: { available: true as const, value: 3 },
    localeCount: { available: true as const, value: 2 },
    majorBundleModuleCount: { available: true as const, value: 4 },
  };

  const stubMachineMetadata = {
    osFamily: "darwin",
    cpuArchitecture: "arm64",
    logicalCpuCount: 10,
    runtimeName: "bun",
    runtimeVersion: "1.3.13",
  };

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
      cacheReasons: stubCacheReasons,
      scaleCounts: stubScaleCounts,
      machineMetadata: stubMachineMetadata,
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
    expect(result.summary).toContain(
      "nextCompilationStaticRenderingCache=miss:next-compiler-cache-absent",
    );
    expect(result.summary).toContain("staticRouteCount=3");
    expect(result.summary).toContain("localeCount=2");
    expect(result.summary).toContain("majorBundleModuleCount=4");
    expect(result.summary).toContain("osFamily=darwin");
    expect(result.summary).toContain("cpuArchitecture=arm64");
    expect(result.summary).toContain("logicalCpuCount=10");
    expect(result.summary).toContain("runtimeName=bun");
    expect(result.summary).toContain("runtimeVersion=1.3.13");
    expect(result.machineMetadata).toEqual(stubMachineMetadata);
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
      cacheReasons: stubCacheReasons,
      scaleCounts: stubScaleCounts,
      machineMetadata: stubMachineMetadata,
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("clean");
    expect(result.summary).toContain("mode=clean");
  });

  test("keeps printing cache and scale fields when optional diagnostics are unavailable", () => {
    let nowMs = 0;
    const spawn: ProfiledStaticExportSpawn = () => {
      nowMs += 1;
      return { status: 0, signal: null, stdout: "", stderr: "" };
    };

    const result = runProfiledStaticExport({
      cwd: repoRoot,
      stages: stubStages(),
      spawn,
      clock: () => nowMs,
      printSummary: false,
      cacheReasons: {
        contentRuntimePreparation: {
          status: "not-available",
          reason: "cache-diagnostics-failed",
        },
        fumadocsGeneration: {
          status: "not-available",
          reason: "cache-diagnostics-failed",
        },
        nextCompilationStaticRendering: {
          status: "not-available",
          reason: "cache-diagnostics-failed",
        },
        searchIndexEmission: {
          status: "not-available",
          reason: "cache-diagnostics-failed",
        },
        fingerprintWriting: {
          status: "not-available",
          reason: "cache-diagnostics-failed",
        },
      },
      scaleCounts: {
        staticRouteCount: {
          available: false,
          reason: "export-out-missing",
        },
        localeCount: { available: false, reason: "export-out-missing" },
        majorBundleModuleCount: {
          available: false,
          reason: "chunks-directory-missing",
        },
      },
      machineMetadata: stubMachineMetadata,
    });

    expect(result.ok).toBe(true);
    expect(result.summary).toContain(
      "fumadocsGenerationCache=not-available:cache-diagnostics-failed",
    );
    expect(result.summary).toContain(
      "staticRouteCount=not-available:export-out-missing",
    );
    expect(result.summary).toContain(
      "majorBundleModuleCount=not-available:chunks-directory-missing",
    );
    expect(result.summary).toContain("runtimeName=bun");
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
      cacheReasons: stubCacheReasons,
      scaleCounts: stubScaleCounts,
      machineMetadata: stubMachineMetadata,
    });

    expect(result.ok).toBe(false);
    expect(result.failedStageId).toBe("fumadocsGeneration");
    expect(result.status).toBe(7);
    expect(result.timings.contentRuntimePreparation).toBe(5);
    expect(result.timings.fumadocsGeneration).toBe(5);
    expect(result.timings.nextCompilationStaticRendering).toBe(0);
    expect(result.timings.totalWallTimeMs).toBe(10);
    expect(result.summary).toContain("fumadocsGenerationMs=5");
    expect(result.summary).toContain("staticRouteCount=3");
    expect(result.summary).toContain("osFamily=darwin");
  });

  test("ordinary build:export package script stays the uninstrumented chain", () => {
    // Observable default-off contract: the supported export path must not
    // invoke the profiled runner. Do not inventory opt-in script registration.
    const packageJson = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["build:export"]).toBe(
      "bun ./scripts/ensure-static-export-immutable-snapshot.ts && bun ./scripts/run-static-export-next-build.ts && bun ./scripts/emit-export-search-index.ts && bun ./scripts/write-build-source-fingerprint.ts",
    );
    expect(packageJson.scripts["build:export"]).not.toContain(
      "run-profiled-static-export",
    );
    expect(packageJson.scripts["build:export"]).not.toContain(
      "PROFILE_STATIC_EXPORT",
    );
    expect(packageJson.scripts["build:export"]).not.toContain(
      "run-static-export-benchmark",
    );
  });
});
