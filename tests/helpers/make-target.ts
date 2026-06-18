import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { withQualityGateCommandLock } from "../../src/lib/validation/quality-gate-command-lock";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { withRepoCommandLock } from "./repo-command-lock";
import { buildCleanSubprocessEnv } from "./subprocess-env";

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
  options: { cleanNextTypeArtifacts?: boolean } = {},
): MakeTargetResult {
  const mergedEnv = buildCleanSubprocessEnv(env);
  const verifyingMakeTest = mergedEnv.VERIFYING_MAKE_TEST === "1";

  const prepareTarget = () => {
    if (!options.cleanNextTypeArtifacts) {
      return;
    }

    rmSync(join(projectRoot, ".next"), { recursive: true, force: true });
    rmSync(join(projectRoot, "tsconfig.tsbuildinfo"), { force: true });
  };

  const runTarget = () => {
    if (target === "test" && verifyingMakeTest) {
      return spawnSync(
        "bun",
        ["test", "tests/unit/project.test.ts", "tests/unit/site.test.ts"],
        {
          cwd: projectRoot,
          encoding: "utf8",
          env: mergedEnv,
          maxBuffer: 50 * 1024 * 1024,
        },
      );
    }

    return spawnSync("make", [target], {
      cwd: projectRoot,
      encoding: "utf8",
      env: mergedEnv,
      maxBuffer: 50 * 1024 * 1024,
    });
  };

  const runWithLocks = () =>
    target === "build" || target === "check"
      ? withQualityGateCommandLock(projectRoot, () =>
          withStaticExportBuildLock(projectRoot, () => {
            prepareTarget();
            return runTarget();
          }),
        )
      : runTarget();

  const result =
    target === "setup"
      ? runWithLocks()
      : withRepoCommandLock(projectRoot, runWithLocks);

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const output = `${stdout}${stderr}`;

  return {
    status: result.status,
    stdout,
    stderr,
    output,
  };
}
