import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dryRunMake } from "../helpers/make";
import { runMakeTarget } from "../helpers/make-target";

const repoRoot = join(import.meta.dir, "../..");
const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("contributor guidance observable outcomes", () => {
  testUnlessVerifying(
    "make setup installs dependencies from the repository root",
    () => {
      const result = runMakeTarget("setup");
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/bun install/);
      expect(existsSync(join(repoRoot, "node_modules"))).toBe(true);
    },
  );

  testUnlessVerifying(
    "make check surfaces typecheck and lint verification through one command",
    () => {
      const output = dryRunMake("check");

      expect(output).toMatch(/bun run typecheck/);
      expect(output).toMatch(/bun run lint/);
      expect(output.indexOf("typecheck")).toBeLessThan(output.indexOf("lint"));
    },
  );

  testUnlessVerifying(
    "make test runs the automated suite through bun test",
    () => {
      expect(dryRunMake("test")).toContain("bun test");
    },
  );

  testUnlessVerifying(
    "make build proves the static export by requiring out/",
    () => {
      const output = dryRunMake("build");

      expect(output).toMatch(/bun run build/);
      expect(output).toMatch(/test -d out/);
    },
  );
});
