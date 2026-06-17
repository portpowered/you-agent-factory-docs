import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { withQualityGateCommandLock } from "../../src/lib/validation/quality-gate-command-lock";
import { withRepoCommandLock } from "./repo-command-lock";

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
        env: {
          ...process.env,
          ...options.env,
        },
        maxBuffer: 50 * 1024 * 1024,
      });
    return target === "quality-gate"
      ? withQualityGateCommandLock(repoRoot, runTarget)
      : runTarget();
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
