import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  STATIC_EXPORT_BUILD_LOCK_DIR,
  acquireStaticExportBuildLock,
  releaseStaticExportBuildLock,
  withStaticExportBuildLock,
} from "../../src/lib/validation/static-export-build-lock";

const projectRoot = join(import.meta.dir, "../..");
const lockDir = join(projectRoot, STATIC_EXPORT_BUILD_LOCK_DIR);

describe("static export build lock", () => {
  afterEach(() => {
    releaseStaticExportBuildLock(projectRoot);
  });

  test("withStaticExportBuildLock creates and releases the lock directory", () => {
    expect(existsSync(lockDir)).toBe(false);

    withStaticExportBuildLock(projectRoot, () => {
      expect(existsSync(lockDir)).toBe(true);
    });

    expect(existsSync(lockDir)).toBe(false);
  });

  test("withStaticExportBuildLock serializes concurrent build attempts", async () => {
    let activeBuilds = 0;
    let maxActiveBuilds = 0;

    const simulateBuild = () =>
      Promise.resolve().then(() =>
        withStaticExportBuildLock(projectRoot, () => {
          activeBuilds += 1;
          maxActiveBuilds = Math.max(maxActiveBuilds, activeBuilds);
          Bun.sleepSync(50);
          activeBuilds -= 1;
        }),
      );

    await Promise.all([simulateBuild(), simulateBuild()]);

    expect(maxActiveBuilds).toBe(1);
  });

  test("releaseStaticExportBuildLock removes the lock for the current process", () => {
    acquireStaticExportBuildLock(projectRoot);
    expect(existsSync(lockDir)).toBe(true);

    releaseStaticExportBuildLock(projectRoot);
    expect(existsSync(lockDir)).toBe(false);
  });
});
