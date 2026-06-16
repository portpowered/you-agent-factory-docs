import { describe, expect, test } from "bun:test";
import { runMakeTarget } from "../helpers/make-target";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("root contributor command path", () => {
  test("make setup completes successfully from the repository root", () => {
    const result = runMakeTarget("setup");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/bun install/);
  });

  test("make check completes successfully from the repository root", () => {
    const result = runMakeTarget("check");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/typecheck/);
    expect(result.stdout).toMatch(/lint/);
  }, 30_000);

  testUnlessVerifying(
    "make test completes successfully from the repository root",
    () => {
      const result = runMakeTarget("test", { VERIFYING_MAKE_TEST: "1" });

      expect(result.status).toBe(0);
      expect(result.output).toMatch(/\d+ pass/);
      expect(result.output).toMatch(/\n 0 fail\n/);
    },
    180_000,
  );

  test("make build completes successfully from the repository root", () => {
    const result = runMakeTarget("build");

    expect(result.status).toBe(0);
    expect(result.output).toMatch(/Exporting/);
  }, 120_000);
});
