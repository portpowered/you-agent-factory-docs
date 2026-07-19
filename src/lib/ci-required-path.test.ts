import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CI_GATE_JOB_ID,
  CI_REQUIRED_JOB_GRAPH,
  CI_REQUIRED_JOB_IDS,
  CI_REQUIRED_ORDERING_EDGES,
  CI_REQUIRED_SUITE_JOBS,
  CI_WORKFLOW_REQUIRED_MAKE_TARGETS,
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

  test("CI workflow invokes the aligned make targets including validate-data and linkcheck", () => {
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
