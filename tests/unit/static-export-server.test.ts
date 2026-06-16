import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { STATIC_EXPORT_SKIP_BUILD_ENV } from "../../src/lib/validation/static-export";
import {
  buildStaticExport,
  shouldSkipStaticExportBuild,
} from "../helpers/static-export-server";

const projectRoot = join(import.meta.dir, "../..");
const exportDir = join(projectRoot, "out");

describe("static export server helpers", () => {
  const originalSkipBuild = process.env[STATIC_EXPORT_SKIP_BUILD_ENV];

  afterEach(() => {
    if (originalSkipBuild === undefined) {
      delete process.env[STATIC_EXPORT_SKIP_BUILD_ENV];
    } else {
      process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = originalSkipBuild;
    }
  });

  test("shouldSkipStaticExportBuild reads STATIC_EXPORT_SKIP_BUILD", () => {
    process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = "1";
    expect(shouldSkipStaticExportBuild()).toBe(true);

    delete process.env[STATIC_EXPORT_SKIP_BUILD_ENV];
    expect(shouldSkipStaticExportBuild()).toBe(false);
  });

  test("buildStaticExport skips rebuild when STATIC_EXPORT_SKIP_BUILD is set and out/ exists", () => {
    if (!existsSync(exportDir)) {
      buildStaticExport();
    }

    process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = "1";

    expect(() => buildStaticExport()).not.toThrow();
  });

  test("buildStaticExport fails fast when skip is set but out/ is missing", () => {
    const backupDir = join(projectRoot, "out.skip-build-test-backup");
    let movedExport = false;

    if (existsSync(exportDir)) {
      rmSync(backupDir, { recursive: true, force: true });
      renameSync(exportDir, backupDir);
      movedExport = true;
    }

    process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = "1";

    expect(() => buildStaticExport()).toThrow(/missing at out\//);

    if (movedExport) {
      renameSync(backupDir, exportDir);
    }
  });
});
