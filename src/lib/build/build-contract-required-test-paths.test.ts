import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  BUILD_CONTRACT_REQUIRED_SUITE_COMMAND,
  BUILD_CONTRACT_REQUIRED_TEST_PATHS,
} from "./build-contract-required-test-paths";

const repoRoot = join(import.meta.dir, "../../..");

describe("BUILD_CONTRACT_REQUIRED_TEST_PATHS", () => {
  test("lists a non-empty set of existing build-contract files", () => {
    expect(BUILD_CONTRACT_REQUIRED_TEST_PATHS.length).toBeGreaterThan(0);
    for (const relativePath of BUILD_CONTRACT_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps Atlas built-app / built-route assertion patterns out", () => {
    for (const relativePath of BUILD_CONTRACT_REQUIRED_TEST_PATHS) {
      expect(relativePath).not.toMatch(/-built-app(?:\.|$)/);
      expect(relativePath).not.toMatch(/-built-route-convergence(?:\.|$)/);
    }
  });

  test("documents the maintainer reproduction command", () => {
    expect(BUILD_CONTRACT_REQUIRED_SUITE_COMMAND).toBe(
      "make test-build-contract",
    );
  });
});
