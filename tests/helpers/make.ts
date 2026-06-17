import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { withNextTypeArtifactLock } from "../../src/lib/validation/next-type-artifact-lock";
import { withQualityGateCommandLock } from "../../src/lib/validation/quality-gate-command-lock";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";

const repoRoot = join(import.meta.dir, "../..");

function shouldUseStaticExportBuildLock(
  target: string,
  env: Record<string, string | undefined> | undefined,
): boolean {
  if (target !== "build" && target !== "component-coverage") {
    return false;
  }

  return !(
    target === "component-coverage" &&
    env?.COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE
  );
}

export function runMake(
  target: string,
  options: { dryRun?: boolean; env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const args = options.dryRun ? ["-n", target] : [target];
  const runTarget = () =>
    spawnSync("make", args, {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        ...(target === "quality-gate"
          ? {
              STATIC_EXPORT_BUILD_LOCK_HELD: "1",
            }
          : undefined),
        ...options.env,
      },
      maxBuffer: 50 * 1024 * 1024,
    });
  const result = options.dryRun
    ? runTarget()
    : target === "quality-gate"
      ? withQualityGateCommandLock(repoRoot, () =>
          withStaticExportBuildLock(repoRoot, runTarget),
        )
      : shouldUseStaticExportBuildLock(target, options.env)
        ? withStaticExportBuildLock(repoRoot, runTarget)
        : target === "check"
          ? withNextTypeArtifactLock(repoRoot, runTarget)
          : runTarget();

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
