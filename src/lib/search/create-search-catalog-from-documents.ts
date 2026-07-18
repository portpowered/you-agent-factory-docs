import { initAdvancedSearch } from "fumadocs-core/search/server";
import { toAdvancedSearchIndexes } from "./to-advanced-index";
import type { SearchDocument } from "./types";

/**
 * Orama index language for every shipped UI locale catalog.
 *
 * W16-007: keep English stemming/tokenization even when the reader UI locale
 * is `ja` / `zh-CN` / `vi`, so canonical English operation IDs, field paths,
 * commands, tools, symbols, and event discriminators stay findable. Full
 * chrome/language-boundary localization remains W17.
 */
export const FACTORY_SEARCH_ORAMA_LANGUAGE = "english" as const;

/**
 * Build an advanced Orama search server from already-parsed search documents.
 * Used by export emission so locale bootstrap writes do not re-walk sources.
 * Always indexes with {@link FACTORY_SEARCH_ORAMA_LANGUAGE} regardless of UI locale.
 */
export function createSearchServerFromDocuments(
  documents: SearchDocument[],
): ReturnType<typeof initAdvancedSearch> {
  return initAdvancedSearch({
    language: FACTORY_SEARCH_ORAMA_LANGUAGE,
    indexes: toAdvancedSearchIndexes(documents),
  });
}

/** Export the Fumadocs advanced Orama payload from parsed documents. */
export async function exportAdvancedOramaFromDocuments(
  documents: SearchDocument[],
): Promise<unknown> {
  return createSearchServerFromDocuments(documents).export();
}
