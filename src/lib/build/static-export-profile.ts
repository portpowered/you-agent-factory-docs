/**
 * Optional static-export stage timing contract.
 *
 * Profiling is off by default. Ordinary `make build` / `bun run build:export`
 * stay on the uninstrumented package.json chain. Opt in with
 * `PROFILE_STATIC_EXPORT=1` or the dedicated profiled / benchmark entrypoints.
 */

import { arch, cpus, platform } from "node:os";

export const PROFILE_STATIC_EXPORT_ENV = "PROFILE_STATIC_EXPORT";
export const STATIC_EXPORT_BENCHMARK_MODE_ENV = "STATIC_EXPORT_BENCHMARK_MODE";

export const STATIC_EXPORT_BENCHMARK_MODES = ["clean", "warm"] as const;

export type StaticExportBenchmarkMode =
  (typeof STATIC_EXPORT_BENCHMARK_MODES)[number];

export const STATIC_EXPORT_PROFILE_STAGE_IDS = [
  "contentRuntimePreparation",
  "fumadocsGeneration",
  "nextCompilationStaticRendering",
  "searchIndexEmission",
  "fingerprintWriting",
] as const;

export type StaticExportProfileStageId =
  (typeof STATIC_EXPORT_PROFILE_STAGE_IDS)[number];

export type StaticExportProfileStageTimingsMs = Record<
  StaticExportProfileStageId,
  number
>;

export type StaticExportProfileTimings = StaticExportProfileStageTimingsMs & {
  totalWallTimeMs: number;
};

export const STATIC_EXPORT_CACHE_STATUSES = [
  "hit",
  "miss",
  "not-applicable",
  "not-available",
] as const;

export type StaticExportCacheStatus =
  (typeof STATIC_EXPORT_CACHE_STATUSES)[number];

/** Per-stage cache diagnosis: status plus a short reason string. */
export type StaticExportCacheReason = {
  status: StaticExportCacheStatus;
  reason: string;
};

export type StaticExportProfileCacheReasons = Record<
  StaticExportProfileStageId,
  StaticExportCacheReason
>;

/**
 * Observable scale counts from the export. Missing diagnostics use
 * `available: false` with an explicit reason instead of omitting the field.
 */
export type StaticExportScaleCountValue =
  | { available: true; value: number }
  | { available: false; reason: string };

export type StaticExportProfileScaleCounts = {
  staticRouteCount: StaticExportScaleCountValue;
  localeCount: StaticExportScaleCountValue;
  majorBundleModuleCount: StaticExportScaleCountValue;
};

/**
 * Non-identifying runtime/machine metadata for comparing profile runs.
 * Intentionally excludes hostname, username, home path, and similar fields.
 */
export type StaticExportProfileMachineMetadata = {
  osFamily: string;
  cpuArchitecture: string;
  logicalCpuCount: number;
  runtimeName: string;
  runtimeVersion: string;
};

/**
 * Injectable OS/runtime probes so contract tests do not depend on the host.
 */
export type StaticExportMachineMetadataSource = {
  platform: () => NodeJS.Platform | string;
  arch: () => string;
  logicalCpuCount: () => number;
  /** Present when the process is Bun; omit or return undefined under Node. */
  bunVersion?: () => string | undefined;
  nodeVersion: () => string;
};

export type StaticExportProfileSummaryInput = {
  mode: StaticExportBenchmarkMode;
  timings: StaticExportProfileTimings;
  cacheReasons: StaticExportProfileCacheReasons;
  scaleCounts: StaticExportProfileScaleCounts;
  machineMetadata: StaticExportProfileMachineMetadata;
};

export type StaticExportProfileClock = () => number;

export type BuildModeEnv = Record<string, string | undefined>;

/** True only when `PROFILE_STATIC_EXPORT=1`. Default / unset / other values are off. */
export function isStaticExportProfilingEnabled(
  env: BuildModeEnv = process.env,
): boolean {
  return env[PROFILE_STATIC_EXPORT_ENV] === "1";
}

