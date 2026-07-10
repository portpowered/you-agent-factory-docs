/**
 * Fingerprint-gated immutable snapshot for static-export intermediate work.
 *
 * When contracted inputs are unchanged and a prior `.source` snapshot is
 * present and usable, the export path reuses it instead of re-running
 * `fumadocs-mdx`. Prefer correctness: missing/corrupt outputs, fingerprint
 * mismatch, or force-clean always regenerate.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  type ContentRuntimeFingerprintDependencies,
  type ContentRuntimeStepFingerprintInputs,
  computeContentRuntimeStepFingerprint,
  isContentRuntimeOutputUsable,
} from "@/lib/content/content-runtime-fingerprints";

/**
 * Bump when snapshot material or serialization changes so warm reuse
 * invalidates across builds after a format change.
 */
export const STATIC_EXPORT_IMMUTABLE_SNAPSHOT_SCHEMA_VERSION = 1;

/** Covered intermediate artifact (Fumadocs MDX bindings). */
export const STATIC_EXPORT_IMMUTABLE_SNAPSHOT_ARTIFACT_DIR = ".source";

/** Primary usability probe inside the snapshot artifact. */
export const STATIC_EXPORT_IMMUTABLE_SNAPSHOT_OUTPUT_PATH = ".source/server.ts";

/** Fingerprint store written beside the covered artifact. */
export const STATIC_EXPORT_IMMUTABLE_SNAPSHOT_STORE_RELATIVE_PATH =
  ".source/.static-export-immutable-snapshot.json";

/**
 * Declared fingerprint surfaces for the fumadocs intermediate snapshot.
 * Paths are repo-relative and stable across machines.
 */
export const STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FINGERPRINT_INPUTS: ContentRuntimeStepFingerprintInputs =
  {
    stepId: "static-export-immutable-snapshot",
    inputPaths: ["src/content/docs"],
    generatorPaths: [
      "source.config.ts",
      "scripts/ensure-static-export-immutable-snapshot.ts",
      "src/lib/build/static-export-immutable-snapshot.ts",
    ],
    schemaPaths: ["source.config.ts"],
  };

export type StaticExportImmutableSnapshotStore = {
  schemaVersion: number;
  fingerprint: string;
  coveredArtifact: string;
};

export type StaticExportImmutableSnapshotDecision =
  | {
      action: "reuse";
      reason: "cache-hit";
      fingerprint: string;
    }
  | {
      action: "regenerate";
      reason:
        | "force-clean"
        | "missing-output"
        | "unusable-output"
        | "fingerprint-miss"
        | "missing-or-corrupt-store";
      fingerprint: string;
    };

export type EnsureStaticExportImmutableSnapshotResult = {
  action: "reused" | "regenerated";
  reason: StaticExportImmutableSnapshotDecision["reason"];
  fingerprint: string;
  generationCount: number;
};

export type EnsureStaticExportImmutableSnapshotOptions = {
  cwd: string;
  forceClean?: boolean;
  dependencies?: ContentRuntimeFingerprintDependencies;
  evaluateDecision?: (options: {
    cwd: string;
    forceClean?: boolean;
    dependencies?: ContentRuntimeFingerprintDependencies;
  }) => StaticExportImmutableSnapshotDecision;
  recordSnapshot?: (
    cwd: string,
    fingerprint: string,
    dependencies?: ContentRuntimeFingerprintDependencies,
  ) => void;
  runGenerator?: (cwd: string) => void;
  log?: (message: string) => void;
};

let generationInvocationCount = 0;

function defaultWriteFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

export function resolveStaticExportImmutableSnapshotStorePath(
  cwd: string,
): string {
  return join(cwd, STATIC_EXPORT_IMMUTABLE_SNAPSHOT_STORE_RELATIVE_PATH);
}

export function computeStaticExportImmutableSnapshotFingerprint(
  cwd: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
  inputs: ContentRuntimeStepFingerprintInputs = STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FINGERPRINT_INPUTS,
): string {
  return computeContentRuntimeStepFingerprint(cwd, inputs, dependencies);
}

export function readStaticExportImmutableSnapshotStore(
  cwd: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): StaticExportImmutableSnapshotStore | null {
  const fileExists = dependencies.fileExists ?? existsSync;
  const readFile =
    dependencies.readFile ?? ((path) => readFileSync(path, "utf8"));
  const storePath = resolveStaticExportImmutableSnapshotStorePath(cwd);

  if (!fileExists(storePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      readFile(storePath),
    ) as Partial<StaticExportImmutableSnapshotStore>;
    if (
      parsed.schemaVersion !==
        STATIC_EXPORT_IMMUTABLE_SNAPSHOT_SCHEMA_VERSION ||
      typeof parsed.fingerprint !== "string" ||
      parsed.fingerprint.length === 0 ||
      parsed.coveredArtifact !== STATIC_EXPORT_IMMUTABLE_SNAPSHOT_ARTIFACT_DIR
    ) {
      return null;
    }
    return {
      schemaVersion: parsed.schemaVersion,
      fingerprint: parsed.fingerprint,
      coveredArtifact: parsed.coveredArtifact,
    };
  } catch {
    return null;
  }
}

