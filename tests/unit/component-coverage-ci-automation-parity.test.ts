import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dryRunMake } from "../helpers/make";

const repoRoot = join(import.meta.dir, "../..");

describe("component coverage CI automation parity", () => {
  test("ci workflow invokes make component-coverage through the shared root command contract", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );

    expect(ciWorkflow).toContain("make component-coverage");
    expect(ciWorkflow).not.toContain("scripts/enforce-component-coverage");
    expect(ciWorkflow).not.toContain("bun run component-coverage");
  });

  test("make component-coverage delegates to the bun component-coverage script", () => {
    expect(dryRunMake("component-coverage")).toContain(
      "bun run component-coverage",
    );
  });
});
