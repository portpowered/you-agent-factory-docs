import { describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { dryRunMake } from "../helpers/make";
import { runMakeTarget } from "../helpers/make-target";

const repoRoot = join(import.meta.dir, "../..");

function cleanNextTypeArtifacts() {
  rmSync(join(repoRoot, ".next"), { recursive: true, force: true });
  rmSync(join(repoRoot, "tsconfig.tsbuildinfo"), { force: true });
}

describe("automation command parity", () => {
  test("runs automated verification through the same ordered root make targets as ci", () => {
    const setup = runMakeTarget("setup");
    expect(setup.status).toBe(0);
    expect(setup.stdout).toMatch(/bun install/);

    cleanNextTypeArtifacts();
    const check = runMakeTarget("check");
    expect(check.status).toBe(0);
    expect(check.output).toMatch(/typecheck/);
    expect(check.output).toMatch(/lint/);

    const build = runMakeTarget("build");
    expect(build.status).toBe(0);
    expect(build.output).toMatch(/Exporting/);
    expect(existsSync(join(repoRoot, "out"))).toBe(true);
  }, 180_000);

  test("make test delegates to bun test rather than a divergent runner", () => {
    expect(dryRunMake("test")).toContain("bun test");
  });

  test("verification failures surface through the root make command path", () => {
    const result = runMakeTarget("not-a-target");
    expect(result.status).not.toBe(0);
    expect(result.output.length).toBeGreaterThan(0);
  });
});