/**
 * Parses clean/warm benchmark mode from env. Returns null when unset or invalid
 * so callers can fall back to CLI flags or a documented default.
 */
export function parseStaticExportBenchmarkMode(
  value: string | undefined,
): StaticExportBenchmarkMode | null {
  if (value === "clean" || value === "warm") {
    return value;
  }
  return null;
}

export function resolveStaticExportBenchmarkMode(
  env: BuildModeEnv = process.env,
  cliMode?: string,
): StaticExportBenchmarkMode | null {
  const fromCli = parseStaticExportBenchmarkMode(cliMode);
  if (fromCli) {
    return fromCli;
  }
  return parseStaticExportBenchmarkMode(env[STATIC_EXPORT_BENCHMARK_MODE_ENV]);
}

export function createEmptyStageTimingsMs(): StaticExportProfileStageTimingsMs {
  return {
    contentRuntimePreparation: 0,
    fumadocsGeneration: 0,
    nextCompilationStaticRendering: 0,
    searchIndexEmission: 0,
    fingerprintWriting: 0,
  };
}

export function finalizeProfileTimings(
  stageTimingsMs: StaticExportProfileStageTimingsMs,
  totalWallTimeMs: number,
): StaticExportProfileTimings {
  return {
    ...stageTimingsMs,
    totalWallTimeMs,
  };
}

export function formatCacheReason(reason: StaticExportCacheReason): string {
  return `${reason.status}:${reason.reason}`;
}

export function formatScaleCountValue(
  value: StaticExportScaleCountValue,
): string {
  if (value.available) {
    return String(value.value);
  }
  return `not-available:${value.reason}`;
}

export function createNotAvailableScaleCounts(
  reason: string,
): StaticExportProfileScaleCounts {
  return {
    staticRouteCount: { available: false, reason },
    localeCount: { available: false, reason },
    majorBundleModuleCount: { available: false, reason },
  };
}

export function createNotAvailableCacheReasons(
  reason: string,
): StaticExportProfileCacheReasons {
  const entry: StaticExportCacheReason = {
    status: "not-available",
    reason,
  };
  return {
    contentRuntimePreparation: entry,
    fumadocsGeneration: entry,
    nextCompilationStaticRendering: entry,
    searchIndexEmission: entry,
    fingerprintWriting: entry,
  };
}

function defaultMachineMetadataSource(): StaticExportMachineMetadataSource {
  return {
    platform: () => platform(),
    arch: () => arch(),
    logicalCpuCount: () => cpus().length,
    bunVersion: () => process.versions.bun,
    nodeVersion: () => process.versions.node,
  };
}

/**
 * Collects non-identifying OS/runtime metadata for the timing summary.
 * Prefers Bun when `process.versions.bun` is present because the supported
 * static-export path runs under Bun.
 */
export function collectStaticExportMachineMetadata(
  source: StaticExportMachineMetadataSource = defaultMachineMetadataSource(),
): StaticExportProfileMachineMetadata {
  const bunVersion = source.bunVersion?.();
  if (bunVersion) {
    return {
      osFamily: String(source.platform()),
      cpuArchitecture: source.arch(),
      logicalCpuCount: source.logicalCpuCount(),
      runtimeName: "bun",
      runtimeVersion: bunVersion,
    };
  }

  return {
    osFamily: String(source.platform()),
    cpuArchitecture: source.arch(),
    logicalCpuCount: source.logicalCpuCount(),
    runtimeName: "node",
    runtimeVersion: source.nodeVersion(),
  };
}

export function formatMachineMetadataLines(
  metadata: StaticExportProfileMachineMetadata,
): string[] {
  return [
    `osFamily=${metadata.osFamily}`,
    `cpuArchitecture=${metadata.cpuArchitecture}`,
    `logicalCpuCount=${metadata.logicalCpuCount}`,
    `runtimeName=${metadata.runtimeName}`,
    `runtimeVersion=${metadata.runtimeVersion}`,
  ];
}

