import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  listW20ClientChunkExclusionCoveredFamilies,
  W20_CLIENT_CHUNK_BROWSER_SAFE_MODULES,
  W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_FAMILIES,
  W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_TEST_PATHS,
  W20_CLIENT_CHUNK_EXCLUSION_SUITE_COMMAND,
  W20_CLIENT_CHUNK_EXCLUSION_SUITE_ENTRIES,
  W20_CLIENT_CHUNK_SERVER_ONLY_MODULES,
} from "./w20-client-chunk-exclusion-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 client-chunk exclusion convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_CLIENT_CHUNK_EXCLUSION_SUITE_COMMAND).toBe(
      "make test-w20-client-chunk-exclusion",
    );
  });

  test("lists a non-empty set of existing exclusion suite files", () => {
    expect(W20_CLIENT_CHUNK_EXCLUSION_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_TEST_PATHS.length).toBe(
      W20_CLIENT_CHUNK_EXCLUSION_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required client-chunk exclusion gate family", () => {
    const covered = listW20ClientChunkExclusionCoveredFamilies();
    expect(covered).toEqual(
      [...W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_FAMILIES].sort(),
    );

    for (const family of W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("locks browser-safe and server-only acquisition module inventories", () => {
    expect([...W20_CLIENT_CHUNK_BROWSER_SAFE_MODULES]).toEqual([
      "src/lib/references/api-package-public-exports.ts",
      "src/lib/references/api-package-manifest.ts",
      "src/lib/references/api-package-format-versions.ts",
      "src/lib/references/api-package-consumed-hash-ledger.ts",
    ]);

    expect([...W20_CLIENT_CHUNK_SERVER_ONLY_MODULES]).toEqual([
      "src/lib/references/api-package-artifact-resolver.ts",
      "src/lib/references/api-package-manifest-membership.ts",
      "src/lib/references/api-package-format-version-gate.ts",
      "src/lib/references/api-package-consumed-hash-ledger-generation.ts",
    ]);

    for (const relativePath of [
      ...W20_CLIENT_CHUNK_BROWSER_SAFE_MODULES,
      ...W20_CLIENT_CHUNK_SERVER_ONLY_MODULES,
    ]) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }

    const overlap = W20_CLIENT_CHUNK_BROWSER_SAFE_MODULES.filter((path) =>
      (W20_CLIENT_CHUNK_SERVER_ONLY_MODULES as readonly string[]).includes(
        path,
      ),
    );
    expect(overlap).toEqual([]);
  });
});
