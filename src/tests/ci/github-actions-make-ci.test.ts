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
import { parse as parseYaml } from "yaml";
import { BUILD_CONTRACT_REQUIRED_TEST_PATHS } from "@/lib/build/build-contract-required-test-paths";
import { CI_CONTRACT_REQUIRED_TEST_PATHS } from "@/lib/ci-contract-required-test-paths";
import {
  CI_GATE_JOB_ID,
  CI_REQUIRED_JOB_GRAPH,
  CI_REQUIRED_JOB_IDS,
  CI_REQUIRED_ORDERING_EDGES,
  CI_REQUIRED_SUITE_JOBS,
  CI_WORKFLOW_REQUIRED_MAKE_TARGETS,
  EXCLUDED_MAKE_CI_TARGETS,
  getCiRequiredJob,
  MAKE_CI_PREREQUISITES,
  SHARED_REQUIRED_SUITE_TARGETS,
} from "@/lib/ci-required-path";

const repoRoot = join(import.meta.dir, "../../..");
const ciWorkflowPath = join(repoRoot, ".github/workflows/ci.yml");
const makefilePath = join(repoRoot, "Makefile");

type PackageScripts = Record<string, string>;

type WorkflowStep = {
  run?: string;
  "continue-on-error"?: boolean | string;
};

type WorkflowJob = {
  needs?: string | string[];
  steps?: WorkflowStep[];
  "continue-on-error"?: boolean | string;
};

type WorkflowDocument = {
  jobs?: Record<string, WorkflowJob>;
};

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

function loadCiWorkflow(): {
  raw: string;
  jobs: Record<string, WorkflowJob>;
} {
  const raw = readFileSync(ciWorkflowPath, "utf8");
  const document = parseYaml(raw) as WorkflowDocument;
  if (!document.jobs || typeof document.jobs !== "object") {
    throw new Error("ci.yml is missing a jobs map");
  }
  return { raw, jobs: document.jobs };
}

function normalizeNeeds(needs: string | string[] | undefined): string[] {
  if (!needs) return [];
  return Array.isArray(needs) ? [...needs] : [needs];
}

function jobMakeTargets(job: WorkflowJob | undefined): string[] {
  const targets: string[] = [];
  for (const step of job?.steps ?? []) {
    const run = step.run?.trim() ?? "";
    const match = run.match(/^make\s+([^\s#]+)/);
    if (match?.[1]) targets.push(match[1]);
  }
  return targets;
}

function jobHasContinueOnErrorTrue(job: WorkflowJob | undefined): boolean {
  if (!job) return false;
  if (
    job["continue-on-error"] === true ||
    job["continue-on-error"] === "true"
  ) {
    return true;
  }
  return (job.steps ?? []).some(
    (step) =>
      step["continue-on-error"] === true ||
      step["continue-on-error"] === "true",
  );
}

describe("GitHub Actions make ci", () => {
  test("ci workflow matches the required job-graph model", () => {
    const { raw, jobs } = loadCiWorkflow();
    const jobIds = Object.keys(jobs);

    for (const jobId of CI_REQUIRED_JOB_IDS) {
      expect(jobIds).toContain(jobId);
    }

    // No single linear verify-only required path.
    expect(jobIds).not.toContain("verify");
    expect(raw).not.toContain("run: make ci");

    for (const graphJob of CI_REQUIRED_SUITE_JOBS) {
      const workflowJob = jobs[graphJob.id];
      expect(workflowJob).toBeDefined();
      expect(normalizeNeeds(workflowJob?.needs)).toEqual([...graphJob.needs]);

      const targets = jobMakeTargets(workflowJob);
      for (const target of graphJob.makeTargets) {
        expect(targets).toContain(target);
      }
    }

    for (const edge of CI_REQUIRED_ORDERING_EDGES) {
      expect(normalizeNeeds(jobs[edge.to]?.needs)).toContain(edge.from);
    }

    const gate = jobs[CI_GATE_JOB_ID];
    expect(gate).toBeDefined();
    expect(jobMakeTargets(gate)).toEqual([]);
    expect(normalizeNeeds(gate?.needs).sort()).toEqual(
      [...getCiRequiredJob(CI_GATE_JOB_ID).needs].sort(),
    );

    for (const jobId of CI_REQUIRED_JOB_IDS) {
      expect(jobHasContinueOnErrorTrue(jobs[jobId])).toBe(false);
    }
    expect(raw).not.toMatch(/continue-on-error:\s*true/i);
  });

  test("ci-gate needs every required child job and suite jobs keep peer independence", () => {
    const { jobs } = loadCiWorkflow();
    const gateNeeds = new Set(normalizeNeeds(jobs[CI_GATE_JOB_ID]?.needs));

    for (const suiteJob of CI_REQUIRED_SUITE_JOBS) {
      expect(gateNeeds.has(suiteJob.id)).toBe(true);
    }

    const peerJobIds = CI_REQUIRED_SUITE_JOBS.filter(
      (job) => job.needs.length === 0,
    ).map((job) => job.id);

    for (const peerId of peerJobIds) {
      expect(normalizeNeeds(jobs[peerId]?.needs)).toEqual([]);
    }

    expect(CI_REQUIRED_JOB_GRAPH.map((job) => job.id)).toEqual([
      ...CI_REQUIRED_JOB_IDS,
    ]);
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

  test("ci workflow invokes every required make target across the job graph", () => {
    const { raw, jobs } = loadCiWorkflow();
    const commands = workflowMakeCommands(raw);

    for (const target of CI_WORKFLOW_REQUIRED_MAKE_TARGETS) {
      expect(commands).toContain(target);
    }

    for (const graphJob of CI_REQUIRED_SUITE_JOBS) {
      const targets = jobMakeTargets(jobs[graphJob.id]);
      for (const target of graphJob.makeTargets) {
        expect(targets).toContain(target);
      }
    }

    expect(normalizeNeeds(jobs.integration?.needs)).toEqual(["static-export"]);
    expect(normalizeNeeds(jobs.budget?.needs)).toEqual(["static-export"]);
    expect(jobMakeTargets(jobs["static-export"])).toContain("build");
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

  test("bounded ci-contract suite still includes the job-graph alignment tests", () => {
    expect(CI_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/tests/ci/github-actions-make-ci.test.ts",
    );
    expect(CI_CONTRACT_REQUIRED_TEST_PATHS).toContain(
      "src/lib/ci-required-path.test.ts",
    );
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
