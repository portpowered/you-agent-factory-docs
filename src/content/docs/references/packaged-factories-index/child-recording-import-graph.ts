/**
 * Child packaged-factory recording import-graph helpers.
 *
 * Pure classification stays separate from Bun.build I/O used to collect the
 * reachable module graph for a child-owned page MDX map entrypoint. Proves
 * per-route recording isolation: each child map may reach only its own
 * `*.factory-recording.v1.json` among packaged-factory recordings.
 */

import { PACKAGED_FACTORY_RECORDING_SLUGS } from "@/lib/packaged-factory-generated-source-corpus/recording-samples-model";

/** Packaged recording filenames under `generated/`. */
export const PACKAGED_FACTORY_RECORDING_FILENAMES =
  PACKAGED_FACTORY_RECORDING_SLUGS.map(
    (slug) => `${slug}.factory-recording.v1.json` as const,
  );

export type PackagedFactoryRecordingFilename =
  (typeof PACKAGED_FACTORY_RECORDING_FILENAMES)[number];

export type ChildRecordingImportGraphHit = {
  inputPath: string;
  recordingFilename: PackagedFactoryRecordingFilename;
};

/**
 * Return the owned recording filename for a packaged-factory child slug.
 */
export function ownedPackagedFactoryRecordingFilename(
  ownedSlug: (typeof PACKAGED_FACTORY_RECORDING_SLUGS)[number],
): PackagedFactoryRecordingFilename {
  return `${ownedSlug}.factory-recording.v1.json`;
}

/**
 * Classify metafile/input paths that reach a packaged-factory recording other
 * than the owned child recording. Matching is filename-substring based so
 * both repo-relative and absolute bundled paths are covered.
 */
export function findForeignPackagedRecordingHits(
  inputPaths: readonly string[],
  ownedSlug: (typeof PACKAGED_FACTORY_RECORDING_SLUGS)[number],
): ChildRecordingImportGraphHit[] {
  const ownedFilename = ownedPackagedFactoryRecordingFilename(ownedSlug);
  const hits: ChildRecordingImportGraphHit[] = [];

  for (const inputPath of inputPaths) {
    const normalized = inputPath.replaceAll("\\", "/");
    for (const recordingFilename of PACKAGED_FACTORY_RECORDING_FILENAMES) {
      if (recordingFilename === ownedFilename) {
        continue;
      }
      if (normalized.includes(recordingFilename)) {
        hits.push({ inputPath, recordingFilename });
        break;
      }
    }
  }

  return hits;
}

/**
 * True when the reachable graph includes the owned packaged recording file.
 */
export function graphIncludesOwnedPackagedRecording(
  inputPaths: readonly string[],
  ownedSlug: (typeof PACKAGED_FACTORY_RECORDING_SLUGS)[number],
): boolean {
  const ownedFilename = ownedPackagedFactoryRecordingFilename(ownedSlug);
  return inputPaths.some((inputPath) =>
    inputPath.replaceAll("\\", "/").includes(ownedFilename),
  );
}

export type CollectChildRecordingImportGraphInputsOptions = {
  /** Absolute entrypoint module path (typically child `page-mdx-components.tsx`). */
  entrypoint: string;
  /**
   * Modules left external so the graph focuses on local ownership + resolved
   * package edges without pulling the full Next runtime.
   */
  external?: readonly string[];
};

export type CollectChildRecordingImportGraphInputsResult = {
  success: boolean;
  inputPaths: string[];
  failureMessages: string[];
};

const DEFAULT_EXTERNALS = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "next",
  "next/link",
  "next/navigation",
  "next/image",
  "next/headers",
  "next/dynamic",
] as const;

/**
 * Collect reachable module input paths for a child recording-ownership
 * entrypoint via Bun’s browser-targeted bundler metafile.
 */
export async function collectChildRecordingImportGraphInputs(
  options: CollectChildRecordingImportGraphInputsOptions,
): Promise<CollectChildRecordingImportGraphInputsResult> {
  try {
    const result = await Bun.build({
      entrypoints: [options.entrypoint],
      target: "browser",
      format: "esm",
      metafile: true,
      external: [...(options.external ?? DEFAULT_EXTERNALS)],
    });

    if (!result.success) {
      return {
        success: false,
        inputPaths: [],
        failureMessages: result.logs.map((log) => String(log)),
      };
    }

    return {
      success: true,
      inputPaths: Object.keys(result.metafile?.inputs ?? {}),
      failureMessages: [],
    };
  } catch (error) {
    const failureMessages: string[] = [];
    if (error instanceof AggregateError && Array.isArray(error.errors)) {
      for (const nested of error.errors) {
        failureMessages.push(
          nested instanceof Error ? nested.message : String(nested),
        );
      }
    }
    if (failureMessages.length === 0) {
      failureMessages.push(
        error instanceof Error ? error.message : String(error),
      );
    }
    return {
      success: false,
      inputPaths: [],
      failureMessages,
    };
  }
}
