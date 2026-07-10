import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  CI_CONTRACT_REQUIRED_SUITE_COMMAND,
  CI_CONTRACT_REQUIRED_TEST_PATHS,
} from "./ci-contract-required-test-paths";

const repoRoot = join(import.meta.dir, "../..");

describe("CI_CONTRACT_REQUIRED_TEST_PATHS", () => {
  test("lists a non-empty set of existing CI alignment contract files", () => {
    expect(CI_CONTRACT_REQUIRED_TEST_PATHS.length).toBeGreaterThan(0);
    for (const relativePath of CI_CONTRACT_REQUIRED_TEST_PATHS) {
      expect(relativePath.startsWith("src/tests/ci/")).toBe(true);
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps heavy fresh-checkout proofs out of the bounded required suite", () => {
    for (const relativePath of CI_CONTRACT_REQUIRED_TEST_PATHS) {
      expect(relativePath).not.toContain("fresh-checkout");
      expect(relativePath).not.toContain("content-runtime-preparation");
    }
  });

  test("documents the maintainer reproduction command", () => {
    expect(CI_CONTRACT_REQUIRED_SUITE_COMMAND).toBe("make test-ci-contract");
  });
});
