import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { loadBlogSearchPostSources } from "./build-blog-search-document";
import { buildSearchDocumentsForLocale } from "./build-documents";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "./factory-search-kinds";
import type { SearchDocument, SearchDocumentTopology } from "./types";

export type SearchResultMeta = {
  title: string;
  kind: string;
  description: string;
  tags: string[];
  /**
   * Optional: omitted for reference item documents so layout RSC payloads stay
   * small (W16). Client collapse falls back to `aliases`.
   */
  directAliases?: string[];
  aliases: string[];
  /**
   * Optional: omitted when empty / for reference items. Client collapse uses a
   * local empty topology when absent.
   */
  topology?: SearchDocumentTopology;
};

function isReferenceItemSearchDocument(document: SearchDocument): boolean {
  return (
    document.kind === REFERENCE_SEARCH_DOCUMENT_KIND &&
    document.url.includes("#")
  );
}

function isEmptyTopology(topology: SearchDocumentTopology): boolean {
  return (
    topology.secondaryClassificationIds.length === 0 &&
    topology.secondaryClassifications.length === 0 &&
    (topology.classificationIds?.length ?? 0) === 0 &&
    (topology.ancestorClassificationIds?.length ?? 0) === 0 &&
    (topology.ancestorClassifications?.length ?? 0) === 0 &&
    (topology.rootClassificationIds?.length ?? 0) === 0 &&
    (topology.rootClassifications?.length ?? 0) === 0 &&
    topology.relationships.length === 0 &&
    (topology.relatedTopologyIds?.length ?? 0) === 0 &&
    topology.terms.length === 0 &&
    topology.primaryClassificationId === undefined &&
    topology.primaryClassification === undefined
  );
}

/**
 * Build the client-facing search meta map embedded in layouts.
 *
 * Reference item documents (kind `reference` + `#fragment`) are omitted from
 * layout meta entirely — embedding ~585 item rows previously inflated every
 * static-export HTML/RSC payload by ~2 MiB. Client collapse preserves
 * `/docs/references/…#…` deep links via URL shape; Orama bootstrap still
 * indexes full item documents for findability.
 */
export function buildSearchResultMetaMap(
  documents: SearchDocument[],
): Map<string, SearchResultMeta> {
  const map = new Map<string, SearchResultMeta>();
  for (const document of documents) {
    if (isReferenceItemSearchDocument(document)) {
      continue;
    }

    const meta: SearchResultMeta = {
      title: document.title,
      kind: document.kind,
      description: document.description,
      tags: document.tags,
      directAliases: document.directAliases,
      aliases: document.aliases,
    };
    if (!isEmptyTopology(document.topology)) {
      meta.topology = document.topology;
    }
    map.set(document.url, meta);
  }
  return map;
}

export async function loadSearchResultMetaMap(): Promise<
  Map<string, SearchResultMeta>
>;
export async function loadSearchResultMetaMap(
  locale: SiteLocale,
): Promise<Map<string, SearchResultMeta>>;
export async function loadSearchResultMetaMap(
  locale: SiteLocale = defaultLocale,
): Promise<Map<string, SearchResultMeta>> {
  const indexes = await loadRegistry();
  const [pages, blogPosts] = await Promise.all([
    loadShippedLocalizedDocsPages(locale),
    loadBlogSearchPostSources({ locale }),
  ]);
  const documents = buildSearchDocumentsForLocale(
    locale,
    indexes,
    pages,
    blogPosts,
  );
  return buildSearchResultMetaMap(documents);
}
