/**
 * Observable cache-reason and scale-count diagnostics for profiled static export.
 *
 * Collectors stay injectable so focused contract tests can stub the filesystem
 * without running a full multi-minute export.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import {
  createNotAvailableCacheReasons,
  createNotAvailableScaleCounts,
  type StaticExportBenchmarkMode,
  type StaticExportCacheReason,
  type StaticExportProfileCacheReasons,
  type StaticExportProfileScaleCounts,
  type StaticExportScaleCountValue,
} from "@/lib/build/static-export-profile";
import { CONTENT_RUNTIME_FINGERPRINTS_RELATIVE_PATH } from "@/lib/content/content-runtime-fingerprints";
import { CONTENT_RUNTIME_PREPARATION_STEPS } from "@/lib/content/content-runtime-preparation";
import { defaultLocale, supportedLocales } from "@/lib/i18n/locale-routing";

/** Relative paths used to diagnose warm vs clean cache presence before stages. */
export const STATIC_EXPORT_CACHE_ARTIFACT_PATHS = {
  nextCacheDirectory: ".next/cache",
  sourceDirectory: ".source",
  outDirectory: DEFAULT_EXPORT_OUT_DIR,
  chunksDirectory: `${DEFAULT_EXPORT_OUT_DIR}/_next/static/chunks`,
  contentRuntimeFingerprintStore: CONTENT_RUNTIME_FINGERPRINTS_RELATIVE_PATH,
} as const;

export type PathExistsFn = (path: string) => boolean;
export type ReadDirectoryNamesFn = (path: string) => readonly string[];
export type IsDirectoryFn = (path: string) => boolean;
export type FileSizeFn = (path: string) => number;

export type StaticExportCacheArtifactSnapshot = {
  nextCacheDirectoryPresent: boolean;
  sourceDirectoryPresent: boolean;
  outDirectoryPresent: boolean;
  /** Fingerprint store from a prior prepare:content-runtime. */
  contentRuntimeFingerprintStorePresent: boolean;
  /** All contracted content-runtime outputs exist and are non-empty. */
  contentRuntimeOutputsPresent: boolean;
};

export type CollectCacheArtifactSnapshotOptions = {
  cwd: string;
  pathExists?: PathExistsFn;
  fileSize?: FileSizeFn;
  /** Override contracted output paths (tests). Defaults to preparation steps. */
  contentRuntimeOutputPaths?: readonly string[];
};

export type CollectScaleCountsOptions = {
  cwd: string;
  pathExists?: PathExistsFn;
  readDirectoryNames?: ReadDirectoryNamesFn;
  isDirectory?: IsDirectoryFn;
  /** Locale ids considered for expansion counting. Defaults to site locales. */
  locales?: readonly string[];
};

function defaultReadDirectoryNames(path: string): readonly string[] {
  return readdirSync(path);
}

function defaultIsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function defaultFileSize(path: string): number {
  return statSync(path).size;
}

function areContentRuntimeOutputsPresent(
  cwd: string,
  outputPaths: readonly string[],
  pathExists: PathExistsFn,
  fileSize: FileSizeFn,
): boolean {
  for (const relativePath of outputPaths) {
    const absolutePath = join(cwd, relativePath);
    if (!pathExists(absolutePath)) {
      return false;
    }
    try {
      if (fileSize(absolutePath) <= 0) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return outputPaths.length > 0;
}

/**
 * Snapshots cache-relevant artifact presence before timed stages run. Used to
 * label hit/miss for stages with observable warm reuse.
 */
export function collectStaticExportCacheArtifactSnapshot(
  options: CollectCacheArtifactSnapshotOptions,
): StaticExportCacheArtifactSnapshot {
  const pathExists = options.pathExists ?? existsSync;
  const fileSize = options.fileSize ?? defaultFileSize;
  const contentRuntimeOutputPaths =
    options.contentRuntimeOutputPaths ??
    CONTENT_RUNTIME_PREPARATION_STEPS.map((step) => step.outputPath);

  return {
    nextCacheDirectoryPresent: pathExists(
      join(options.cwd, STATIC_EXPORT_CACHE_ARTIFACT_PATHS.nextCacheDirectory),
    ),
    sourceDirectoryPresent: pathExists(
      join(options.cwd, STATIC_EXPORT_CACHE_ARTIFACT_PATHS.sourceDirectory),
    ),
    outDirectoryPresent: pathExists(
      join(options.cwd, STATIC_EXPORT_CACHE_ARTIFACT_PATHS.outDirectory),
    ),
    contentRuntimeFingerprintStorePresent: pathExists(
      join(
        options.cwd,
        STATIC_EXPORT_CACHE_ARTIFACT_PATHS.contentRuntimeFingerprintStore,
      ),
    ),
    contentRuntimeOutputsPresent: areContentRuntimeOutputsPresent(
      options.cwd,
      contentRuntimeOutputPaths,
      pathExists,
      fileSize,
    ),
  };
}

function cacheReason(
  status: StaticExportCacheReason["status"],
  reason: string,
): StaticExportCacheReason {
  return { status, reason };
}

/**
 * Derives per-stage cache hit/miss/not-applicable reasons from benchmark mode
 * and the pre-stage artifact snapshot. Content-runtime uses fingerprint +
 * output presence; stages without incremental cache report not-applicable.
 */
export function deriveStaticExportCacheReasons(input: {
  mode: StaticExportBenchmarkMode;
  snapshot: StaticExportCacheArtifactSnapshot;
}): StaticExportProfileCacheReasons {
  const { mode, snapshot } = input;

  const contentRuntimePreparation =
    mode === "clean"
      ? cacheReason("miss", "clean-mode-regenerates")
      : snapshot.contentRuntimeFingerprintStorePresent &&
          snapshot.contentRuntimeOutputsPresent
        ? cacheReason("hit", "fingerprint-store-and-outputs-present")
        : cacheReason("miss", "fingerprint-store-or-outputs-absent");

  const fumadocsGeneration =
    mode === "clean" || !snapshot.sourceDirectoryPresent
      ? cacheReason("miss", "source-directory-absent")
      : cacheReason("hit", "source-directory-present");

  const nextCompilationStaticRendering =
    mode === "clean" || !snapshot.nextCacheDirectoryPresent
      ? cacheReason("miss", "next-cache-directory-absent")
      : cacheReason("hit", "next-cache-directory-present");

  return {
    contentRuntimePreparation,
    fumadocsGeneration,
    nextCompilationStaticRendering,
    searchIndexEmission: cacheReason(
      "not-applicable",
      "always-regenerates-from-export",
    ),
    fingerprintWriting: cacheReason(
      "not-applicable",
      "always-writes-fingerprint",
    ),
  };
}

function countFilesRecursively(
  rootPath: string,
  options: {
    pathExists: PathExistsFn;
    readDirectoryNames: ReadDirectoryNamesFn;
    isDirectory: IsDirectoryFn;
    shouldCount: (name: string) => boolean;
  },
): number {
  if (!options.pathExists(rootPath) || !options.isDirectory(rootPath)) {
    return 0;
  }

  let count = 0;
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }
    let names: readonly string[];
    try {
      names = options.readDirectoryNames(current);
    } catch {
      continue;
    }
    for (const name of names) {
      const childPath = join(current, name);
      if (options.isDirectory(childPath)) {
        stack.push(childPath);
        continue;
      }
      if (options.shouldCount(name)) {
        count += 1;
      }
    }
  }
  return count;
}

