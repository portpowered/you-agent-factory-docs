import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import {
  createEmptyStageTimingsMs,
  finalizeProfileTimings,
  formatStageTimingSummary,
  measureWallTimeMs,
  STATIC_EXPORT_PROFILE_STAGE_COMMANDS,
  type StaticExportProfileClock,
  type StaticExportProfileStageCommand,
  type StaticExportProfileStageId,
  type StaticExportProfileTimings,
} from "@/lib/build/static-export-profile";

export type ProfiledStaticExportSpawnResult = Pick<
  SpawnSyncReturns<string>,
  "status" | "signal" | "error" | "stdout" | "stderr"
>;

export type ProfiledStaticExportSpawn = (
  argv: readonly [string, ...string[]],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
  },
) => ProfiledStaticExportSpawnResult;

export type RunProfiledStaticExportOptions = {
  cwd: string;
  env?: Record<string, string | undefined>;
  /** Injectable stage list for tests; defaults to the production stage commands. */
  stages?: readonly StaticExportProfileStageCommand[];
  spawn?: ProfiledStaticExportSpawn;
  clock?: StaticExportProfileClock;
  /** When false, skip printing the timing summary (tests). Default true. */
  printSummary?: boolean;
  log?: (message: string) => void;
};

export type RunProfiledStaticExportResult = {
  ok: boolean;
  status: number | null;
  failedStageId: StaticExportProfileStageId | null;
  timings: StaticExportProfileTimings;
  summary: string;
  stdout: string;
  stderr: string;
};

function defaultSpawn(
  argv: readonly [string, ...string[]],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
  },
): ProfiledStaticExportSpawnResult {
  const [command, ...args] = argv;
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
  });
}

function mergeEnv(
  base: Record<string, string | undefined>,
  stageEnv: Readonly<Record<string, string>> | undefined,
): NodeJS.ProcessEnv {
  const merged: Record<string, string | undefined> = { ...base };
  if (stageEnv) {
    Object.assign(merged, stageEnv);
  }
  return merged as NodeJS.ProcessEnv;
}

/**
 * Runs the static-export pipeline as discrete timed stages and returns a
 * stable timing summary. This is the opt-in profiled path; ordinary
 * `build:export` does not call it.
 */
export function runProfiledStaticExport(
  options: RunProfiledStaticExportOptions,
): RunProfiledStaticExportResult {
  const stages = options.stages ?? STATIC_EXPORT_PROFILE_STAGE_COMMANDS;
  const spawn = options.spawn ?? defaultSpawn;
  const clock = options.clock ?? (() => performance.now());
  const log = options.log ?? ((message: string) => console.log(message));
  const printSummary = options.printSummary ?? true;

  const baseEnv = {
    ...process.env,
    ...options.env,
  };

  const stageTimingsMs = createEmptyStageTimingsMs();
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];
  let failedStageId: StaticExportProfileStageId | null = null;
  let status: number | null = 0;

  const totalWallTimeMs = measureWallTimeMs(() => {
    for (const stage of stages) {
      let stageResult: ProfiledStaticExportSpawnResult | undefined;
      const stageMs = measureWallTimeMs(() => {
        stageResult = spawn(stage.argv, {
          cwd: options.cwd,
          env: mergeEnv(baseEnv, stage.env),
        });
      }, clock);

      stageTimingsMs[stage.id] = stageMs;

      const result = stageResult;
      if (!result) {
        failedStageId = stage.id;
        status = 1;
        stderrChunks.push(
          `Profiled static export stage "${stage.id}" produced no spawn result.`,
        );
        break;
      }

      if (result.stdout) {
        stdoutChunks.push(result.stdout);
      }
      if (result.stderr) {
        stderrChunks.push(result.stderr);
      }
      if (result.error) {
        failedStageId = stage.id;
        status = result.status ?? 1;
        stderrChunks.push(result.error.message);
        break;
      }
      if (result.status !== 0) {
        failedStageId = stage.id;
        status = result.status ?? 1;
        break;
      }
    }
  }, clock);

  const timings = finalizeProfileTimings(stageTimingsMs, totalWallTimeMs);
  const summary = formatStageTimingSummary(timings);

  if (printSummary) {
    log(summary);
  }

  return {
    ok: failedStageId === null && status === 0,
    status,
    failedStageId,
    timings,
    summary,
    stdout: stdoutChunks.join(""),
    stderr: stderrChunks.join(""),
  };
}
