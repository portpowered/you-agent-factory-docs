import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { withQualityGateCommandLock } from "../../src/lib/validation/quality-gate-command-lock";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { withRepoCommandLock } from "./repo-command-lock";
import { buildCleanSubprocessEnv } from "./subprocess-env";

const repoRoot = join(import.meta.dir, "../..");

export function runMake(
  target: string,
  options: { dryRun?: boolean; env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const runWithOptionalLock = <T>(fn: () => T): T =>
    options.dryRun ? fn() : withRepoCommandLock(repoRoot, fn);

  const result = runWithOptionalLock(() => {
    const args = options.dryRun ? ["-n", target] : [target];
    const runTarget = () =>
      spawnSync("make", args, {
        cwd: repoRoot,
        encoding: "utf8",
        env: buildCleanSubprocessEnv(options.env),
        maxBuffer: 50 * 1024 * 1024,
      });

    if (target === "quality-gate" && !options.dryRun) {
      return withQualityGateCommandLock(repoRoot, runTarget);
    }

    if ((target === "check" || target === "build") && !options.dryRun) {
      return withStaticExportBuildLock(repoRoot, runTarget);
    }

    return runTarget();
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export function dryRunMake(target: string): string {
  const result = runMake(target, { dryRun: true });
  if (result.status !== 0) {
    throw new Error(
      result.stderr || `make -n ${target} failed with status ${result.status}`,
    );
  }

  return result.stdout;
}
