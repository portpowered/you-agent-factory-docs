import { spawnSync } from "node:child_process";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");

export function runMake(
  target: string,
  options: { dryRun?: boolean } = {},
): { status: number | null; stdout: string; stderr: string } {
  const args = options.dryRun ? ["-n", target] : [target];
  const result = spawnSync("make", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
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
