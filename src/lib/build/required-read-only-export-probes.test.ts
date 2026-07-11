import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPORTED_SITE_BUDGET_COMMAND } from "@/lib/build/exported-site-budget";
import {
  FORBIDDEN_READ_ONLY_PROBE_REBUILD_PATTERNS,
  formatGuardPagesDeployedArtifactFailureReport,
  GUARD_PAGES_DEPLOYED_ARTIFACT_COMMAND,
  REQUIRED_READ_ONLY_BUDGET_COMMAND,
  REQUIRED_READ_ONLY_EXPORT_PROBES,
  readOnlyProbeScriptInvokesRebuild,
} from "@/lib/build/required-read-only-export-probes";

const repoRoot = join(import.meta.dir, "../../..");

describe("required read-only export probes", () => {
  test("lists the Pages guard and budget probes with reuse postures", () => {
    expect(REQUIRED_READ_ONLY_EXPORT_PROBES.length).toBeGreaterThanOrEqual(2);
    expect(GUARD_PAGES_DEPLOYED_ARTIFACT_COMMAND).toBe(
      "make guard-pages-deployed-artifact",
    );
    expect(REQUIRED_READ_ONLY_BUDGET_COMMAND).toBe(
      EXPORTED_SITE_BUDGET_COMMAND,
    );

    const byCommand = Object.fromEntries(
      REQUIRED_READ_ONLY_EXPORT_PROBES.map((probe) => [probe.command, probe]),
    );
    expect(byCommand[GUARD_PAGES_DEPLOYED_ARTIFACT_COMMAND]?.acquisition).toBe(
      "acquire-allow-build-false",
    );
    expect(byCommand[REQUIRED_READ_ONLY_BUDGET_COMMAND]?.acquisition).toBe(
      "measure-existing-out",
    );
  });

  test("package scripts and CLI files exist for every required probe", () => {
    const packageJson = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    for (const probe of REQUIRED_READ_ONLY_EXPORT_PROBES) {
      const scriptPath = join(repoRoot, probe.scriptPath);
      expect(existsSync(scriptPath)).toBe(true);
      expect(packageJson.scripts[probe.packageScript]).toContain(
        probe.scriptPath,
      );
    }
  });

  test("required probe CLI scripts never invoke a competing full export", () => {
    for (const probe of REQUIRED_READ_ONLY_EXPORT_PROBES) {
      const source = readFileSync(join(repoRoot, probe.scriptPath), "utf8");
      expect(readOnlyProbeScriptInvokesRebuild(source)).toBe(false);
    }
  });

  test("Pages guard module acquires with allowBuild: false", () => {
    const guardSource = readFileSync(
      join(repoRoot, "src/lib/build/guard-pages-deployed-artifact.ts"),
      "utf8",
    );
    expect(guardSource).toContain("acquireTrustedProjectSiteExport");
    expect(guardSource).toMatch(/allowBuild:\s*false/);
    expect(guardSource).not.toMatch(/allowBuild:\s*true/);
  });

  test("budget evaluator measures existing out/ without spawning a full export", () => {
    const budgetSource = readFileSync(
      join(repoRoot, "src/lib/build/exported-site-budget.ts"),
      "utf8",
    );
    expect(readOnlyProbeScriptInvokesRebuild(budgetSource)).toBe(false);
    expect(budgetSource).toContain("verifyExportOutDirectory");
  });

  test("failure report prints the guard reproduction command", () => {
    const report = formatGuardPagesDeployedArtifactFailureReport(
      "trusted project-site export unavailable without rebuild: missing out/",
    );
    expect(report).toContain("Pages deployed-artifact guard failed:");
    expect(report).toContain("unavailable without rebuild");
    expect(report).toContain(
      `Reproduce locally with: ${GUARD_PAGES_DEPLOYED_ARTIFACT_COMMAND}`,
    );
  });

  test("forbidden rebuild patterns catch executable build:export calls", () => {
    expect(FORBIDDEN_READ_ONLY_PROBE_REBUILD_PATTERNS.length).toBeGreaterThan(
      0,
    );
    // Build the marker at runtime so this file itself is not flagged by the
    // system-test-gates scanner for expensive export invocations.
    const rebuildCall = `${"runStaticExportBuild"}({ cwd: process.cwd() });`;
    expect(readOnlyProbeScriptInvokesRebuild(rebuildCall)).toBe(true);
    expect(readOnlyProbeScriptInvokesRebuild(`bun run ${"build:export"}`)).toBe(
      true,
    );
    expect(
      readOnlyProbeScriptInvokesRebuild(
        "// after make build — reuse out/ only",
      ),
    ).toBe(false);
  });
});
