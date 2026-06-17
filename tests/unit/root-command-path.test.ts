import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { runMakeTarget } from "../helpers/make-target";

const projectRoot = join(import.meta.dir, "../..");

function cleanNextTypeArtifacts() {
  rmSync(join(projectRoot, ".next"), { recursive: true, force: true });
  rmSync(join(projectRoot, "tsconfig.tsbuildinfo"), { force: true });
}

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("root contributor command path", () => {
  test("make setup completes successfully from the repository root", () => {
    const result = runMakeTarget("setup");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/bun install/);
  });

  test("make check completes successfully from the repository root", () => {
    cleanNextTypeArtifacts();

    const result = runMakeTarget("check");

    expect(result.status).toBe(0);
    expect(result.output).toMatch(/typecheck/);
    expect(result.output).toMatch(/typegen/);
    expect(result.output).toMatch(/lint/);
  }, 30_000);

  testUnlessVerifying(
    "make test completes successfully from the repository root",
    () => {
      const result = runMakeTarget("test", {
        VERIFYING_MAKE_TEST: "1",
        STATIC_EXPORT_TEST_PORT: "3885",
        RECONCILED_EXPORT_BROWSER_TEST_PORT: "3886",
      });

      expect(result.status).toBe(0);
      expect(result.output).toMatch(/\d+ pass/);
      expect(result.output).toMatch(/\n 0 fail\n/);
    },
    300_000,
  );

  test("make build completes successfully from the repository root", () => {
    const result = runMakeTarget("build");

    expect(result.status).toBe(0);
    expect(result.output).toMatch(/Exporting/);
  }, 120_000);
});
