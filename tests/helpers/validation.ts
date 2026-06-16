import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { EarlyGateValidationFixture } from "../../src/lib/validation/gate-fixtures";

const repoRoot = join(import.meta.dir, "../..");

export function runBunScript(
  script: string,
  options: { env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("bun", ["run", script], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...options.env,
    },
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export function runValidationScript(
  target: "validate:localization" | "validate:content",
  fixture?: EarlyGateValidationFixture,
): { status: number | null; stdout: string; stderr: string } {
  return runBunScript(target, {
    env: fixture
      ? {
          EARLY_GATE_VALIDATION_FIXTURE: fixture,
        }
      : undefined,
  });
}
