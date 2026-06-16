export {
  CONTENT_PUBLICATION_STATUSES,
  PUBLIC_CONTENT_KINDS,
  type CanonicalContentRecord,
  type ContentMetadataInput,
  type ContentPublicationStatus,
  type ContentValidationError,
  type ContentValidationFailure,
  type ContentValidationResult,
  type ContentValidationSuccess,
  type PublicContentKind,
} from "@/lib/content/types";
export {
  buildCanonicalId,
  buildRoutePath,
  isValidSlug,
  parseCanonicalId,
} from "@/lib/content/routes";
export { isValidLocaleTag, normalizeLocaleList } from "@/lib/content/locales";
export {
  validateExplicitStarterLocaleMetadata,
  validateLocaleRegistryMetadata,
} from "@/lib/content/locale-metadata-validation";
export { validateContentMetadata } from "@/lib/content/validation";
export {
  parseContentFile,
  parseFrontmatterBlock,
  type ParsedContentFile,
} from "@/lib/content/frontmatter";
export {
  buildMetadataFromStarterContent,
  buildStarterContentPathKey,
  STARTER_CONTENT_DIRECTORY_KINDS,
  validateStarterContent,
  validateStarterContentSource,
  type StarterContentDescriptor,
  type StarterContentDirectory,
  type StarterContentValidationFailure,
  type StarterContentValidationResult,
  type StarterContentValidationSuccess,
} from "@/lib/content/starter";
export {
  loadStarterContentRecords,
  requireStarterContentRecords,
  starterContentRootExists,
  type LoadedStarterContent,
} from "@/lib/content/load-starter-content";
export {
  assertStarterContentValid,
  StarterContentValidationError,
} from "@/lib/content/starter-content-errors";
export {
  listPublishedDocSlugs,
  loadDocPage,
  type DocPageContent,
  type LoadDocPageOptions,
} from "@/lib/content/load-doc-page";
export {
  resolveLocalizedContentVariant,
  selectLocalizedVariantBinding,
  type LocalizedContentResolution,
  type ResolveLocalizedContentVariantOptions,
} from "@/lib/content/localized-content-resolution";
export {
  projectLocaleAwareContent,
  projectLocaleAwareContentCatalog,
  type LocaleAwareContentProjection,
  type ProjectLocaleAwareContentCatalogOptions,
  type ProjectLocaleAwareContentOptions,
} from "@/lib/content/locale-aware-content-projection";
export {
  findCurrentDocsItemId,
  projectSharedShellDocsNavigation,
} from "@/lib/content/shared-shell-navigation";
export {
  projectDocsShellNavigation,
  type DocsShellNavPage,
  type DocsShellNavSection,
  type DocsShellNavigationInput,
} from "@/lib/content/docs-navigation";
export { loadDocsShellNavigation } from "@/lib/content/load-docs-navigation";
export {
  projectLocalizedVariantGroups,
  projectLocalizedVariantIdentity,
  validateLocalizedVariantBindings,
  type LocalizedContentVariantBinding,
  type LocalizedContentVariantIdentity,
  type LocalizedVariantGroup,
  type LocalizedVariantValidationFailure,
  type LocalizedVariantValidationResult,
  type LocalizedVariantValidationSuccess,
} from "@/lib/content/localized-variant-identity";
export {
  buildLocalizedSearchDocumentId,
  extractMarkdownHeadings,
  extractSearchableBody,
  generateLocalizedSearchDocuments,
  projectLocalizedSearchDocument,
  type LocalizedSearchDocument,
} from "@/lib/content/search-document";
export { loadLocalizedSearchDocuments } from "@/lib/content/load-search-documents";
