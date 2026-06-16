import { spawnSync } from "node:child_process";
import { join } from "node:path";

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
  const result = spawnSync("make", [target], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
    maxBuffer: 50 * 1024 * 1024,
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
