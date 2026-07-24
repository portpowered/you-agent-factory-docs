/**
 * Landing Youi compact-goal-replay import-graph helpers.
 *
 * Pure forbidden-marker classification stays separate from Bun.build I/O used
 * to collect the reachable module graph for the home client ownership surface.
 *
 * Allowed: `goal.factory-recording.v1.json` and shared factory-replay /
 * visualizer edges required for compact replay.
 * Forbidden: non-goal recordings, generated index corpus, raw JS source
 * artifacts, and the packaged-factories generator.
 */

/** Basename of the only generated recording the landing Youi client may import. */
export const YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME =
  "goal.factory-recording.v1.json" as const;

/** Substring markers the home/landing Youi client graph must never reach. */
export const YOUI_LANDING_IMPORT_GRAPH_FORBIDDEN_MARKERS = [
  "non-goal.factory-recording.v1.json",
  "generated/index.json",
  ".source.json",
  "generate-packaged-factories-index",
] as const;

export type YouiLandingImportGraphForbiddenMarker =
  (typeof YOUI_LANDING_IMPORT_GRAPH_FORBIDDEN_MARKERS)[number];

export type YouiLandingImportGraphForbiddenHit = {
  inputPath: string;
  marker: YouiLandingImportGraphForbiddenMarker;
};

const FACTORY_RECORDING_SUFFIX = ".factory-recording.v1.json";

function normalizeInputPath(inputPath: string): string {
  return inputPath.replaceAll("\\", "/");
}

function basenameOf(normalizedPath: string): string {
  const segments = normalizedPath.split("/");
  return segments[segments.length - 1] ?? normalizedPath;
}

/**
 * Classify whether a metafile/input path is a non-goal factory recording.
 * Matching is basename-based so path prefixes do not create false positives.
 */
export function isNonGoalFactoryRecordingInputPath(inputPath: string): boolean {
  const base = basenameOf(normalizeInputPath(inputPath));
  return (
    base.endsWith(FACTORY_RECORDING_SUFFIX) &&
    base !== YOUI_LANDING_ALLOWED_GOAL_RECORDING_BASENAME
  );
}

/**
 * Classify metafile/input paths that leak non-goal recordings, the generated
 * index corpus, raw JavaScript source artifacts, or the packaged-factory
 * generator into the home/landing Youi client ownership graph.
 */
export function findForbiddenYouiLandingImportGraphHits(
  inputPaths: readonly string[],
): YouiLandingImportGraphForbiddenHit[] {
  const hits: YouiLandingImportGraphForbiddenHit[] = [];

  for (const inputPath of inputPaths) {
    const normalized = normalizeInputPath(inputPath);

    if (isNonGoalFactoryRecordingInputPath(normalized)) {
      hits.push({
        inputPath,
        marker: "non-goal.factory-recording.v1.json",
      });
      continue;
    }

    for (const marker of YOUI_LANDING_IMPORT_GRAPH_FORBIDDEN_MARKERS) {
      if (marker === "non-goal.factory-recording.v1.json") continue;
      if (normalized.includes(marker)) {
        hits.push({ inputPath, marker });
        break;
      }
    }
  }

  return hits;
}

export type CollectYouiLandingImportGraphInputsOptions = {
  /** Absolute entrypoint module path. */
  entrypoint: string;
  /**
   * Modules left external so the graph focuses on local ownership + resolved
   * package edges without pulling the full Next runtime.
   */
  external?: readonly string[];
};

export type CollectYouiLandingImportGraphInputsResult = {
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
  // Keep the ownership graph focused on landing + local factory-replay sources.
  // Externalizing package dists also avoids flaky concurrent Bun.build reads of
  // shared node_modules while other suite files are running.
  "clsx",
  "tailwind-merge",
  "@you-agent-factory/client",
  "@you-agent-factory/factory-replay",
  "@you-agent-factory/factory-visualizers",
] as const;

/**
 * Collect reachable module input paths for a landing Youi client ownership
 * entrypoint via Bun’s browser-targeted bundler metafile.
 */
export async function collectYouiLandingImportGraphInputs(
  options: CollectYouiLandingImportGraphInputsOptions,
): Promise<CollectYouiLandingImportGraphInputsResult> {
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
