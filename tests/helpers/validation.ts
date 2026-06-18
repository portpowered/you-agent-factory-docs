import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { EarlyGateValidationFixture } from "../../src/lib/validation/gate-fixtures";
import { withQualityGateCommandLock } from "../../src/lib/validation/quality-gate-command-lock";
import { STATIC_EXPORT_SKIP_BUILD_ENV } from "../../src/lib/validation/static-export";
import { withRepoCommandLock } from "./repo-command-lock";

const repoRoot = join(import.meta.dir, "../..");

export function runQualityGateScript(
  options: { env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const exportDir = join(repoRoot, "out");
  const result = withRepoCommandLock(repoRoot, () =>
    withQualityGateCommandLock(repoRoot, () =>
      spawnSync("bun", ["run", "scripts/quality-gate.ts"], {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          ...(existsSync(exportDir)
            ? {
                [STATIC_EXPORT_SKIP_BUILD_ENV]: "1",
              }
            : undefined),
          ...options.env,
        },
      }),
    ),
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
  const result = withRepoCommandLock(repoRoot, () =>
    spawnSync("bun", ["run", target], {
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
    }),
  );

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
