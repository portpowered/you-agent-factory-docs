import { describe, expect, test } from "bun:test";
import {
  collectStaticExportCacheArtifactSnapshot,
  collectStaticExportScaleCounts,
  deriveStaticExportCacheReasons,
  safeCollectStaticExportCacheReasons,
  safeCollectStaticExportScaleCounts,
} from "./static-export-profile-diagnostics";

describe("static-export-profile-diagnostics", () => {
  test("clean mode reports miss for content-runtime, fumadocs, and next cache stages", () => {
    const reasons = deriveStaticExportCacheReasons({
      mode: "clean",
      snapshot: {
        nextCacheDirectoryPresent: false,
        sourceDirectoryPresent: false,
        outDirectoryPresent: false,
        contentRuntimeFingerprintStorePresent: true,
        contentRuntimeOutputsPresent: true,
        immutableSnapshotStorePresent: false,
        exportSearchParsedDocumentsStorePresent: false,
      },
    });

    expect(reasons.contentRuntimePreparation).toEqual({
      status: "miss",
      reason: "clean-mode-regenerates",
    });
    expect(reasons.fumadocsGeneration).toEqual({
      status: "miss",
      reason: "clean-mode-regenerates",
    });
    expect(reasons.nextCompilationStaticRendering).toEqual({
      status: "miss",
      reason: "clean-mode-regenerates",
    });
    expect(reasons.searchIndexEmission).toEqual({
      status: "miss",
      reason: "clean-mode-regenerates",
    });
    expect(reasons.fingerprintWriting.status).toBe("not-applicable");
  });

  test("warm mode reports hit when cache artifacts are present", () => {
    const reasons = deriveStaticExportCacheReasons({
      mode: "warm",
      snapshot: {
        nextCacheDirectoryPresent: true,
        sourceDirectoryPresent: true,
        outDirectoryPresent: true,
        contentRuntimeFingerprintStorePresent: true,
        contentRuntimeOutputsPresent: true,
        immutableSnapshotStorePresent: true,
        exportSearchParsedDocumentsStorePresent: true,
      },
    });

    expect(reasons.contentRuntimePreparation).toEqual({
      status: "hit",
      reason: "fingerprint-store-and-outputs-present",
    });
    expect(reasons.fumadocsGeneration).toEqual({
      status: "hit",
      reason: "immutable-snapshot-store-and-source-present",
    });
    expect(reasons.nextCompilationStaticRendering).toEqual({
      status: "hit",
      reason: "next-compiler-cache-present",
    });
    expect(reasons.searchIndexEmission).toEqual({
      status: "hit",
      reason: "parsed-documents-store-present",
    });
  });

  test("warm mode reports content-runtime miss when fingerprint store or outputs are absent", () => {
    expect(
      deriveStaticExportCacheReasons({
        mode: "warm",
        snapshot: {
          nextCacheDirectoryPresent: true,
          sourceDirectoryPresent: true,
          outDirectoryPresent: true,
          contentRuntimeFingerprintStorePresent: false,
          contentRuntimeOutputsPresent: true,
          immutableSnapshotStorePresent: true,
          exportSearchParsedDocumentsStorePresent: true,
        },
      }).contentRuntimePreparation,
    ).toEqual({
      status: "miss",
      reason: "fingerprint-store-or-outputs-absent",
    });

    expect(
      deriveStaticExportCacheReasons({
        mode: "warm",
        snapshot: {
          nextCacheDirectoryPresent: true,
          sourceDirectoryPresent: true,
          outDirectoryPresent: true,
          contentRuntimeFingerprintStorePresent: true,
          contentRuntimeOutputsPresent: false,
          immutableSnapshotStorePresent: true,
          exportSearchParsedDocumentsStorePresent: true,
        },
      }).contentRuntimePreparation,
    ).toEqual({
      status: "miss",
      reason: "fingerprint-store-or-outputs-absent",
    });
  });

  test("warm mode reports fumadocs miss when immutable snapshot store or source is absent", () => {
    expect(
      deriveStaticExportCacheReasons({
        mode: "warm",
        snapshot: {
          nextCacheDirectoryPresent: true,
          sourceDirectoryPresent: true,
          outDirectoryPresent: true,
          contentRuntimeFingerprintStorePresent: true,
          contentRuntimeOutputsPresent: true,
          immutableSnapshotStorePresent: false,
          exportSearchParsedDocumentsStorePresent: false,
        },
      }).fumadocsGeneration,
    ).toEqual({
      status: "miss",
      reason: "immutable-snapshot-store-or-source-absent",
    });

    expect(
      deriveStaticExportCacheReasons({
        mode: "warm",
        snapshot: {
          nextCacheDirectoryPresent: true,
          sourceDirectoryPresent: false,
          outDirectoryPresent: true,
          contentRuntimeFingerprintStorePresent: true,
          contentRuntimeOutputsPresent: true,
          immutableSnapshotStorePresent: true,
          exportSearchParsedDocumentsStorePresent: true,
        },
      }).fumadocsGeneration,
    ).toEqual({
      status: "miss",
      reason: "immutable-snapshot-store-or-source-absent",
    });
  });

  test("cache artifact snapshot uses injectable pathExists and fileSize", () => {
    const present = new Set([
      "/repo/.next/cache",
      "/repo/.source",
      "/repo/out",
      "/repo/src/lib/content/generated/.content-runtime-fingerprints.json",
      "/repo/.source/.static-export-immutable-snapshot.json",
      "/repo/.source/.export-search-parsed-documents.json",
      "/repo/src/lib/content/generated/a.generated.ts",
      "/repo/src/lib/content/generated/b.generated.ts",
    ]);
    const sizes = new Map([
      ["/repo/src/lib/content/generated/a.generated.ts", 12],
      ["/repo/src/lib/content/generated/b.generated.ts", 8],
    ]);
    const snapshot = collectStaticExportCacheArtifactSnapshot({
      cwd: "/repo",
      pathExists: (path) => present.has(path),
      fileSize: (path) => sizes.get(path) ?? 0,
      isDirectory: (path) => path === "/repo/.next/cache",
      readDirectoryNames: (path) =>
        path === "/repo/.next/cache" ? ["webpack"] : [],
      contentRuntimeOutputPaths: [
        "src/lib/content/generated/a.generated.ts",
        "src/lib/content/generated/b.generated.ts",
      ],
    });

    expect(snapshot).toEqual({
      nextCacheDirectoryPresent: true,
      sourceDirectoryPresent: true,
      outDirectoryPresent: true,
      contentRuntimeFingerprintStorePresent: true,
      contentRuntimeOutputsPresent: true,
      immutableSnapshotStorePresent: true,
      exportSearchParsedDocumentsStorePresent: true,
    });
  });

  test("cache artifact snapshot treats empty .next/cache as absent", () => {
    const snapshot = collectStaticExportCacheArtifactSnapshot({
      cwd: "/repo",
      pathExists: (path) => path === "/repo/.next/cache",
      isDirectory: (path) => path === "/repo/.next/cache",
      readDirectoryNames: () => [],
      contentRuntimeOutputPaths: [],
    });

    expect(snapshot.nextCacheDirectoryPresent).toBe(false);
  });

  test("warm mode reports next compiler cache miss when cache is absent", () => {
    expect(
      deriveStaticExportCacheReasons({
        mode: "warm",
        snapshot: {
          nextCacheDirectoryPresent: false,
          sourceDirectoryPresent: true,
          outDirectoryPresent: true,
          contentRuntimeFingerprintStorePresent: true,
          contentRuntimeOutputsPresent: true,
          immutableSnapshotStorePresent: true,
          exportSearchParsedDocumentsStorePresent: true,
        },
      }).nextCompilationStaticRendering,
    ).toEqual({
      status: "miss",
      reason: "next-compiler-cache-absent",
    });
  });

  test("warm mode reports search-index miss when parsed documents store is absent", () => {
    expect(
      deriveStaticExportCacheReasons({
        mode: "warm",
        snapshot: {
          nextCacheDirectoryPresent: true,
          sourceDirectoryPresent: true,
          outDirectoryPresent: true,
          contentRuntimeFingerprintStorePresent: true,
          contentRuntimeOutputsPresent: true,
          immutableSnapshotStorePresent: true,
          exportSearchParsedDocumentsStorePresent: false,
        },
      }).searchIndexEmission,
    ).toEqual({
      status: "miss",
      reason: "parsed-documents-store-absent",
    });
  });

  test("cache artifact snapshot treats empty content-runtime outputs as absent", () => {
    const present = new Set([
      "/repo/src/lib/content/generated/.content-runtime-fingerprints.json",
      "/repo/src/lib/content/generated/a.generated.ts",
    ]);
    const snapshot = collectStaticExportCacheArtifactSnapshot({
      cwd: "/repo",
      pathExists: (path) => present.has(path),
      fileSize: () => 0,
      contentRuntimeOutputPaths: ["src/lib/content/generated/a.generated.ts"],
    });

    expect(snapshot.contentRuntimeFingerprintStorePresent).toBe(true);
    expect(snapshot.contentRuntimeOutputsPresent).toBe(false);
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
