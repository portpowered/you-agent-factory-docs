/**
 * Acquisition proofs for W03→W04 schema verification package models.
 * Asserts ancestor node_modules manifest resolution (webpack-safe) and
 * successful load of each documented schema public subpath.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  findInstalledApiPackageRoot,
  loadSchemaVerificationPackageModel,
  resolveApiPackageManifestFsPath,
  resolveSchemaVerificationFsPath,
} from "./load-schema-verification-models";
import { SCHEMA_VERIFICATION_PUBLIC_SUBPATHS } from "./normalize-json-schema-artifact";

describe("findInstalledApiPackageRoot", () => {
  test("finds the installed api package from the worktree cwd", () => {
    const packageRoot = findInstalledApiPackageRoot();
    expect(packageRoot).toMatch(/@you-agent-factory[/\\]api$/);
    expect(existsSync(join(packageRoot, "package.json"))).toBe(true);
  });
});

describe("resolveApiPackageManifestFsPath", () => {
  test("resolves a readable filesystem path (not a webpack module id)", () => {
    const manifestPath = resolveApiPackageManifestFsPath();
    expect(typeof manifestPath).toBe("string");
    expect(manifestPath).toMatch(/manifest\.json$/);
    expect(Number.isFinite(Number(manifestPath))).toBe(false);
    expect(existsSync(manifestPath)).toBe(true);
  });
});

describe("loadSchemaVerificationPackageModel", () => {
  test("loads each schema public subpath into a ready W04 model", () => {
    for (const subpath of SCHEMA_VERIFICATION_PUBLIC_SUBPATHS) {
      const schemaPath = resolveSchemaVerificationFsPath(subpath);
      expect(existsSync(schemaPath)).toBe(true);

      const model = loadSchemaVerificationPackageModel(subpath);
      expect(model.subpath).toBe(subpath);
      expect(model.specifier).toBe(`@you-agent-factory/api/${subpath}`);
      expect(model.root.title?.length ?? 0).toBeGreaterThan(0);
      expect(model.root.address.pointer).toBe(
        `/schemas/${subpath.split("/").at(-1)}`,
      );
    }
  });
});
