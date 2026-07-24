/**
 * Parent packaged-factories-index import-graph helpers.
 *
 * Pure classification stays separate from Bun.build I/O used to collect the
 * reachable module graph for the index-only ownership surface.
 */

/** Package and path markers the parent index graph must never reach. */
export const PARENT_IMPORT_GRAPH_FORBIDDEN_MARKERS = [
  "@you-agent-factory/factory-replay",
  "@you-agent-factory/factory-visualizers",
  "src/features/factory-replay/",
  ".factory-recording.v1.json",
] as const;

export type ParentImportGraphForbiddenMarker =
  (typeof PARENT_IMPORT_GRAPH_FORBIDDEN_MARKERS)[number];

export type ParentImportGraphForbiddenHit = {
  inputPath: string;
  marker: ParentImportGraphForbiddenMarker;
};

/**
 * Classify metafile/input paths that reach replay, visualizer, playback, or
 * recording modules. Matching is path-substring based so both package roots
 * (`node_modules/@you-agent-factory/factory-replay/...`) and repo-relative
 * feature modules are covered.
 */
export function findForbiddenParentImportGraphHits(
  inputPaths: readonly string[],
): ParentImportGraphForbiddenHit[] {
  const hits: ParentImportGraphForbiddenHit[] = [];

  for (const inputPath of inputPaths) {
    const normalized = inputPath.replaceAll("\\", "/");
    for (const marker of PARENT_IMPORT_GRAPH_FORBIDDEN_MARKERS) {
      if (normalized.includes(marker)) {
        hits.push({ inputPath, marker });
        break;
      }
    }
  }

  return hits;
}

export type CollectParentImportGraphInputsOptions = {
  /** Absolute entrypoint module path. */
  entrypoint: string;
  /**
   * Modules left external so the graph focuses on local ownership + resolved
   * package edges without pulling the full Next runtime.
   */
  external?: readonly string[];
};

export type CollectParentImportGraphInputsResult = {
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
 * Collect reachable module input paths for a parent ownership entrypoint via
 * Bun’s browser-targeted bundler metafile.
 */
export async function collectParentImportGraphInputs(
  options: CollectParentImportGraphInputsOptions,
): Promise<CollectParentImportGraphInputsResult> {
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
