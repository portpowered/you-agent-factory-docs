import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CI_WORKFLOW_REQUIRED_MAKE_TARGETS,
  EXCLUDED_MAKE_CI_TARGETS,
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
