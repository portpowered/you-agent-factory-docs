import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMPONENT_COVERAGE_ENFORCED_ROOT,
  COMPONENT_COVERAGE_EXTENSION_PATH_STEPS,
  COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES,
  COMPONENT_COVERAGE_PATH_IGNORE_PATTERNS,
  COMPONENT_COVERAGE_PRACTICAL_CONTRACT_SUMMARY,
  COMPONENT_COVERAGE_THRESHOLD_PERCENT,
  formatComponentCoverageBoundaryReport,
  formatComponentCoverageContractLimitations,
  isPathInEnforcedComponentBoundary,
  listEnforcedComponentSourceFiles,
} from "../../src/lib/component-coverage/boundary";

const repoRoot = join(import.meta.dir, "../..");

function readBunfigCoverageIgnorePatterns(): string[] {
  const bunfig = readFileSync(join(repoRoot, "bunfig.toml"), "utf8");
  const patterns: string[] = [];
  let inCoveragePatterns = false;

  for (const line of bunfig.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("coveragePathIgnorePatterns")) {
      inCoveragePatterns = true;
      const inlineMatch = trimmed.match(/=\s*\[\s*"([^"]+)"/);
      if (inlineMatch?.[1]) {
        patterns.push(inlineMatch[1]);
      }
      continue;
    }

    if (!inCoveragePatterns) {
      continue;
    }

    const quoted = trimmed.match(/^"([^"]+)",?$/);
    if (quoted?.[1]) {
      patterns.push(quoted[1]);
      continue;
    }

    if (trimmed.startsWith("]")) {
      break;
    }
  }

  return patterns;
}

describe("component coverage boundary contract", () => {
  test("discovers the current practical component source files under src/components", () => {
    const enforcedFiles = listEnforcedComponentSourceFiles(repoRoot);

    expect(enforcedFiles.length).toBeGreaterThan(0);
    expect(
      enforcedFiles.every((file) =>
        file.startsWith(`${COMPONENT_COVERAGE_ENFORCED_ROOT}/`),
      ),
    ).toBe(true);
    expect(enforcedFiles).toContain(
      "src/components/docs/docs-route-chrome.tsx",
    );
    expect(enforcedFiles).toContain(
      "src/components/docs/fumadocs-docs-layout.tsx",
    );
    expect(enforcedFiles).toContain("src/components/landing/landing-shell.tsx");
    expect(enforcedFiles).toEqual([...enforcedFiles].sort());
  });

  test("classifies enforced and out-of-scope paths predictably", () => {
    expect(
      isPathInEnforcedComponentBoundary(
        "src/components/landing/landing-shell.tsx",
      ),
    ).toBe(true);
    expect(isPathInEnforcedComponentBoundary("src/app/page.tsx")).toBe(false);
    expect(isPathInEnforcedComponentBoundary("src/lib/shell.ts")).toBe(false);
    expect(
      isPathInEnforcedComponentBoundary("src/components/landing/readme.md"),
    ).toBe(false);
  });

  test("boundary report documents threshold, enforced root, and explicit out-of-scope surfaces", () => {
    const report = formatComponentCoverageBoundaryReport(repoRoot);

    expect(report).toContain(
      `Threshold: ${COMPONENT_COVERAGE_THRESHOLD_PERCENT}%`,
    );
    expect(report).toContain(
      `Enforced root: ${COMPONENT_COVERAGE_ENFORCED_ROOT}`,
    );
    expect(report).toContain("src/components/landing/landing-shell.tsx");
    expect(report).toContain("src/components/docs/docs-route-chrome.tsx");
    expect(report).toContain("src/components/docs/fumadocs-docs-layout.tsx");

    for (const outOfScope of COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES) {
      expect(report).toContain(outOfScope.surface);
      expect(report).toContain(outOfScope.reason);
    }

    for (const pattern of COMPONENT_COVERAGE_PATH_IGNORE_PATTERNS) {
      expect(report).toContain(pattern);
    }

    expect(report).toContain("Extension path for later coverage expansion:");
    for (const step of COMPONENT_COVERAGE_EXTENSION_PATH_STEPS) {
      expect(report).toContain(step);
    }
  });

  test("contract limitations state the practical boundary without lowering the enforced threshold", () => {
    const limitations = formatComponentCoverageContractLimitations();

    expect(limitations).toContain(
      COMPONENT_COVERAGE_PRACTICAL_CONTRACT_SUMMARY,
    );
    expect(limitations).toContain(
      `Threshold for the enforced surface remains ${COMPONENT_COVERAGE_THRESHOLD_PERCENT}%`,
    );
    expect(limitations).toContain("not held to a lower bar");
    expect(limitations).toContain("Surfaces not enforced by this lane yet:");
    expect(limitations).toContain("localization catalogs and formatting hooks");
    expect(limitations).toContain("make component-coverage-boundary");
  });

  test("bunfig.toml encodes the same coverage ignore patterns as the boundary contract", () => {
    expect(readBunfigCoverageIgnorePatterns()).toEqual([
      ...COMPONENT_COVERAGE_PATH_IGNORE_PATTERNS,
    ]);
  });
});

describe("component coverage boundary command output", () => {
  test("show-component-coverage-boundary script prints the reviewer-visible contract", () => {
    const result = Bun.spawnSync({
      cmd: ["bun", "run", "component-coverage:boundary"],
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode).toBe(0);
    const stdout = result.stdout.toString();

    expect(stdout).toContain("Component coverage enforcement boundary");
    expect(stdout).toContain("src/components/landing/landing-shell.tsx");
    expect(stdout).toContain("Surfaces not enforced by this lane yet:");
    expect(stdout).toContain("localization catalogs and formatting hooks");
    expect(stdout).toContain("Extension path for later coverage expansion:");
  });
});
