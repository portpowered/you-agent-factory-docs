import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BUILD_CONTRACT_REQUIRED_TEST_PATHS } from "@/lib/build/build-contract-required-test-paths";
import {
  CI_WORKFLOW_REQUIRED_MAKE_TARGETS,
  EXCLUDED_MAKE_CI_TARGETS,
  MAKE_CI_PREREQUISITES,
  SHARED_REQUIRED_SUITE_TARGETS,
} from "@/lib/ci-required-path";

const repoRoot = join(import.meta.dir, "../../..");
const ciWorkflowPath = join(repoRoot, ".github/workflows/ci.yml");
const makefilePath = join(repoRoot, "Makefile");

type PackageScripts = Record<string, string>;

function parseMakefileCiPrerequisites(makefile: string): string[] {
  const ciLine = makefile
    .split("\n")
    .find((line) => line.startsWith("ci:") && !line.startsWith(".PHONY"));
  if (!ciLine) {
    throw new Error("Makefile is missing a ci: target");
  }
  return ciLine.slice("ci:".length).trim().split(/\s+/).filter(Boolean);
}

function workflowMakeCommands(workflow: string): string[] {
  return [...workflow.matchAll(/^\s+run:\s+make\s+([^\s#]+)/gm)].flatMap(
    (match) => (match[1] ? [match[1]] : []),
  );
}

describe("GitHub Actions make ci", () => {
  test("ci workflow is a linear required path with setup, check, and no continue-on-error", () => {
    const workflow = readFileSync(ciWorkflowPath, "utf8");

    const setupBunIndex = workflow.indexOf("oven-sh/setup-bun@v2");
    const setupIndex = workflow.indexOf("run: make setup");
    const checkIndex = workflow.indexOf("run: make check");

    expect(setupBunIndex).toBeGreaterThan(-1);
    expect(setupIndex).toBeGreaterThan(setupBunIndex);
    expect(checkIndex).toBeGreaterThan(setupIndex);
    expect(workflow).not.toContain("run: make ci");
    expect(workflow).not.toMatch(/continue-on-error:\s*true/i);
  });

  test("make ci and package scripts keep verify, build-contract, and integration as required gates", () => {
    const packageJson = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as {
      scripts: PackageScripts;
    };
    const scripts = packageJson.scripts;

    expect(scripts["prepare:content-runtime"]).toBe(
      "bun ./scripts/prepare-content-runtime.ts",
    );
    expect(scripts.pretest).toBe(
      "bun run prepare:content-runtime && fumadocs-mdx",
    );
    expect(scripts["pretest:verify-contract"]).toBe(
      "bun run prepare:content-runtime && fumadocs-mdx",
    );
    expect(scripts["pretest:build-contract"]).toBe(
      "bun run prepare:content-runtime && fumadocs-mdx",
    );
    expect(scripts["pretest:ci-contract"]).toBe(
      "bun run prepare:content-runtime && fumadocs-mdx",
    );
    expect(scripts.test).toBe("bun run test:website");
    expect(scripts["test:verify-contract"]).toBe(
      "bun ./scripts/run-website-verifier-tests.ts",
    );
    expect(scripts["test:ci-contract"]).toBe(
      "bun ./scripts/run-ci-contract-required-tests.ts",
    );
    expect(scripts["test:integration"]).toBe(
      "bun ./scripts/run-production-integration-tests.ts",
    );
    expect(scripts["test:build-contract"]).toBe(
      "bun ./scripts/run-build-contract-required-tests.ts",
    );
    expect(BUILD_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/lib/build/deploy-pages-workflow-contract.test.ts",
    );
    expect(BUILD_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/lib/build/verify-export-base-path.test.ts",
    );
    expect(BUILD_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/lib/build/acquire-trusted-project-site-export.test.ts",
    );
    expect(BUILD_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/lib/build/exported-site-budget.test.ts",
    );
    expect(BUILD_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/lib/build/required-read-only-export-probes.test.ts",
    );
    expect(BUILD_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/lib/build/build-contract-required-test-paths.test.ts",
    );
    expect(
      BUILD_CONTRACT_REQUIRED_TEST_PATHS.some((path) =>
        path.includes("static-export-search-ux-integration.test.ts"),
      ),
    ).toBe(false);
    expect(scripts.budget).toBe("bun ./scripts/run-exported-site-budget.ts");
    expect(scripts.coverage).toBe("bun ./scripts/component-coverage-gate.ts");

    const makefile = readFileSync(makefilePath, "utf8");
    const prerequisites = parseMakefileCiPrerequisites(makefile);
    expect(prerequisites).toContain("test");
    expect(prerequisites).toContain("test-ci-contract");
    expect(prerequisites).toContain("test-verify-contract");
    expect(prerequisites).toContain("test-build-contract");
    expect(prerequisites).toContain("test-integration");
    expect(prerequisites).toContain("test-reader-facing");
    expect(prerequisites).toContain("build");
    expect(prerequisites).toContain("budget");
    expect(prerequisites).toContain("component-coverage");
    expect(prerequisites).not.toContain("coverage");
    expect(prerequisites).not.toContain("build-export");

    expect(makefile).toMatch(/^budget:\n\tbun run budget$/m);
    expect(makefile).not.toContain(
      "exported-site budget gate temporarily skipped",
    );
    expect(makefile).toMatch(/^component-coverage:\n\tbun run coverage$/m);
    expect(makefile).not.toContain(
      "coverage gate temporarily skipped during rewrite foundation",
    );

    expect(
      existsSync(join(repoRoot, "src/lib/build/static-export.test.ts")),
    ).toBe(true);
    expect(
      existsSync(join(repoRoot, "src/lib/build/exported-site-budget.ts")),
    ).toBe(true);
    expect(
      existsSync(join(repoRoot, "src/lib/docs/component-coverage-gate.ts")),
    ).toBe(true);
    expect(
      existsSync(join(repoRoot, "src/lib/verify/verifier-coverage-gate.ts")),
    ).toBe(true);
  });

  test("Makefile ci target runs the aligned required gates in order", () => {
    const makefile = readFileSync(makefilePath, "utf8");
    const prerequisites = parseMakefileCiPrerequisites(makefile);

    expect(prerequisites).toEqual([...MAKE_CI_PREREQUISITES]);

    for (const excluded of EXCLUDED_MAKE_CI_TARGETS) {
      expect(prerequisites).not.toContain(excluded);
    }
  });

  test("ci workflow invokes the aligned required make targets", () => {
    const workflow = readFileSync(ciWorkflowPath, "utf8");
    const commands = workflowMakeCommands(workflow);

    for (const target of CI_WORKFLOW_REQUIRED_MAKE_TARGETS) {
      expect(commands).toContain(target);
    }

    const buildIndex = commands.indexOf("build");
    const integrationIndex = commands.indexOf("test-integration");
    const budgetIndex = commands.indexOf("budget");
    expect(buildIndex).toBeGreaterThan(-1);
    expect(integrationIndex).toBeGreaterThan(buildIndex);
    expect(budgetIndex).toBeGreaterThan(buildIndex);
  });

  test("shared restored suites appear in both make ci and the CI workflow", () => {
    const makefile = readFileSync(makefilePath, "utf8");
    const prerequisites = new Set(parseMakefileCiPrerequisites(makefile));
    const workflow = readFileSync(ciWorkflowPath, "utf8");
    const commands = new Set(workflowMakeCommands(workflow));

    for (const target of SHARED_REQUIRED_SUITE_TARGETS) {
      expect(prerequisites.has(target)).toBe(true);
      expect(commands.has(target)).toBe(true);
    }
  });

  test("make ci stops on the first failing prerequisite", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "make-ci-abort-"));

    try {
      writeFileSync(
        join(fixtureRoot, "Makefile"),
        [
          ".PHONY: ci lint typecheck",
          "ci: lint typecheck",
          "lint:",
          "\texit 1",
          "typecheck:",
          "\t@echo typecheck-should-not-run",
        ].join("\n"),
      );

      const result = spawnSync("make", ["ci"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      });

      expect(result.status).not.toBe(0);
      expect(result.stdout ?? "").not.toContain("typecheck-should-not-run");
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
