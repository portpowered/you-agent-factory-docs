import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
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
  options: { resetGeneratedArtifacts?: boolean } = {},
): MakeTargetResult {
  const mergedEnv = buildCleanSubprocessEnv(env);
  const verifyingMakeTest = mergedEnv.VERIFYING_MAKE_TEST === "1";
  const runWithOptionalLock = <T>(fn: () => T): T =>
    target === "setup" ? fn() : withRepoCommandLock(projectRoot, fn);

  const result = runWithOptionalLock(() => {
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

    if (target === "build" || target === "check") {
      return withStaticExportBuildLock(projectRoot, () => {
        if (options.resetGeneratedArtifacts) {
          rmSync(nextDir, { recursive: true, force: true });
          rmSync(tsBuildInfoPath, { force: true });
        }

        return runTarget();
      });
    }

    return runTarget();
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  return {
    status: result.status,
    stdout,
    stderr,
    output: `${stdout}${stderr}`,
  };
}
