import { describe, expect, test } from "bun:test";
import {
  collectStaticExportCacheArtifactSnapshot,
  collectStaticExportScaleCounts,
  deriveStaticExportCacheReasons,
  safeCollectStaticExportCacheReasons,
  safeCollectStaticExportScaleCounts,
} from "./static-export-profile-diagnostics";

describe("static-export-profile-diagnostics", () => {
  test("clean mode reports miss for fumadocs and next cache stages", () => {
    const reasons = deriveStaticExportCacheReasons({
      mode: "clean",
      snapshot: {
        nextCacheDirectoryPresent: false,
        sourceDirectoryPresent: false,
        outDirectoryPresent: false,
      },
    });

    expect(reasons.contentRuntimePreparation).toEqual({
      status: "not-applicable",
      reason: "no-incremental-cache",
    });
    expect(reasons.fumadocsGeneration).toEqual({
      status: "miss",
      reason: "source-directory-absent",
    });
    expect(reasons.nextCompilationStaticRendering).toEqual({
      status: "miss",
      reason: "next-cache-directory-absent",
    });
    expect(reasons.searchIndexEmission.status).toBe("not-applicable");
    expect(reasons.fingerprintWriting.status).toBe("not-applicable");
  });

  test("warm mode reports hit when cache artifacts are present", () => {
    const reasons = deriveStaticExportCacheReasons({
      mode: "warm",
      snapshot: {
        nextCacheDirectoryPresent: true,
        sourceDirectoryPresent: true,
        outDirectoryPresent: true,
      },
    });

    expect(reasons.fumadocsGeneration).toEqual({
      status: "hit",
      reason: "source-directory-present",
    });
    expect(reasons.nextCompilationStaticRendering).toEqual({
      status: "hit",
      reason: "next-cache-directory-present",
    });
  });

  test("cache artifact snapshot uses injectable pathExists", () => {
    const present = new Set([
      "/repo/.next/cache",
      "/repo/.source",
      "/repo/out",
    ]);
    const snapshot = collectStaticExportCacheArtifactSnapshot({
      cwd: "/repo",
      pathExists: (path) => present.has(path),
    });

    expect(snapshot).toEqual({
      nextCacheDirectoryPresent: true,
      sourceDirectoryPresent: true,
      outDirectoryPresent: true,
    });
  });

  test("scale counts report routes, locales, and major bundles from fixtures", () => {
    const directories = new Set([
      "/repo/out",
      "/repo/out/docs",
      "/repo/out/ja",
      "/repo/out/zh-CN",
      "/repo/out/_next",
      "/repo/out/_next/static",
      "/repo/out/_next/static/chunks",
    ]);
    const filesByDir: Record<string, string[]> = {
      "/repo/out": ["index.html", "docs", "ja", "zh-CN", "_next", "404.html"],
      "/repo/out/docs": ["getting-started.html"],
      "/repo/out/ja": ["index.html"],
      "/repo/out/zh-CN": ["index.html"],
      "/repo/out/_next": ["static"],
      "/repo/out/_next/static": ["chunks"],
      "/repo/out/_next/static/chunks": [
        "main.js",
        "app.css",
        "font.woff2",
        "readme.txt",
      ],
    };

    const counts = collectStaticExportScaleCounts({
      cwd: "/repo",
      locales: ["en", "ja", "zh-CN", "vi"],
      pathExists: (path) => directories.has(path),
      isDirectory: (path) => directories.has(path),
      readDirectoryNames: (path) => filesByDir[path] ?? [],
    });

    expect(counts.staticRouteCount).toEqual({ available: true, value: 5 });
    expect(counts.localeCount).toEqual({ available: true, value: 3 });
    expect(counts.majorBundleModuleCount).toEqual({
      available: true,
      value: 3,
    });
  });

  test("missing export out degrades scale counts to not-available", () => {
    const counts = collectStaticExportScaleCounts({
      cwd: "/repo",
      pathExists: () => false,
      isDirectory: () => false,
      readDirectoryNames: () => [],
    });

    expect(counts.staticRouteCount).toEqual({
      available: false,
      reason: "export-out-missing",
    });
    expect(counts.localeCount).toEqual({
      available: false,
      reason: "export-out-missing",
    });
    expect(counts.majorBundleModuleCount).toEqual({
      available: false,
      reason: "export-out-missing",
    });
  });

  test("safe collectors never throw and return not-available on failure", () => {
    const reasons = safeCollectStaticExportCacheReasons({
      cwd: "/repo",
      mode: "warm",
      pathExists: () => {
        throw new Error("boom");
      },
    });
    expect(reasons.contentRuntimePreparation.status).toBe("not-available");
    expect(reasons.contentRuntimePreparation.reason).toBe(
      "cache-diagnostics-failed",
    );

    const counts = safeCollectStaticExportScaleCounts({
      cwd: "/repo",
      pathExists: () => {
        throw new Error("boom");
      },
    });
    expect(counts.staticRouteCount).toEqual({
      available: false,
      reason: "scale-diagnostics-failed",
    });
  });
});
