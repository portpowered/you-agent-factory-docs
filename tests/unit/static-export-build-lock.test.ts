import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  STATIC_EXPORT_BUILD_LOCK_DIR,
  acquireStaticExportBuildLock,
  releaseStaticExportBuildLock,
  withStaticExportBuildLock,
} from "../../src/lib/validation/static-export-build-lock";

const projectRoot = join(import.meta.dir, "../..");

function createLockRoot(): string {
  return mkdtempSync(join(tmpdir(), "static-export-build-lock-"));
}

describe("static export build lock", () => {
  afterEach(() => {
    releaseStaticExportBuildLock(projectRoot);
  });

  test("withStaticExportBuildLock creates and releases the lock directory", () => {
    const lockRoot = createLockRoot();
    const lockDir = join(lockRoot, STATIC_EXPORT_BUILD_LOCK_DIR);

    try {
      expect(existsSync(lockDir)).toBe(false);

      withStaticExportBuildLock(lockRoot, () => {
        expect(existsSync(lockDir)).toBe(true);
      });

      expect(existsSync(lockDir)).toBe(false);
    } finally {
      rmSync(lockRoot, { recursive: true, force: true });
    }
  });

  test("withStaticExportBuildLock serializes concurrent build attempts", async () => {
    const lockRoot = createLockRoot();

    try {
      let activeBuilds = 0;
      let maxActiveBuilds = 0;

      const simulateBuild = () =>
        Promise.resolve().then(() =>
          withStaticExportBuildLock(lockRoot, () => {
            activeBuilds += 1;
            maxActiveBuilds = Math.max(maxActiveBuilds, activeBuilds);
            Bun.sleepSync(50);
            activeBuilds -= 1;
          }),
        );

      await Promise.all([simulateBuild(), simulateBuild()]);

      expect(maxActiveBuilds).toBe(1);
    } finally {
      rmSync(lockRoot, { recursive: true, force: true });
    }
  });

  test("releaseStaticExportBuildLock removes the lock for the current process", () => {
    const lockRoot = createLockRoot();
    const lockDir = join(lockRoot, STATIC_EXPORT_BUILD_LOCK_DIR);

    try {
      acquireStaticExportBuildLock(lockRoot);
      expect(existsSync(lockDir)).toBe(true);

      releaseStaticExportBuildLock(lockRoot);
      expect(existsSync(lockDir)).toBe(false);
    } finally {
      rmSync(lockRoot, { recursive: true, force: true });
    }
  });

  test("nested lock acquisition by the same process times out instead of reentering", () => {
    const lockRoot = createLockRoot();
    const lockDir = join(lockRoot, STATIC_EXPORT_BUILD_LOCK_DIR);

    try {
      acquireStaticExportBuildLock(lockRoot);
      expect(existsSync(lockDir)).toBe(true);

      expect(() => acquireStaticExportBuildLock(lockRoot, 100)).toThrow(
        /Timed out/,
      );
    } finally {
      releaseStaticExportBuildLock(lockRoot);
      rmSync(lockRoot, { recursive: true, force: true });
    }
  });
});
