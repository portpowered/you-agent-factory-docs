import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { withNextTypeArtifactLock } from "../../src/lib/validation/next-type-artifact-lock";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { withRepoCommandLock } from "./repo-command-lock";

const projectRoot = join(import.meta.dir, "../..");

export type MakeTargetResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  output: string;
};

export function runMakeTarget(
  target: string,
  env: Record<string, string> = {},
): MakeTargetResult {
  const mergedEnv = { ...process.env, ...env };
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

    return target === "build"
      ? withStaticExportBuildLock(projectRoot, runTarget)
      : target === "check"
        ? withNextTypeArtifactLock(projectRoot, runTarget)
        : runTarget();
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
