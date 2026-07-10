/**
 * Optional static-export stage timing contract.
 *
 * Profiling is off by default. Ordinary `make build` / `bun run build:export`
 * stay on the uninstrumented package.json chain. Opt in with
 * `PROFILE_STATIC_EXPORT=1` or the dedicated profiled / benchmark entrypoints.
 */

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

export type StaticExportProfileSummaryInput = {
  mode: StaticExportBenchmarkMode;
  timings: StaticExportProfileTimings;
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
 * Stable key order for timing summaries. Later stories extend this shape with
 * cache reasons, scale counts, and machine metadata.
 */
export function formatStageTimingSummaryLines(
  input: StaticExportProfileSummaryInput,
): string[] {
  const { mode, timings } = input;
  return [
    `mode=${mode}`,
    `contentRuntimePreparationMs=${timings.contentRuntimePreparation}`,
    `fumadocsGenerationMs=${timings.fumadocsGeneration}`,
    `nextCompilationStaticRenderingMs=${timings.nextCompilationStaticRendering}`,
    `searchIndexEmissionMs=${timings.searchIndexEmission}`,
    `fingerprintWritingMs=${timings.fingerprintWriting}`,
    `totalWallTimeMs=${timings.totalWallTimeMs}`,
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
