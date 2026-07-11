/**
 * Required read-only export probes (restore-required-tests-gates-006).
 *
 * After one trusted project-site `make build`, these probes must reuse the
 * matching `out/` (or fail closed) and must never launch a competing
 * `build:export` solely to re-prove the same artifact.
 */

/** Maintainer reproduction command for the Pages deploy HTTP guard. */
export const GUARD_PAGES_DEPLOYED_ARTIFACT_COMMAND =
  "make guard-pages-deployed-artifact";

/** Maintainer reproduction command for the exported-site budget gate. */
export const REQUIRED_READ_ONLY_BUDGET_COMMAND = "make budget";

export type RequiredReadOnlyExportProbe = {
  /** Makefile / maintainer target. */
  command: string;
  /** package.json script name. */
  packageScript: string;
  /** Thin CLI under scripts/. */
  scriptPath: string;
  /**
   * How the probe obtains `out/`:
   * - `acquire-allow-build-false` — `acquireTrustedProjectSiteExport({ allowBuild: false })`
   * - `measure-existing-out` — reads existing `out/` only; never rebuilds
   */
  acquisition: "acquire-allow-build-false" | "measure-existing-out";
};

/**
 * Required-path read-only probes that must reuse one trusted export.
 * Deploy validate runs the Pages guard after `make build`; CI/deploy both run
 * budget against the same artifact. Neither may start a second full export.
 */
export const REQUIRED_READ_ONLY_EXPORT_PROBES = [
  {
    command: GUARD_PAGES_DEPLOYED_ARTIFACT_COMMAND,
    packageScript: "guard:pages-deployed-artifact",
    scriptPath: "scripts/guard-pages-deployed-artifact.ts",
    acquisition: "acquire-allow-build-false",
  },
  {
    command: REQUIRED_READ_ONLY_BUDGET_COMMAND,
    packageScript: "budget",
    scriptPath: "scripts/run-exported-site-budget.ts",
    acquisition: "measure-existing-out",
  },
] as const satisfies readonly RequiredReadOnlyExportProbe[];

/**
 * Executable rebuild markers that must not appear in required read-only probe
 * CLI scripts. Comment prose may mention `make build` historically; these
 * patterns target actual invocation sites.
 */
export const FORBIDDEN_READ_ONLY_PROBE_REBUILD_PATTERNS = [
  /\brunStaticExportBuild\s*\(/,
  /\bbun\s+run\s+build:export\b/,
  /\bspawnSync\b[\s\S]{0,80}\bbuild:export\b/,
] as const;

export function readOnlyProbeScriptInvokesRebuild(source: string): boolean {
  return FORBIDDEN_READ_ONLY_PROBE_REBUILD_PATTERNS.some((pattern) =>
    pattern.test(source),
  );
}

export function formatGuardPagesDeployedArtifactFailureReport(
  reason: string,
): string {
  return [
    "Pages deployed-artifact guard failed:",
    `  ${reason}`,
    `Reproduce locally with: ${GUARD_PAGES_DEPLOYED_ARTIFACT_COMMAND}`,
  ].join("\n");
}
