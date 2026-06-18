import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { EarlyGateValidationFixture } from "../../src/lib/validation/gate-fixtures";
import { withQualityGateCommandLock } from "../../src/lib/validation/quality-gate-command-lock";
import { STATIC_EXPORT_LOCK_HELD_ENV } from "../../src/lib/validation/static-export";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { withRepoCommandLock } from "./repo-command-lock";
import {
  buildCleanSubprocessEnv,
  buildIsolatedTestPortEnv,
} from "./subprocess-env";

const repoRoot = join(import.meta.dir, "../..");

export function runQualityGateScript(
  options: { env?: Record<string, string | undefined> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const result = withRepoCommandLock(repoRoot, () =>
    withQualityGateCommandLock(repoRoot, () =>
      withStaticExportBuildLock(repoRoot, () =>
        spawnSync("bun", ["run", "scripts/quality-gate.ts"], {
          cwd: repoRoot,
          encoding: "utf8",
          env: buildCleanSubprocessEnv({
            [STATIC_EXPORT_LOCK_HELD_ENV]: "1",
            ...buildIsolatedTestPortEnv(),
            ...options.env,
          }),
        }),
      ),
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
    target === "validate:static-export"
      ? withStaticExportBuildLock(repoRoot, () =>
          spawnSync("bun", ["run", target], {
            cwd: repoRoot,
            encoding: "utf8",
            env: buildCleanSubprocessEnv({
              [STATIC_EXPORT_LOCK_HELD_ENV]: "1",
              ...buildIsolatedTestPortEnv(),
              ...options.env,
              ...(fixture
                ? {
                    EARLY_GATE_VALIDATION_FIXTURE: fixture,
                  }
                : undefined),
            }),
          }),
        )
      : spawnSync("bun", ["run", target], {
          cwd: repoRoot,
          encoding: "utf8",
          env: buildCleanSubprocessEnv({
            ...options.env,
            ...(fixture
              ? {
                  EARLY_GATE_VALIDATION_FIXTURE: fixture,
                }
              : undefined),
          }),
        }),
  );

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
