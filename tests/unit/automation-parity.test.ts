import { describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { dryRunMake } from "../helpers/make";
import { runMakeTarget } from "../helpers/make-target";

const repoRoot = join(import.meta.dir, "../..");
const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

function cleanNextTypeArtifacts() {
  rmSync(join(repoRoot, ".next"), { recursive: true, force: true });
  rmSync(join(repoRoot, "tsconfig.tsbuildinfo"), { force: true });
}

describe("automation command parity", () => {
  testUnlessVerifying(
    "runs automated verification through the same ordered root make targets as ci",
    () => {
      const setup = runMakeTarget("setup");
      expect(setup.status).toBe(0);
      expect(setup.stdout).toMatch(/bun install/);

      const check = withStaticExportBuildLock(repoRoot, () => {
        cleanNextTypeArtifacts();
        return runMakeTarget("check");
      });
      expect(check.status).toBe(0);
      expect(check.output).toMatch(/typecheck/);
      expect(check.output).toMatch(/lint/);

      const build = runMakeTarget("build");
      expect(build.status).toBe(0);
      expect(build.output).toMatch(/Exporting/);
      expect(existsSync(join(repoRoot, "out"))).toBe(true);
    },
    180_000,
  );

  testUnlessVerifying(
    "make test delegates to bun test rather than a divergent runner",
    () => {
      expect(dryRunMake("test")).toContain("bun test");
    },
  );

  testUnlessVerifying(
    "verification failures surface through the root make command path",
    () => {
      const result = runMakeTarget("not-a-target");
      expect(result.status).not.toBe(0);
      expect(result.output.length).toBeGreaterThan(0);
    },
  );
});
