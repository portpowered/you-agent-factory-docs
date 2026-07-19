import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  CI_GATE_JOB_ID,
  CI_REQUIRED_JOB_GRAPH,
  CI_REQUIRED_JOB_IDS,
  CI_REQUIRED_ORDERING_EDGES,
  CI_REQUIRED_SUITE_JOBS,
  CI_STATIC_EXPORT_ARTIFACT_CONSUMER_JOB_IDS,
  CI_STATIC_EXPORT_ARTIFACT_HANDOFF,
  CI_STATIC_EXPORT_ARTIFACT_NAME,
  CI_STATIC_EXPORT_ARTIFACT_PATH,
  CI_STATIC_EXPORT_FORBIDDEN_CONSUMER_MAKE_TARGETS,
  CI_WORKFLOW_REQUIRED_MAKE_TARGETS,
  ciJobConsumesStaticExportArtifact,
  ciJobDependsOnStaticExportJob,
  ciJobForbidsLocalStaticExportRebuild,
  ciJobMustRebuildStaticExportLocally,
  ciRequiredJobGraphMakeTargets,
  ciRequiredJobNeeds,
  EXCLUDED_MAKE_CI_TARGETS,
  getCiRequiredJob,
  MAKE_CI_PREREQUISITES,
  MAKE_CI_REPRODUCTION_COMMAND,
  SHARED_REQUIRED_SUITE_TARGETS,
} from "./ci-required-path";

const repoRoot = join(import.meta.dir, "../..");
const makefilePath = join(repoRoot, "Makefile");
const ciWorkflowPath = join(repoRoot, ".github/workflows/ci.yml");

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

