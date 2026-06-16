import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");
const readmePath = join(repoRoot, "README.md");
const workflowPath = join(repoRoot, ".github/workflows/ci.yml");

const rootTargets = ["setup", "check", "test", "build"] as const;

function readReadme(): string {
  return readFileSync(readmePath, "utf8");
}

function readCiWorkflow(): string {
  return readFileSync(workflowPath, "utf8");
}

describe("contributor guidance", () => {
  test("readme identifies the authoritative root make workflow", () => {
    const readme = readReadme();

    expect(readme).toMatch(/authoritative/i);

    for (const target of rootTargets) {
      expect(readme).toMatch(new RegExp(`make\\s+${target}\\b`));
    }
  });

  test("readme documents observable outcomes for each root command", () => {
    const readme = readReadme();

    expect(readme).toMatch(/dependenc/i);
    expect(readme).toMatch(/typecheck|lint/i);
    expect(readme).toMatch(/\bbun test\b/);
    expect(readme).toMatch(/out\/|static export|static build/i);
  });

  test("documented command path matches ci automation targets", () => {
    const readme = readReadme();
    const workflow = readCiWorkflow();

    for (const target of rootTargets) {
      expect(readme).toMatch(new RegExp(`make\\s+${target}\\b`));
      expect(workflow).toMatch(new RegExp(`make\\s+${target}\\b`));
    }
  });
});
