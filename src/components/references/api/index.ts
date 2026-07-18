/**
 * W08 unified HTTP/OpenAPI reference renderer ownership surface.
 *
 * Prefer importing from `@/components/references/api` for production API UI.
 * Keep overlay validators (W06), schema UI (W07), event catalog (W09), and
 * CLI/MCP/JS family renderers (W10) outside this tree. Do not reopen W01/W02
 * spike trees except to migrate reusable helpers into this surface.
 */

export {
  API_KEYBOARD_CONTROL_SELECTORS,
  API_PRINT_CHROME_ATTR,
  API_PRINT_CHROME_HIDE,
  API_PRINT_CONTENT_ATTR,
  API_PRINT_POLICY,
  API_PRINT_ROOT_ATTR,
  API_VERIFICATION_VIEWPORTS,
  type ApiPrintReadableFacts,
  type ApiVerificationViewport,
  apiHashFocusScrollBehavior,
  hasApiVisibleFocusRingClass,
  probeApiKeyboardControls,
  probeApiPrintReadableFacts,
} from "./a11y-verification";
export {
  ApiLocalServerBaseUrlNotice,
  type ApiLocalServerBaseUrlNoticeProps,
} from "./api-local-server-base-url";
export {
  API_METHOD_BADGE_ATTR,
  ApiMethodBadge,
  type ApiMethodBadgeProps,
  apiMethodBadgeLabel,
} from "./api-method-badge";
export {
  ApiNavigationVerificationHarness,
  type ApiNavigationVerificationHarnessProps,
} from "./api-navigation-verification-harness";
export {
  ApiOperationCopyLink,
  type ApiOperationCopyLinkProps,
} from "./api-operation-copy-link";
export {
  API_EXAMPLES_ATTR,
  ApiOperationExamples,
  type ApiOperationExamplesProps,
} from "./api-operation-examples";
export {
  ApiOperationFilter,
  type ApiOperationFilterProps,
} from "./api-operation-filter";
export {
  ApiOperationNavigation,
  type ApiOperationNavigationProps,
} from "./api-operation-navigation";
export {
  ApiOperationNavigator,
  type ApiOperationNavigatorProps,
} from "./api-operation-navigator";
export {
  ApiOperationSection,
  type ApiOperationSectionProps,
} from "./api-operation-section";
export {
  ApiReferenceHashController,
  type ApiReferenceHashControllerProps,
  focusApiOperationAnchor,
} from "./api-reference-hash-controller";
export {
  ApiReferenceMobileNavigator,
  type ApiReferenceMobileNavigatorProps,
} from "./api-reference-mobile-navigator";
export {
  ApiResponseMediaType,
  type ApiResponseMediaTypeProps,
} from "./api-response-media-type";
export {
  ApiSseOperationSummaryPanel,
  type ApiSseOperationSummaryProps,
} from "./api-sse-operation-summary";
export { ApiStatus } from "./api-status";
export { ApiSurface, type ApiSurfaceProps } from "./api-surface";
export {
  countOpenApiOperations,
  countOpenApiPaths,
} from "./count-openapi-operations";
export {
  isOpenApiProductionDependency,
  OPENAPI_PRODUCTION_ASYNCAPI_POLICY,
  OPENAPI_PRODUCTION_DEPENDENCY_SET,
  OPENAPI_PRODUCTION_PEER_NOTES,
  OPENAPI_PRODUCTION_PIN_STATUS,
  OPENAPI_PRODUCTION_RECORDED_STACK,
  OPENAPI_PRODUCTION_SELECTED_VERSION,
  OPENAPI_PRODUCTION_UPGRADE_CANDIDATE,
  type OpenApiProductionDependencyName,
} from "./dependency-selection";
export {
  type ApiLocalServerBaseUrlProjection,
  buildApiLocalServerBaseUrlFromArtifact,
} from "./load-local-server-base-url";
export {
  API_OPENAPI_PACKAGE_EXPORT,
  API_OPENAPI_SCHEMA_ID,
  API_OPENAPI_SOURCE_BASE_DIR,
  type LoadedApiOpenApiArtifact,
  loadApiOpenApiArtifact,
  normalizeApiOpenApiBundlerFsPath,
  resolveApiOpenApiArtifactFsPath,
  resolveApiOpenApiExportUrl,
} from "./load-openapi-artifact";
export {
  type ApiOperationDetailProjection,
  buildApiOperationDetailsFromArtifact,
} from "./load-operation-details";
export {
  type ApiOperationNavigationProjection,
  buildApiOperationNavigationFromArtifact,
  loadApiOperationNavigationProjection,
} from "./load-operation-navigation";
export {
  API_LOCAL_SERVER_BASE_URL_ATTR,
  API_LOCAL_SERVER_DEFAULT_DESCRIPTION,
  API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
  type ApiLocalServerBaseUrl,
  type ApiOpenApiServerEntry,
  apiLocalServerCopyAvoidsDocsHostAsApi,
  projectApiLocalServerBaseUrls,
  resolvePrimaryApiLocalServerBaseUrl,
} from "./local-server-base-url";
export {
  type ApiOpenApiOperation,
  type ApiOpenApiSinglePageProjection,
  apiOpenApiServer,
  apiOpenApiServerOmitsProxyUrl,
  loadApiOpenApiSinglePageProjection,
} from "./openapi-server";
export {
  API_HASH_CONTROLLER_ATTR,
  API_HASH_FOCUSED_ATTR,
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_COPY_LINK_ATTR,
  API_OPERATION_COPY_LINK_COPIED_LABEL,
  API_OPERATION_COPY_LINK_LABEL,
  API_OPERATION_SECTION_ATTR,
  API_REFERENCE_PAGE_PATH,
  type ApiOperationAnchorCollision,
  type ApiOperationAnchorInventory,
  type ApiOperationAnchorLike,
  apiOperationAnchorUrl,
  apiOperationCopyLinkValue,
  collectCollisionFreeApiOperationAnchors,
  normalizeApiOperationAnchor,
  readLocationHashAnchor,
  resolveApiOperationAnchor,
} from "./operation-anchors";
export {
  API_MEDIA_TYPE_ATTR,
  API_MEDIA_TYPE_KINDS,
  API_OPERATION_DETAIL_ATTR,
  API_PARAMETER_LOCATIONS,
  API_PARAMETERS_ATTR,
  API_REQUEST_BODY_ATTR,
  API_RESPONSES_ATTR,
  type ApiMediaContentDetail,
  type ApiMediaTypeKind,
  type ApiOperationDetail,
  type ApiOperationExample,
  type ApiOperationParameterDetail,
  type ApiOperationRequestBodyDetail,
  type ApiOperationResponseDetail,
  type ApiParameterLocation,
  apiMediaTypeKindLabel,
  apiMediaTypeLanguage,
  classifyApiMediaType,
  countApiOperationsWithAuthoredExamples,
  countApiOperationsWithEventStream,
  projectApiOperationDetail,
  projectApiOperationDetailsFromDocument,
  resolveOpenApiParameter,
} from "./operation-detail";
export {
  API_OPERATION_FILTER_ATTR,
  API_OPERATION_FILTER_EMPTY_MESSAGE,
  API_OPERATION_FILTER_EMPTY_TITLE,
  API_OPERATION_FILTER_LABEL,
  API_OPERATION_FILTER_PLACEHOLDER,
  apiOperationFilterHasNoMatches,
  apiOperationFilterQueryIsEmpty,
  apiOperationNavItemMatchesFilter,
  apiOperationTextMatchesFilter,
  filterApiOperationNavGroups,
  filterApiOperationNavModel,
  normalizeApiOperationFilterQuery,
} from "./operation-filter";
export {
  API_MOBILE_NAV_ATTR,
  API_MOBILE_NAV_CONTRACT,
  API_MOBILE_NAV_LIST_ATTR,
  API_OPERATION_NAV_ARIA_LABEL,
  API_OPERATION_NAV_ATTR,
  API_OPERATION_NAV_LINK_ATTR,
  API_OPERATION_UNTAGGED_GROUP,
  API_PHONE_VIEWPORT,
  type ApiMobileNavContract,
  type ApiMobileNavHtmlProbe,
  type ApiOperationNavGroup,
  type ApiOperationNavItem,
  type ApiOperationNavModel,
  buildApiOperationNavModel,
  isApiMobileNavMarkupReady,
  probeApiMobileNavHtml,
  readOpenApiDocumentTagOrder,
  toApiOperationNavItem,
} from "./operation-navigation";
export {
  API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS,
  API_REFERENCE_OWNERSHIP_IMPORT,
  API_REFERENCE_OWNERSHIP_ROOT,
  type ApiReferenceForbiddenOwnershipRoot,
  isApiReferenceOwnershipPath,
  isForbiddenApiReferenceOwnershipPath,
} from "./ownership";
export {
  API_PLAYGROUND_OPTIONS,
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_PROXY_POLICY,
  apiReferencePlaygroundPageOptions,
  assertsNoApiProxyUrl,
  isApiPlaygroundSuppressed,
} from "./playground-suppression";
export {
  API_EVENTS_REFERENCE_PAGE_PATH,
  type ApiSseEventsCatalogLink,
  type ApiSseHttpSemanticsEntry,
  type ApiSseHttpSemanticsField,
  type ApiSseOperationSummary,
  apiSseEventsCatalogLinkForSchemaRef,
  apiSseEventsCatalogLinkForStreamRole,
  apiSseOperationSummariesByOperationId,
  assertCompatibilityOnlyNeverPreferred,
  projectAllApiSseOperationSummaries,
  projectApiSseOperationSummary,
  resolveApiSseOperationSummary,
} from "./sse-operation-summary";
export {
  API_SSE_OPERATIONS,
  API_SSE_ROLE_ATTR,
  API_SSE_SUMMARY_ATTR,
  API_SSE_SUMMARY_SAFETY,
  type ApiSseOperation,
  type ApiSseOperationItem,
  type ApiSseRole,
  findApiSseOperation,
  isApiSseOperation,
} from "./sse-operations";
export {
  API_CODE_COPY_POLICY,
  API_CODE_PANEL_ATTR,
  API_METHOD_BADGE_TONE_CLASSES,
  API_SHIKI_OPTIONS,
  API_THEME_ROOT_ATTR,
  API_TOKEN_CLASSES,
  type ApiMethodBadgeToneKey,
  apiMethodBadgeToneClass,
  usesSemanticTokenClasses,
} from "./theme-tokens";
export {
  API_UI_STATUS_DEFAULT_MESSAGES,
  API_UI_STATUS_DEFAULT_TITLES,
  API_UI_STATUS_KINDS,
  type ApiStatusProps,
  type ApiUiStatus,
  type ApiUiStatusKind,
} from "./types";
