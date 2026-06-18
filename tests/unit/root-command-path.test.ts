import { describe, expect, test } from "bun:test";
import { dryRunMake } from "../helpers/make";
import { runMakeTarget } from "../helpers/make-target";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("root contributor command path", () => {
  testUnlessVerifying(
    "make setup completes successfully from the repository root",
    () => {
      const result = runMakeTarget("setup");

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/bun install/);
    },
  );

  testUnlessVerifying(
    "make check completes successfully from the repository root",
    () => {
      const result = runMakeTarget(
        "check",
        {},
        {
          cleanNextTypeArtifacts: true,
        },
      );

      expect(result.status).toBe(0);
      expect(result.output).toMatch(/typecheck/);
      expect(result.output).toMatch(/typegen/);
      expect(result.output).toMatch(/lint/);
    },
    120_000,
  );

  test("make test delegates to bun test from the repository root", () => {
    expect(dryRunMake("test")).toContain("bun test");
  });

  testUnlessVerifying(
    "make build completes successfully from the repository root",
    () => {
      const result = runMakeTarget("build");

      expect(result.status).toBe(0);
      expect(result.output).toMatch(/Exporting/);
    },
    120_000,
  );
});
