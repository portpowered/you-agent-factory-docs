export {
  buildBaseSearchDocument,
  buildBaseSearchDocuments,
} from "./build-base-document";
export {
  BLOG_SEARCH_DOCUMENT_KIND,
  type BlogSearchPostSource,
  buildBlogBaseSearchDocument,
  buildBlogSearchDocument,
  buildBlogSearchDocuments,
  extractBlogMdxSearchText,
  loadBlogSearchPostSources,
  splitBlogPostMdxBody,
} from "./build-blog-search-document";
export {
  buildSearchDocument,
  buildSearchDocuments,
  buildSearchDocumentsForLocale,
} from "./build-documents";
export {
  enrichSearchDocument,
  enrichSearchDocuments,
} from "./enrich-search-document";
export {
  assertNoDeletedAiSearchDocuments,
  assertNoDeletedAiSearchUrl,
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  type DeletedAtlasBlogUrl,
  type DeletedAtlasRecordUrl,
  isDeletedAiSearchUrl,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
  type RetiredAtlasSearchUrlPrefix,
  stripSearchUrlLocalePrefix,
} from "./factory-search-deleted-records";
export {
  assertFactorySearchDocuments,
  assertFactorySearchResultKind,
  FACTORY_SEARCH_RESULT_KINDS,
  type FactorySearchResultKind,
  isFactorySearchResultKind,
  isRetiredAtlasSearchResultKind,
  RETIRED_ATLAS_SEARCH_RESULT_KINDS,
  type RetiredAtlasSearchResultKind,
} from "./factory-search-kinds";
export type { OramaSearchRecord, OramaSnapshotDocument } from "./orama-index";
export {
  createOramaDatabase,
  exportOramaIndexSnapshot,
  toOramaRecord,
  toOramaSnapshotDocument,
} from "./orama-index";
export { docsSearchApi } from "./search-server";
export type { DocsAdvancedSearchIndex } from "./to-advanced-index";
export {
  toAdvancedSearchIndex,
  toAdvancedSearchIndexes,
} from "./to-advanced-index";
export { toFumadocsIndexEntry, toStructuredData } from "./to-structured-data";
export type {
  BaseSearchDocument,
  FumadocsSearchIndexEntry,
  FumadocsStructuredData,
  GenericSearchDocumentFacets,
  SearchDocument,
  SearchDocumentFacets,
} from "./types";
export { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";
