import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { EarlyGateValidationFixture } from "../../src/lib/validation/gate-fixtures";
import { withNextTypeArtifactLock } from "../../src/lib/validation/next-type-artifact-lock";

const repoRoot = join(import.meta.dir, "../..");

export function runQualityGateScript(
  options: { env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const result = withNextTypeArtifactLock(repoRoot, () =>
    spawnSync("bun", ["run", "scripts/quality-gate.ts"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        ...options.env,
      },
    }),
  );

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export function extractQualityGateStepNames(output: string): string[] {
  return [...output.matchAll(/==> Early quality gate: (.+)/g)].map(
    (match) => match[1] ?? "",
  );
}

export function runValidationScript(
  target:
    | "validate:localization"
    | "validate:content"
    | "validate:accessibility"
    | "validate:static-export"
    | "validate:search-index",
  fixture?: EarlyGateValidationFixture,
  options: { env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("bun", ["run", target], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...options.env,
      ...(fixture
        ? {
            EARLY_GATE_VALIDATION_FIXTURE: fixture,
          }
        : undefined),
    },
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
