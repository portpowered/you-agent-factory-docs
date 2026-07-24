/**
 * Fusion-child import-graph helpers.
 *
 * Pure classification for the fusion ownership surface (child MDX map + replay
 * mount). Reuses the parent Bun.build collector for reachable module paths.
 */

/** Markers the fusion ownership graph must never reach. */
export const FUSION_IMPORT_GRAPH_FORBIDDEN_MARKERS = [
  "review.factory-recording.v1.json",
  "goal.factory-recording.v1.json",
  "subagent.factory-recording.v1.json",
  "quorum.factory-recording.v1.json",
  "tts.factory-recording.v1.json",
  "generated/index.json",
  "generate-packaged-factories-index",
  "PackagedFactoriesIndex",
  "packaged-factories-index/page-mdx-components",
  "packaged-factories-index/replay-page-mdx-components",
] as const;

export type FusionImportGraphForbiddenMarker =
  (typeof FUSION_IMPORT_GRAPH_FORBIDDEN_MARKERS)[number];

export type FusionImportGraphForbiddenHit = {
  inputPath: string;
  marker: FusionImportGraphForbiddenMarker;
};

/**
 * Classify metafile/input paths that reach non-fusion recordings, the corpus
 * generator, or parent index renderer / shared placeholder modules.
 */
export function findForbiddenFusionImportGraphHits(
  inputPaths: readonly string[],
): FusionImportGraphForbiddenHit[] {
  const hits: FusionImportGraphForbiddenHit[] = [];

  for (const inputPath of inputPaths) {
    const normalized = inputPath.replaceAll("\\", "/");
    for (const marker of FUSION_IMPORT_GRAPH_FORBIDDEN_MARKERS) {
      if (normalized.includes(marker)) {
        hits.push({ inputPath, marker });
        break;
      }
    }
  }

  return hits;
}