/**
 * Measures wall time for a synchronous stage body. Uses an injectable clock so
 * tests can stub time without sleeping.
 */
export function measureWallTimeMs(
  run: () => void,
  clock: StaticExportProfileClock = () => performance.now(),
): number {
  const startedAt = clock();
  run();
  return Math.max(0, clock() - startedAt);
}

/**
 * Stable key order for timing summaries: mode, stage timings, total, cache
 * reasons, scale counts, then non-identifying machine metadata.
 */
export function formatStageTimingSummaryLines(
  input: StaticExportProfileSummaryInput,
): string[] {
  const { mode, timings, cacheReasons, scaleCounts, machineMetadata } = input;
  return [
    `mode=${mode}`,
    `contentRuntimePreparationMs=${timings.contentRuntimePreparation}`,
    `fumadocsGenerationMs=${timings.fumadocsGeneration}`,
    `nextCompilationStaticRenderingMs=${timings.nextCompilationStaticRendering}`,
    `searchIndexEmissionMs=${timings.searchIndexEmission}`,
    `fingerprintWritingMs=${timings.fingerprintWriting}`,
    `totalWallTimeMs=${timings.totalWallTimeMs}`,
    `contentRuntimePreparationCache=${formatCacheReason(cacheReasons.contentRuntimePreparation)}`,
    `fumadocsGenerationCache=${formatCacheReason(cacheReasons.fumadocsGeneration)}`,
    `nextCompilationStaticRenderingCache=${formatCacheReason(cacheReasons.nextCompilationStaticRendering)}`,
    `searchIndexEmissionCache=${formatCacheReason(cacheReasons.searchIndexEmission)}`,
    `fingerprintWritingCache=${formatCacheReason(cacheReasons.fingerprintWriting)}`,
    `staticRouteCount=${formatScaleCountValue(scaleCounts.staticRouteCount)}`,
    `localeCount=${formatScaleCountValue(scaleCounts.localeCount)}`,
    `majorBundleModuleCount=${formatScaleCountValue(scaleCounts.majorBundleModuleCount)}`,
    ...formatMachineMetadataLines(machineMetadata),
  ];
}

export function formatStageTimingSummary(
  input: StaticExportProfileSummaryInput,
): string {
  return [
    "static-export-profile",
    ...formatStageTimingSummaryLines(input),
  ].join("\n");
}

/**
 * Stage commands that mirror the supported static-export pipeline:
 * prepare:content-runtime → fumadocs-mdx → NEXT_STATIC_EXPORT next build →
 * emit-export-search-index → write-build-source-fingerprint.
 *
 * The profiled runner invokes these as discrete timed stages instead of the
 * shell `&&` chain in package.json `build:export` (plus npm `prebuild:export`).
 */
export type StaticExportProfileStageCommand = {
  id: StaticExportProfileStageId;
  argv: readonly [string, ...string[]];
  /** Extra env merged for this stage only (e.g. NEXT_STATIC_EXPORT=1). */
  env?: Readonly<Record<string, string>>;
};

export const STATIC_EXPORT_PROFILE_STAGE_COMMANDS: readonly StaticExportProfileStageCommand[] =
  [
    {
      id: "contentRuntimePreparation",
      argv: ["bun", "run", "prepare:content-runtime"],
    },
    {
      id: "fumadocsGeneration",
      argv: ["bunx", "fumadocs-mdx"],
    },
    {
      id: "nextCompilationStaticRendering",
      argv: ["bun", "./scripts/run-next.ts", "build", "--webpack"],
      env: { NEXT_STATIC_EXPORT: "1" },
    },
    {
      id: "searchIndexEmission",
      argv: ["bun", "./scripts/emit-export-search-index.ts"],
    },
    {
      id: "fingerprintWriting",
      argv: ["bun", "./scripts/write-build-source-fingerprint.ts"],
    },
  ];
