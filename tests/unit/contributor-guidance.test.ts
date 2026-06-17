import { describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { withNextTypeArtifactLock } from "../../src/lib/validation/next-type-artifact-lock";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { dryRunMake } from "../helpers/make";
import { runMakeTarget } from "../helpers/make-target";

const repoRoot = join(import.meta.dir, "../..");

function cleanNextTypeArtifacts() {
  rmSync(join(repoRoot, ".next"), { recursive: true, force: true });
  rmSync(join(repoRoot, "tsconfig.tsbuildinfo"), { force: true });
}

describe("contributor guidance observable outcomes", () => {
  test("make setup installs dependencies from the repository root", () => {
    const result = runMakeTarget("setup");
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/bun install/);
    expect(existsSync(join(repoRoot, "node_modules"))).toBe(true);
  });

  test("make check surfaces typecheck and lint verification through one command", () => {
    const result = withNextTypeArtifactLock(repoRoot, () => {
      cleanNextTypeArtifacts();
      return runMakeTarget("check");
    });

    expect(result.status).toBe(0);
    expect(result.output).toMatch(/typecheck/);
    expect(result.output).toMatch(/lint/);
    expect(result.output.indexOf("typecheck")).toBeLessThan(
      result.output.indexOf("lint"),
    );
  }, 30_000);

  test("make test runs the automated suite through bun test", () => {
    expect(dryRunMake("test")).toContain("bun test");
  });

  test("make build proves the static export by requiring out/", () => {
    const result = withStaticExportBuildLock(repoRoot, () =>
      runMakeTarget("build"),
    );
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/Exporting/);
    expect(existsSync(join(repoRoot, "out"))).toBe(true);
  }, 120_000);
});
