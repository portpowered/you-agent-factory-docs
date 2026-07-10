import { runProfiledStaticExport } from "../src/lib/build/run-profiled-static-export";
import {
  isStaticExportProfilingEnabled,
  PROFILE_STATIC_EXPORT_ENV,
} from "../src/lib/build/static-export-profile";

/**
 * Opt-in profiled static-export entrypoint. Records per-stage wall times.
 * Ordinary `bun run build:export` / `make build` do not use this script.
 *
 * Usage:
 *   PROFILE_STATIC_EXPORT=1 bun ./scripts/run-profiled-static-export-build.ts
 *   bun run build:export:profile
 */
function main(): void {
  if (!isStaticExportProfilingEnabled(process.env)) {
    console.error(
      `Profiling is opt-in. Set ${PROFILE_STATIC_EXPORT_ENV}=1 or use \`bun run build:export:profile\`.`,
    );
    process.exit(2);
  }

  const result = runProfiledStaticExport({
    cwd: process.cwd(),
    env: process.env,
  });

  if (!result.ok) {
    if (result.failedStageId) {
      console.error(
        `Profiled static export failed at stage "${result.failedStageId}" (status ${result.status ?? "null"}).`,
      );
    }
    if (result.stderr) {
      console.error(result.stderr);
    }
    process.exit(result.status ?? 1);
  }
}

main();