function loadCiWorkflowJobs(): Record<string, WorkflowJob> {
  const document = parseYaml(
    readFileSync(ciWorkflowPath, "utf8"),
  ) as WorkflowDocument;
  if (!document.jobs || typeof document.jobs !== "object") {
    throw new Error("ci.yml is missing a jobs map");
  }
  return document.jobs;
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

describe("ci required path alignment", () => {
  test("documents the full local reproduction command", () => {
    expect(MAKE_CI_REPRODUCTION_COMMAND).toBe("make ci");
  });

  test("Makefile ci prerequisites match the aligned inventory", () => {
    const makefile = readFileSync(makefilePath, "utf8");
    const prerequisites = parseMakefileCiPrerequisites(makefile);

    expect(prerequisites).toEqual([...MAKE_CI_PREREQUISITES]);

    for (const excluded of EXCLUDED_MAKE_CI_TARGETS) {
      expect(prerequisites).not.toContain(excluded);
    }
  });

  test("CI workflow matches job-graph membership and static-export edges", () => {
    const workflow = readFileSync(ciWorkflowPath, "utf8");
    const commands = workflowMakeCommands(workflow);
    const jobs = loadCiWorkflowJobs();

    for (const target of CI_WORKFLOW_REQUIRED_MAKE_TARGETS) {
      expect(commands).toContain(target);
    }

    // No single linear verify-only required path.
    expect(Object.keys(jobs)).not.toContain("verify");
    expect(workflow).not.toContain("run: make ci");
    expect(workflow).not.toMatch(/continue-on-error:\s*true/i);

    for (const graphJob of CI_REQUIRED_SUITE_JOBS) {
      expect(Object.keys(jobs)).toContain(graphJob.id);
      expect(normalizeNeeds(jobs[graphJob.id]?.needs)).toEqual([
        ...graphJob.needs,
      ]);
      const targets = jobMakeTargets(jobs[graphJob.id]);
      for (const target of graphJob.makeTargets) {
        expect(targets).toContain(target);
      }
    }

    for (const edge of CI_REQUIRED_ORDERING_EDGES) {
      expect(normalizeNeeds(jobs[edge.to]?.needs)).toContain(edge.from);
    }

    expect(normalizeNeeds(jobs[CI_GATE_JOB_ID]?.needs).sort()).toEqual(
      [...ciRequiredJobNeeds(CI_GATE_JOB_ID)].sort(),
    );
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

    // make ci uses coverage alias only via component-coverage; never the old name alone.
    expect(prerequisites.has("coverage")).toBe(false);
    expect(prerequisites.has("component-coverage")).toBe(true);
  });
});

describe("ci required job-graph model", () => {
  test("names every Wave CI-1 required job including ci-gate", () => {
    expect([...CI_REQUIRED_JOB_IDS]).toEqual([
      "check",
      "unit-tests",
      "reader-facing",
      "a11y",
      "contracts",
      "component-coverage",
      "content",
      "static-export",
      "integration",
      "budget",
      "ci-gate",
    ]);
    expect(CI_REQUIRED_JOB_GRAPH.map((job) => job.id)).toEqual([
      ...CI_REQUIRED_JOB_IDS,
    ]);
    expect(CI_GATE_JOB_ID).toBe("ci-gate");
  });

  test("maps each non-gate job to its make target membership", () => {
    expect(getCiRequiredJob("check").makeTargets).toEqual(["check"]);
    expect(getCiRequiredJob("unit-tests").makeTargets).toEqual(["test"]);
    expect(getCiRequiredJob("reader-facing").makeTargets).toEqual([
      "test-reader-facing",
    ]);
    expect(getCiRequiredJob("a11y").makeTargets).toEqual(["a11y"]);
    expect(getCiRequiredJob("contracts").makeTargets).toEqual([
      "test-ci-contract",
      "test-verify-contract",
      "test-build-contract",
    ]);
    expect(getCiRequiredJob("component-coverage").makeTargets).toEqual([
      "component-coverage",
    ]);
    expect(getCiRequiredJob("content").makeTargets).toEqual([
      "validate-data",
      "linkcheck",
    ]);
    expect(getCiRequiredJob("static-export").makeTargets).toEqual(["build"]);
    expect(getCiRequiredJob("integration").makeTargets).toEqual([
      "test-integration",
    ]);
    expect(getCiRequiredJob("budget").makeTargets).toEqual(["budget"]);
    expect(getCiRequiredJob("ci-gate").makeTargets).toEqual([]);

    for (const job of CI_REQUIRED_SUITE_JOBS) {
      expect(job.makeTargets.length).toBeGreaterThan(0);
    }
  });

  test("encodes static-export before integration and budget without false peer edges", () => {
    expect(ciRequiredJobNeeds("integration")).toEqual(["static-export"]);
    expect(ciRequiredJobNeeds("budget")).toEqual(["static-export"]);

    for (const edge of CI_REQUIRED_ORDERING_EDGES) {
      expect(ciRequiredJobNeeds(edge.to)).toContain(edge.from);
    }

    const peerJobIds = [
      "check",
      "unit-tests",
      "reader-facing",
      "a11y",
      "contracts",
      "component-coverage",
      "content",
      "static-export",
    ] as const;

    for (const peerId of peerJobIds) {
      expect(ciRequiredJobNeeds(peerId)).toEqual([]);
    }

    // Independent peers must not invent serial edges between each other.
    for (const from of peerJobIds) {
      for (const to of peerJobIds) {
        if (from === to) continue;
        expect(ciRequiredJobNeeds(to)).not.toContain(from);
      }
    }

    expect(ciRequiredJobNeeds("ci-gate")).toEqual([
      "check",
      "unit-tests",
      "reader-facing",
      "a11y",
      "contracts",
      "component-coverage",
      "content",
      "static-export",
      "integration",
      "budget",
    ]);
  });

  test("job-graph suite membership covers shared required suites and workflow targets", () => {
    const graphTargets = new Set(ciRequiredJobGraphMakeTargets());

    for (const target of SHARED_REQUIRED_SUITE_TARGETS) {
      expect(graphTargets.has(target)).toBe(true);
    }

    for (const target of CI_WORKFLOW_REQUIRED_MAKE_TARGETS) {
      if (target === "setup") continue;
      expect(graphTargets.has(target)).toBe(true);
    }

    // setup stays a per-job prerequisite inventory entry, not a graph job.
    expect(graphTargets.has("setup")).toBe(false);
    expect(CI_WORKFLOW_REQUIRED_MAKE_TARGETS).toContain("setup");
  });

  test("make ci prerequisites stay sequential and include every shared required suite", () => {
    const makefile = readFileSync(makefilePath, "utf8");
    const prerequisites = parseMakefileCiPrerequisites(makefile);

    expect(prerequisites).toEqual([...MAKE_CI_PREREQUISITES]);
    expect(MAKE_CI_PREREQUISITES).toEqual([
      "lint",
      "typecheck",
      "test",
      "test-reader-facing",
      "a11y",
      "test-ci-contract",
      "test-verify-contract",
      "test-build-contract",
      "build",
      "test-integration",
      "budget",
      "component-coverage",
      "validate-data",
      "linkcheck",
    ]);

    for (const target of SHARED_REQUIRED_SUITE_TARGETS) {
      expect(MAKE_CI_PREREQUISITES).toContain(target);
      expect(prerequisites).toContain(target);
    }

    // Sequential local path still places build before consumers that need out/.
    const buildIndex = MAKE_CI_PREREQUISITES.indexOf("build");
    expect(MAKE_CI_PREREQUISITES.indexOf("test-integration")).toBeGreaterThan(
      buildIndex,
    );
    expect(MAKE_CI_PREREQUISITES.indexOf("budget")).toBeGreaterThan(buildIndex);
  });
});

describe("ci static-export artifact handoff contract (Wave CI-2)", () => {
  test("documents stable artifact identity, producer, and consumers", () => {
    expect(CI_STATIC_EXPORT_ARTIFACT_NAME).toBe("static-export-out");
    expect(CI_STATIC_EXPORT_ARTIFACT_PATH).toBe("out");
    expect(CI_STATIC_EXPORT_ARTIFACT_HANDOFF).toEqual({
      artifactName: "static-export-out",
      path: "out",
      producerJobId: "static-export",
      consumerJobIds: ["integration", "budget"],
      forbiddenConsumerMakeTargets: ["build", "build-export"],
    });
    expect([...CI_STATIC_EXPORT_ARTIFACT_CONSUMER_JOB_IDS]).toEqual([
      "integration",
      "budget",
    ]);
    expect([...CI_STATIC_EXPORT_FORBIDDEN_CONSUMER_MAKE_TARGETS]).toEqual([
      "build",
      "build-export",
    ]);

    expect(CI_STATIC_EXPORT_ARTIFACT_HANDOFF.producerJobId).toBe(
      "static-export",
    );
    expect(getCiRequiredJob("static-export").makeTargets).toContain("build");
    for (const consumerId of CI_STATIC_EXPORT_ARTIFACT_HANDOFF.consumerJobIds) {
      expect(ciRequiredJobNeeds(consumerId)).toEqual(["static-export"]);
      expect(CI_REQUIRED_ORDERING_EDGES).toContainEqual({
        from: "static-export",
        to: consumerId,
      });
    }
  });

  test("distinguishes needs: static-export ordering from rebuild-locally", () => {
    // Ordering edge alone is not the same as “must rebuild out/ locally”.
    expect(ciJobDependsOnStaticExportJob("integration")).toBe(true);
    expect(ciJobDependsOnStaticExportJob("budget")).toBe(true);
    expect(ciJobDependsOnStaticExportJob("static-export")).toBe(false);
    expect(ciJobDependsOnStaticExportJob("check")).toBe(false);

    // Wave CI-2: consumers reuse the trusted artifact — they do not rebuild.
    expect(ciJobConsumesStaticExportArtifact("integration")).toBe(true);
    expect(ciJobConsumesStaticExportArtifact("budget")).toBe(true);
    expect(ciJobConsumesStaticExportArtifact("static-export")).toBe(false);
    expect(ciJobConsumesStaticExportArtifact("check")).toBe(false);

    expect(ciJobForbidsLocalStaticExportRebuild("integration")).toBe(true);
    expect(ciJobForbidsLocalStaticExportRebuild("budget")).toBe(true);
    expect(ciJobForbidsLocalStaticExportRebuild("static-export")).toBe(false);
    expect(ciJobForbidsLocalStaticExportRebuild("unit-tests")).toBe(false);

    // Rebuild-locally posture is the forbidden combination: needs the producer
    // job but does not consume the artifact. CI-2 consumers must never match.
    expect(ciJobMustRebuildStaticExportLocally("integration")).toBe(false);
    expect(ciJobMustRebuildStaticExportLocally("budget")).toBe(false);
    expect(ciJobMustRebuildStaticExportLocally("static-export")).toBe(false);
    expect(ciJobMustRebuildStaticExportLocally("check")).toBe(false);

    for (const consumerId of CI_STATIC_EXPORT_ARTIFACT_CONSUMER_JOB_IDS) {
      expect(ciJobDependsOnStaticExportJob(consumerId)).toBe(true);
      expect(ciJobConsumesStaticExportArtifact(consumerId)).toBe(true);
      expect(ciJobForbidsLocalStaticExportRebuild(consumerId)).toBe(true);
      expect(ciJobMustRebuildStaticExportLocally(consumerId)).toBe(false);

      const makeTargets = getCiRequiredJob(consumerId).makeTargets;
      for (const forbidden of CI_STATIC_EXPORT_FORBIDDEN_CONSUMER_MAKE_TARGETS) {
        expect(makeTargets).not.toContain(forbidden);
      }
    }
  });

  test("preserves Wave CI-1 membership, edges, suites, and sequential make ci", () => {
    expect([...CI_REQUIRED_JOB_IDS]).toContain("static-export");
    expect([...CI_REQUIRED_JOB_IDS]).toContain("integration");
    expect([...CI_REQUIRED_JOB_IDS]).toContain("budget");
    expect([...CI_REQUIRED_JOB_IDS]).toContain("ci-gate");

    expect(ciRequiredJobNeeds("integration")).toEqual(["static-export"]);
    expect(ciRequiredJobNeeds("budget")).toEqual(["static-export"]);

    for (const target of SHARED_REQUIRED_SUITE_TARGETS) {
      expect(MAKE_CI_PREREQUISITES).toContain(target);
    }

    const buildIndex = MAKE_CI_PREREQUISITES.indexOf("build");
    expect(MAKE_CI_PREREQUISITES.indexOf("test-integration")).toBeGreaterThan(
      buildIndex,
    );
    expect(MAKE_CI_PREREQUISITES.indexOf("budget")).toBeGreaterThan(buildIndex);

    // Local make ci still builds once then runs consumers — no Actions artifact.
    expect(MAKE_CI_REPRODUCTION_COMMAND).toBe("make ci");
    expect(CI_STATIC_EXPORT_ARTIFACT_HANDOFF.consumerJobIds).not.toContain(
      "ci-gate",
    );
  });
});
