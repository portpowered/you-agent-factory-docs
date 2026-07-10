import { describe, expect, test } from "bun:test";
import {
  collectStaticExportMachineMetadata,
  createEmptyStageTimingsMs,
  createNotAvailableCacheReasons,
  createNotAvailableScaleCounts,
  finalizeProfileTimings,
  formatCacheReason,
  formatScaleCountValue,
  formatStageTimingSummary,
  isStaticExportProfilingEnabled,
  measureWallTimeMs,
  PROFILE_STATIC_EXPORT_ENV,
  resolveStaticExportBenchmarkMode,
  STATIC_EXPORT_BENCHMARK_MODE_ENV,
  STATIC_EXPORT_PROFILE_STAGE_COMMANDS,
  STATIC_EXPORT_PROFILE_STAGE_IDS,
} from "./static-export-profile";

const fixtureCacheReasons = {
  contentRuntimePreparation: {
    status: "not-applicable" as const,
    reason: "no-incremental-cache",
  },
  fumadocsGeneration: {
    status: "miss" as const,
    reason: "source-directory-absent",
  },
  nextCompilationStaticRendering: {
    status: "miss" as const,
    reason: "next-cache-directory-absent",
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

const fixtureScaleCounts = {
  staticRouteCount: { available: true as const, value: 12 },
  localeCount: { available: true as const, value: 4 },
  majorBundleModuleCount: { available: true as const, value: 9 },
};

const fixtureMachineMetadata = {
  osFamily: "darwin",
  cpuArchitecture: "arm64",
  logicalCpuCount: 10,
  runtimeName: "bun",
  runtimeVersion: "1.3.13",
};

describe("static-export-profile", () => {
  test("profiling defaults off for ordinary builds", () => {
    expect(isStaticExportProfilingEnabled({})).toBe(false);
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "" }),
    ).toBe(false);
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "0" }),
    ).toBe(false);
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "true" }),
    ).toBe(false);
  });

  test("profiling enables only with PROFILE_STATIC_EXPORT=1", () => {
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "1" }),
    ).toBe(true);
  });

  test("stage command list covers the required timed stages in pipeline order", () => {
    expect(
      STATIC_EXPORT_PROFILE_STAGE_COMMANDS.map((stage) => stage.id),
    ).toEqual([...STATIC_EXPORT_PROFILE_STAGE_IDS]);

    const nextStage = STATIC_EXPORT_PROFILE_STAGE_COMMANDS.find(
      (stage) => stage.id === "nextCompilationStaticRendering",
    );
    expect(nextStage?.env?.NEXT_STATIC_EXPORT).toBe("1");
  });

  test("measureWallTimeMs records injectable clock deltas", () => {
    const readings = [100, 140];
    let index = 0;
    const clock = () => {
      const value = readings[index] ?? readings[readings.length - 1];
      index += 1;
      return value;
    };

    const elapsed = measureWallTimeMs(() => {
      // no-op stage body
    }, clock);

    expect(elapsed).toBe(40);
  });

  test("timing summary includes mode, stage timings, cache reasons, scale counts, and machine metadata", () => {
    const timings = finalizeProfileTimings(
      {
        ...createEmptyStageTimingsMs(),
        contentRuntimePreparation: 11,
        fumadocsGeneration: 22,
        nextCompilationStaticRendering: 33,
        searchIndexEmission: 44,
        fingerprintWriting: 55,
      },
      165,
    );

    const summary = formatStageTimingSummary({
      mode: "clean",
      timings,
      cacheReasons: fixtureCacheReasons,
      scaleCounts: fixtureScaleCounts,
      machineMetadata: fixtureMachineMetadata,
    });

    expect(summary).toContain("static-export-profile");
    expect(summary).toContain("mode=clean");
    expect(summary).toContain("contentRuntimePreparationMs=11");
    expect(summary).toContain("fumadocsGenerationMs=22");
    expect(summary).toContain("nextCompilationStaticRenderingMs=33");
    expect(summary).toContain("searchIndexEmissionMs=44");
    expect(summary).toContain("fingerprintWritingMs=55");
    expect(summary).toContain("totalWallTimeMs=165");
    expect(summary).toContain(
      "contentRuntimePreparationCache=not-applicable:no-incremental-cache",
    );
    expect(summary).toContain(
      "fumadocsGenerationCache=miss:source-directory-absent",
    );
    expect(summary).toContain(
      "nextCompilationStaticRenderingCache=miss:next-cache-directory-absent",
    );
    expect(summary).toContain(
      "searchIndexEmissionCache=not-applicable:always-regenerates-from-export",
    );
    expect(summary).toContain(
      "fingerprintWritingCache=not-applicable:always-writes-fingerprint",
    );
    expect(summary).toContain("staticRouteCount=12");
    expect(summary).toContain("localeCount=4");
    expect(summary).toContain("majorBundleModuleCount=9");
    expect(summary).toContain("osFamily=darwin");
    expect(summary).toContain("cpuArchitecture=arm64");
    expect(summary).toContain("logicalCpuCount=10");
    expect(summary).toContain("runtimeName=bun");
    expect(summary).toContain("runtimeVersion=1.3.13");
    expect(summary).not.toContain("hostname=");
    expect(summary).not.toContain("username=");
    expect(summary).not.toContain("home=");
  });

  test("collectStaticExportMachineMetadata prefers Bun and stays non-identifying", () => {
    const metadata = collectStaticExportMachineMetadata({
      platform: () => "linux",
      arch: () => "x64",
      logicalCpuCount: () => 8,
      bunVersion: () => "1.2.0",
      nodeVersion: () => "22.0.0",
    });

    expect(metadata).toEqual({
      osFamily: "linux",
      cpuArchitecture: "x64",
      logicalCpuCount: 8,
      runtimeName: "bun",
      runtimeVersion: "1.2.0",
    });

    const nodeOnly = collectStaticExportMachineMetadata({
      platform: () => "darwin",
      arch: () => "arm64",
      logicalCpuCount: () => 4,
      bunVersion: () => undefined,
      nodeVersion: () => "22.18.0",
    });

    expect(nodeOnly.runtimeName).toBe("node");
    expect(nodeOnly.runtimeVersion).toBe("22.18.0");
    expect(Object.keys(nodeOnly).sort()).toEqual([
      "cpuArchitecture",
      "logicalCpuCount",
      "osFamily",
      "runtimeName",
      "runtimeVersion",
    ]);
  });

  test("missing optional diagnostics format as not-available reasons", () => {
    expect(
      formatCacheReason({
        status: "not-available",
        reason: "cache-diagnostics-failed",
      }),
    ).toBe("not-available:cache-diagnostics-failed");
    expect(
      formatScaleCountValue({
        available: false,
        reason: "export-out-missing",
      }),
    ).toBe("not-available:export-out-missing");

    const summary = formatStageTimingSummary({
      mode: "warm",
      timings: finalizeProfileTimings(createEmptyStageTimingsMs(), 0),
      cacheReasons: createNotAvailableCacheReasons("cache-diagnostics-failed"),
      scaleCounts: createNotAvailableScaleCounts("export-out-missing"),
      machineMetadata: fixtureMachineMetadata,
    });

    expect(summary).toContain(
      "nextCompilationStaticRenderingCache=not-available:cache-diagnostics-failed",
    );
    expect(summary).toContain(
      "staticRouteCount=not-available:export-out-missing",
    );
    expect(summary).toContain("localeCount=not-available:export-out-missing");
    expect(summary).toContain(
      "majorBundleModuleCount=not-available:export-out-missing",
    );
    expect(summary).toContain("runtimeName=bun");
  });

  test("resolveStaticExportBenchmarkMode prefers CLI over env", () => {
    expect(
      resolveStaticExportBenchmarkMode(
        { [STATIC_EXPORT_BENCHMARK_MODE_ENV]: "warm" },
        "clean",
      ),
    ).toBe("clean");
    expect(
      resolveStaticExportBenchmarkMode({
        [STATIC_EXPORT_BENCHMARK_MODE_ENV]: "warm",
      }),
    ).toBe("warm");
    expect(resolveStaticExportBenchmarkMode({})).toBeNull();
    expect(resolveStaticExportBenchmarkMode({}, "nope")).toBeNull();
  });
});
