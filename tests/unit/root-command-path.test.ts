import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { dryRunMake } from "../helpers/make";
import { runMakeTarget } from "../helpers/make-target";

const projectRoot = join(import.meta.dir, "../..");

function cleanNextTypeArtifacts() {
  rmSync(join(projectRoot, ".next"), { recursive: true, force: true });
  rmSync(join(projectRoot, "tsconfig.tsbuildinfo"), { force: true });
}

describe("root contributor command path", () => {
  test("make setup completes successfully from the repository root", () => {
    const result = runMakeTarget("setup");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/bun install/);
  });

  test("make check completes successfully from the repository root", () => {
    const result = withStaticExportBuildLock(projectRoot, () => {
      cleanNextTypeArtifacts();
      return runMakeTarget("check");
    });

    expect(result.status).toBe(0);
    expect(result.output).toMatch(/typecheck/);
    expect(result.output).toMatch(/typegen/);
    expect(result.output).toMatch(/lint/);
  }, 30_000);

  test("make test delegates to bun test from the repository root", () => {
    expect(dryRunMake("test")).toContain("bun test --max-concurrency 4");
  });

  test("make build completes successfully from the repository root", () => {
    const result = runMakeTarget("build");

    expect(result.status).toBe(0);
    expect(result.output).toMatch(/Exporting/);
  }, 120_000);
});
