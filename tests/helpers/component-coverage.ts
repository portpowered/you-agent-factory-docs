import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { ComponentCoverageEnforcementFixture } from "../../src/lib/component-coverage/fixtures";

const repoRoot = join(import.meta.dir, "../..");

export function runComponentCoverageEnforcement(
  options: {
    env?: Record<string, string | undefined>;
    useMake?: boolean;
  } = {},
): { status: number | null; stdout: string; stderr: string } {
  const fixture = options.env?.COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE as
    | ComponentCoverageEnforcementFixture
    | undefined;

  const command = options.useMake
    ? { cmd: "make", args: ["component-coverage"] }
    : { cmd: "bun", args: ["run", "component-coverage"] };

  const result = spawnSync(command.cmd, command.args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...options.env,
      ...(fixture
        ? { COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE: fixture }
        : undefined),
    },
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