function availableCount(value: number): StaticExportScaleCountValue {
  return { available: true, value };
}

/**
 * Collects route/locale expansion and major bundle/module counts from export
 * artifacts. Missing optional paths degrade to explicit not-available reasons.
 */
export function collectStaticExportScaleCounts(
  options: CollectScaleCountsOptions,
): StaticExportProfileScaleCounts {
  const pathExists = options.pathExists ?? existsSync;
  const readDirectoryNames =
    options.readDirectoryNames ?? defaultReadDirectoryNames;
  const isDirectory = options.isDirectory ?? defaultIsDirectory;
  const locales = options.locales ?? supportedLocales;
  const outDir = join(
    options.cwd,
    STATIC_EXPORT_CACHE_ARTIFACT_PATHS.outDirectory,
  );

  if (!pathExists(outDir) || !isDirectory(outDir)) {
    return createNotAvailableScaleCounts("export-out-missing");
  }

  let staticRouteCount: StaticExportScaleCountValue;
  try {
    staticRouteCount = availableCount(
      countFilesRecursively(outDir, {
        pathExists,
        readDirectoryNames,
        isDirectory,
        shouldCount: (name) => name.endsWith(".html"),
      }),
    );
  } catch {
    staticRouteCount = {
      available: false,
      reason: "static-route-count-unreadable",
    };
  }

  let localeCount: StaticExportScaleCountValue;
  try {
    const names = new Set(readDirectoryNames(outDir));
    // Default locale ships unprefixed; other locales expand under out/<locale>/.
    let expanded = 1;
    for (const locale of locales) {
      if (locale === defaultLocale) {
        continue;
      }
      const localeDir = join(outDir, locale);
      if (names.has(locale) && isDirectory(localeDir)) {
        expanded += 1;
      }
    }
    localeCount = availableCount(expanded);
  } catch {
    localeCount = { available: false, reason: "locale-count-unreadable" };
  }

  const chunksDir = join(
    options.cwd,
    STATIC_EXPORT_CACHE_ARTIFACT_PATHS.chunksDirectory,
  );
  let majorBundleModuleCount: StaticExportScaleCountValue;
  if (!pathExists(chunksDir) || !isDirectory(chunksDir)) {
    majorBundleModuleCount = {
      available: false,
      reason: "chunks-directory-missing",
    };
  } else {
    try {
      majorBundleModuleCount = availableCount(
        countFilesRecursively(chunksDir, {
          pathExists,
          readDirectoryNames,
          isDirectory,
          shouldCount: (name) =>
            name.endsWith(".js") ||
            name.endsWith(".css") ||
            name.endsWith(".woff2"),
        }),
      );
    } catch {
      majorBundleModuleCount = {
        available: false,
        reason: "bundle-module-count-unreadable",
      };
    }
  }

  return {
    staticRouteCount,
    localeCount,
    majorBundleModuleCount,
  };
}

/**
 * Safe wrappers used by the profiled runner: never throw into the timing path.
 */
export function safeCollectStaticExportCacheReasons(input: {
  cwd: string;
  mode: StaticExportBenchmarkMode;
  pathExists?: PathExistsFn;
}): StaticExportProfileCacheReasons {
  try {
    const snapshot = collectStaticExportCacheArtifactSnapshot({
      cwd: input.cwd,
      pathExists: input.pathExists,
    });
    return deriveStaticExportCacheReasons({
      mode: input.mode,
      snapshot,
    });
  } catch {
    return createNotAvailableCacheReasons("cache-diagnostics-failed");
  }
}

export function safeCollectStaticExportScaleCounts(
  options: CollectScaleCountsOptions,
): StaticExportProfileScaleCounts {
  try {
    return collectStaticExportScaleCounts(options);
  } catch {
    return createNotAvailableScaleCounts("scale-diagnostics-failed");
  }
}