export function writeStaticExportImmutableSnapshotStore(
  cwd: string,
  fingerprint: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): void {
  const writeFile = dependencies.writeFile ?? defaultWriteFile;
  const store: StaticExportImmutableSnapshotStore = {
    schemaVersion: STATIC_EXPORT_IMMUTABLE_SNAPSHOT_SCHEMA_VERSION,
    fingerprint,
    coveredArtifact: STATIC_EXPORT_IMMUTABLE_SNAPSHOT_ARTIFACT_DIR,
  };
  writeFile(
    resolveStaticExportImmutableSnapshotStorePath(cwd),
    `${JSON.stringify(store, null, 2)}\n`,
  );
}

/**
 * Decide whether the prior fumadocs `.source` snapshot can be reused.
 */
export function evaluateStaticExportImmutableSnapshot(options: {
  cwd: string;
  forceClean?: boolean;
  dependencies?: ContentRuntimeFingerprintDependencies;
  fingerprintInputs?: ContentRuntimeStepFingerprintInputs;
}): StaticExportImmutableSnapshotDecision {
  const dependencies = options.dependencies ?? {};
  const fingerprint = computeStaticExportImmutableSnapshotFingerprint(
    options.cwd,
    dependencies,
    options.fingerprintInputs,
  );

  if (options.forceClean === true) {
    return {
      action: "regenerate",
      reason: "force-clean",
      fingerprint,
    };
  }

  if (
    !isContentRuntimeOutputUsable(
      options.cwd,
      STATIC_EXPORT_IMMUTABLE_SNAPSHOT_OUTPUT_PATH,
      dependencies,
    )
  ) {
    const fileExists = dependencies.fileExists ?? existsSync;
    const absoluteOutputPath = join(
      options.cwd,
      STATIC_EXPORT_IMMUTABLE_SNAPSHOT_OUTPUT_PATH,
    );
    return {
      action: "regenerate",
      reason: fileExists(absoluteOutputPath)
        ? "unusable-output"
        : "missing-output",
      fingerprint,
    };
  }

  const store = readStaticExportImmutableSnapshotStore(
    options.cwd,
    dependencies,
  );
  if (!store) {
    return {
      action: "regenerate",
      reason: "missing-or-corrupt-store",
      fingerprint,
    };
  }

  if (store.fingerprint === fingerprint) {
    return {
      action: "reuse",
      reason: "cache-hit",
      fingerprint,
    };
  }

  return {
    action: "regenerate",
    reason: "fingerprint-miss",
    fingerprint,
  };
}

function defaultRunGenerator(cwd: string): void {
  const result = spawnSync("bunx", ["fumadocs-mdx"], {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  if (typeof result.status === "number" && result.status === 0) {
    return;
  }

  if (result.error) {
    throw result.error;
  }

  throw new Error(
    `fumadocs-mdx failed with exit status ${result.status ?? "null"}${
      result.signal ? ` (signal ${result.signal})` : ""
    }.`,
  );
}

/**
 * Ensure the fumadocs `.source` immutable snapshot is fingerprint-fresh.
 *
 * Cache hits skip `fumadocs-mdx` entirely so warm static exports reuse the
 * prior intermediate artifact when contracted inputs are unchanged.
 */
export function ensureStaticExportImmutableSnapshot(
  options: EnsureStaticExportImmutableSnapshotOptions,
): EnsureStaticExportImmutableSnapshotResult {
  const evaluateDecision =
    options.evaluateDecision ?? evaluateStaticExportImmutableSnapshot;
  const recordSnapshot =
    options.recordSnapshot ?? writeStaticExportImmutableSnapshotStore;
  const runGenerator = options.runGenerator ?? defaultRunGenerator;
  const log = options.log ?? console.log;
  const forceClean = options.forceClean === true;

  const decision = evaluateDecision({
    cwd: options.cwd,
    forceClean,
    dependencies: options.dependencies,
  });

  if (decision.action === "reuse") {
    log(
      `[static-export-immutable-snapshot] Cache hit; reusing ${STATIC_EXPORT_IMMUTABLE_SNAPSHOT_ARTIFACT_DIR} without regenerating.`,
    );
    return {
      action: "reused",
      reason: decision.reason,
      fingerprint: decision.fingerprint,
      generationCount: generationInvocationCount,
    };
  }

  log(
    `[static-export-immutable-snapshot] Regenerating ${STATIC_EXPORT_IMMUTABLE_SNAPSHOT_ARTIFACT_DIR} (${decision.reason}).`,
  );
  runGenerator(options.cwd);
  generationInvocationCount += 1;
  recordSnapshot(options.cwd, decision.fingerprint, options.dependencies);

  return {
    action: "regenerated",
    reason: decision.reason,
    fingerprint: decision.fingerprint,
    generationCount: generationInvocationCount,
  };
}

/** Test helper: reset generation counter. */
export function resetStaticExportImmutableSnapshotStateForTests(): void {
  generationInvocationCount = 0;
}

/** Test helper: how many times the generator has run in this process. */
export function getStaticExportImmutableSnapshotGenerationCountForTests(): number {
  return generationInvocationCount;
}
