import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  VERIFY_CONTRACT_REQUIRED_SUITE_COMMAND,
  VERIFY_CONTRACT_REQUIRED_TEST_PATHS,
} from "./verify-contract-required-test-paths";

const repoRoot = join(import.meta.dir, "../../..");

describe("VERIFY_CONTRACT_REQUIRED_TEST_PATHS", () => {
  test("lists a non-empty set of existing factory verifier tooling contracts", () => {
    expect(VERIFY_CONTRACT_REQUIRED_TEST_PATHS.length).toBeGreaterThan(0);
    for (const relativePath of VERIFY_CONTRACT_REQUIRED_TEST_PATHS) {
      expect(relativePath.startsWith("src/lib/verify/")).toBe(true);
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("excludes retired Atlas built-route / built-app assertion filenames", () => {
    for (const relativePath of VERIFY_CONTRACT_REQUIRED_TEST_PATHS) {
      expect(relativePath).not.toMatch(/-built-route-convergence\.test\./);
      expect(relativePath).not.toMatch(/-built-app\.test\./);
    }
  });

  test("documents the maintainer reproduction command", () => {
    expect(VERIFY_CONTRACT_REQUIRED_SUITE_COMMAND).toBe(
      "make test-verify-contract",
    );
  });
});
