import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  READER_FACING_REQUIRED_SUITE_COMMAND,
  READER_FACING_REQUIRED_TEST_PATHS,
} from "./reader-facing-required-test-paths";

const repoRoot = join(import.meta.dir, "../..");

describe("reader-facing required test paths", () => {
  test("lists a non-empty bounded suite with existing files", () => {
    expect(READER_FACING_REQUIRED_TEST_PATHS.length).toBeGreaterThan(0);
    expect(READER_FACING_REQUIRED_SUITE_COMMAND).toBe(
      "make test-reader-facing",
    );

    for (const relativePath of READER_FACING_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("covers search, layout, and a11y surfaces", () => {
    const joined = READER_FACING_REQUIRED_TEST_PATHS.join("\n");
    expect(joined).toContain("src/lib/search/");
    expect(joined).toContain("src/tests/search/");
    expect(joined).toContain("src/tests/layout/");
    expect(joined).toContain("src/tests/a11y/");
    expect(joined).not.toMatch(/-built-app\.test/);
    expect(joined).not.toMatch(/-built-route-convergence\.test/);
  });
});
