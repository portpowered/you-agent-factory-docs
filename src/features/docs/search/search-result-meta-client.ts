import { resolveReferenceItemDeepLinkUrl } from "@/lib/search/collapse-search-results-to-page-hits";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "@/lib/search/factory-search-kinds";
import type { SearchResultMeta } from "@/lib/search/search-result-meta";

export type SearchResultMetaRecord = Record<string, SearchResultMeta>;

function synthesizeReferenceItemMeta(
  url: string,
): SearchResultMeta | undefined {
  const itemUrl = resolveReferenceItemDeepLinkUrl(url);
  if (itemUrl === undefined) {
    return undefined;
  }
  const fragment = itemUrl.split("#")[1] ?? itemUrl;
  return {
    title: fragment,
    kind: REFERENCE_SEARCH_DOCUMENT_KIND,
    description: "",
    tags: [],
    aliases: [],
  };
}

export function resolveSearchResultMeta(
  url: string,
  metaByUrl: SearchResultMetaRecord,
): SearchResultMeta | undefined {
  return metaByUrl[url] ?? synthesizeReferenceItemMeta(url);
}

export function getMatchedTags(query: string, tags: string[]): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return tags.filter((tag) => {
    const value = tag.toLowerCase();
    return value.includes(normalized) || normalized.includes(value);
  });
}
