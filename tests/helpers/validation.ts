import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { EarlyGateValidationFixture } from "../../src/lib/validation/gate-fixtures";
import { STATIC_EXPORT_LOCK_HELD_ENV } from "../../src/lib/validation/static-export";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { withRepoRootCommandLock } from "./repo-root-command-lock";

const repoRoot = join(import.meta.dir, "../..");

export function runQualityGateScript(
  options: { env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const result = withRepoRootCommandLock(repoRoot, () =>
    withStaticExportBuildLock(repoRoot, () =>
      spawnSync("bun", ["run", "scripts/quality-gate.ts"], {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          [STATIC_EXPORT_LOCK_HELD_ENV]: "1",
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
    | "validate:static-export",
  fixture?: EarlyGateValidationFixture,
): { status: number | null; stdout: string; stderr: string } {
  const runValidation = () =>
    spawnSync("bun", ["run", target], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        ...(fixture
          ? {
              EARLY_GATE_VALIDATION_FIXTURE: fixture,
            }
          : undefined),
      },
    });
  const result = withRepoRootCommandLock(repoRoot, () =>
    target === "validate:static-export"
      ? withStaticExportBuildLock(repoRoot, () =>
          spawnSync("bun", ["run", target], {
            cwd: repoRoot,
            encoding: "utf8",
            env: {
              ...process.env,
              [STATIC_EXPORT_LOCK_HELD_ENV]: "1",
              ...(fixture
                ? {
                    EARLY_GATE_VALIDATION_FIXTURE: fixture,
                  }
                : undefined),
            },
          }),
        )
      : runValidation(),
  );

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
