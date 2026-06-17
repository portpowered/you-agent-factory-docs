import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";

const projectRoot = join(import.meta.dir, "../..");
const nextDir = join(projectRoot, ".next");
const tsBuildInfoPath = join(projectRoot, "tsconfig.tsbuildinfo");

export type MakeTargetResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  output: string;
};

export function runMakeTarget(
  target: string,
  env: Record<string, string> = {},
  options: { resetGeneratedArtifacts?: boolean } = {},
): MakeTargetResult {
  const runTarget = () =>
    spawnSync("make", [target], {
      cwd: projectRoot,
      encoding: "utf8",
      env: { ...process.env, ...env },
      maxBuffer: 50 * 1024 * 1024,
    });

  const runTargetWithinLock = () => {
    if (options.resetGeneratedArtifacts) {
      rmSync(nextDir, { recursive: true, force: true });
      rmSync(tsBuildInfoPath, { force: true });
    }

    return runTarget();
  };

  const result =
    target === "build" || target === "check"
      ? withStaticExportBuildLock(projectRoot, runTargetWithinLock)
      : runTarget();

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  return {
    status: result.status,
    stdout,
    stderr,
    output: `${stdout}${stderr}`,
  };
}
