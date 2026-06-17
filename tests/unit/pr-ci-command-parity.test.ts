import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");

describe("pull-request CI command parity", () => {
  test("workflow visibly runs the required top-level make path before supplemental gates", () => {
    const ciWorkflow = readFileSync(
      join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );

    const requiredCommands = [
      "make setup",
      "bunx playwright install --with-deps chromium",
      "make check",
      "make test",
      "make build",
      "make quality-gate",
      "make budget",
      "make component-coverage",
    ];

    for (const command of requiredCommands) {
      expect(ciWorkflow).toContain(command);
    }

    expect(ciWorkflow.indexOf("make setup")).toBeLessThan(
      ciWorkflow.indexOf("make check"),
    );
    expect(ciWorkflow.indexOf("make check")).toBeLessThan(
      ciWorkflow.indexOf("make test"),
    );
    expect(ciWorkflow.indexOf("make test")).toBeLessThan(
      ciWorkflow.indexOf("make build"),
    );
    expect(ciWorkflow.indexOf("make build")).toBeLessThan(
      ciWorkflow.indexOf("make quality-gate"),
    );
    expect(ciWorkflow).not.toContain("bun run typecheck");
    expect(ciWorkflow).not.toContain("bun run lint");
    expect(ciWorkflow).not.toContain("bun test");
    expect(ciWorkflow).not.toContain("bun run build");
  });
});
