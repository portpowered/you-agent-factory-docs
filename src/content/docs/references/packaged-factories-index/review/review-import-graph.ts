/**
 * Review-child import-graph helpers.
 *
 * Pure classification for the review ownership surface (child MDX map + replay
 * mount). Reuses the parent Bun.build collector for reachable module paths.
 */

/** Markers the review ownership graph must never reach. */
export const REVIEW_IMPORT_GRAPH_FORBIDDEN_MARKERS = [
  "fusion.factory-recording.v1.json",
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

export type ReviewImportGraphForbiddenMarker =
  (typeof REVIEW_IMPORT_GRAPH_FORBIDDEN_MARKERS)[number];

export type ReviewImportGraphForbiddenHit = {
  inputPath: string;
  marker: ReviewImportGraphForbiddenMarker;
};

/**
 * Classify metafile/input paths that reach non-review recordings, the corpus
 * generator, or parent index renderer / shared placeholder modules.
 */
export function findForbiddenReviewImportGraphHits(
  inputPaths: readonly string[],
): ReviewImportGraphForbiddenHit[] {
  const hits: ReviewImportGraphForbiddenHit[] = [];

  for (const inputPath of inputPaths) {
    const normalized = inputPath.replaceAll("\\", "/");
    for (const marker of REVIEW_IMPORT_GRAPH_FORBIDDEN_MARKERS) {
      if (normalized.includes(marker)) {
        hits.push({ inputPath, marker });
        break;
      }
    }
  }

  return hits;
}
