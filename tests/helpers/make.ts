import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { buildCleanSubprocessEnv } from "./subprocess-env";

const repoRoot = join(import.meta.dir, "../..");

export function runMake(
  target: string,
  options: { dryRun?: boolean; env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const args = options.dryRun ? ["-n", target] : [target];
  const runTarget = () =>
    spawnSync("make", args, {
      cwd: repoRoot,
      encoding: "utf8",
      env: buildCleanSubprocessEnv(options.env),
    });

  const result =
    options.dryRun || !["build", "check", "component-coverage"].includes(target)
      ? runTarget()
      : withStaticExportBuildLock(repoRoot, runTarget);

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
