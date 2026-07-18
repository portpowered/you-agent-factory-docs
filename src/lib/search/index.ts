export {
  adaptReferenceSearchShapesToSearchDocuments,
  adaptReferenceSearchShapeToSearchDocument,
  enrichReferenceItemAliases,
  type ReferenceItemEnglishSearchFields,
  referenceItemEnglishSearchFields,
} from "./adapt-reference-search-document";
export {
  API_OPERATION_SEARCH_DOCUMENT_TAGS,
  type ApiOperationSearchDocumentsResult,
  type BuildApiOperationSearchDocumentsOptions,
  buildApiOperationSearchDocuments,
  loadApiOperationReferenceSearchShapes,
  resolveApiOperationSearchAnchor,
} from "./build-api-reference-search-documents";
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
  type BuildCliCommandSearchDocumentsOptions,
  type BuildJavascriptRuntimeSearchDocumentsOptions,
  type BuildMcpToolSearchDocumentsOptions,
  buildCliCommandSearchDocuments,
  buildJavascriptRuntimeSearchDocuments,
  buildMcpToolSearchDocuments,
  CLI_COMMAND_SEARCH_DOCUMENT_TAGS,
  type CliCommandSearchDocumentsResult,
  JAVASCRIPT_RUNTIME_SEARCH_DOCUMENT_TAGS,
  type JavascriptRuntimeSearchDocumentsResult,
  loadCliCommandReferenceSearchShapes,
  loadJavascriptRuntimeReferenceSearchShapes,
  loadMcpToolReferenceSearchShapes,
  MCP_TOOL_SEARCH_DOCUMENT_TAGS,
  type McpToolSearchDocumentsResult,
} from "./build-cli-mcp-javascript-reference-search-documents";
export {
  type BuildSearchDocumentsForLocaleOptions,
  buildSearchDocument,
  buildSearchDocuments,
  buildSearchDocumentsForLocale,
} from "./build-documents";
export {
  buildReferenceItemSearchDocuments,
  loadApiReferenceSearchShapes,
  loadCliReferenceSearchShapes,
  loadEventCorpusReferenceSearchShapes,
  loadJavascriptReferenceSearchShapes,
  loadMcpReferenceSearchShapes,
  loadSchemaFamilyReferenceSearchShapes,
  loadSettledReferenceSearchShapes,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "./build-reference-search-documents";
export {
  type BuildSchemaPackageSearchDocumentsOptions,
  buildSchemaPackageSearchDocuments,
  buildSchemaReferenceSearchDocuments,
  loadSchemaReferenceSearchShapes,
  SCHEMA_REFERENCE_PAGE_PATHS,
  SCHEMA_SEARCH_DOCUMENT_TAGS,
  type SchemaPackageSearchDocumentsResult,
  type SchemaReferencePagePath,
  type SchemaReferenceSearchDocumentsResult,
  schemaReferencePagePathForSubpath,
} from "./build-schema-reference-search-documents";
export { FACTORY_SEARCH_ORAMA_LANGUAGE } from "./create-search-catalog-from-documents";
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
  REFERENCE_SEARCH_DOCUMENT_KIND,
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
