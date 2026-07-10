import { initAdvancedSearch } from "fumadocs-core/search/server";
import { toAdvancedSearchIndexes } from "./to-advanced-index";
import type { SearchDocument } from "./types";

const SEARCH_LANGUAGE = "english";

/**
 * Build an advanced Orama search server from already-parsed search documents.
 * Used by export emission so locale bootstrap writes do not re-walk sources.
 */
export function createSearchServerFromDocuments(
  documents: SearchDocument[],
): ReturnType<typeof initAdvancedSearch> {
  return initAdvancedSearch({
    language: SEARCH_LANGUAGE,
    indexes: toAdvancedSearchIndexes(documents),
  });
}

/** Export the Fumadocs advanced Orama payload from parsed documents. */
export async function exportAdvancedOramaFromDocuments(
  documents: SearchDocument[],
): Promise<unknown> {
  return createSearchServerFromDocuments(documents).export();
}
