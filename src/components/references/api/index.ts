/**
 * W08 unified HTTP/OpenAPI reference renderer ownership surface.
 *
 * Prefer importing from `@/components/references/api` for production API UI.
 *
 * **Published primary operation renderer:** `ApiReferenceAPIPage` (Fumadocs
 * `createAPIPage`). Thin adapters that Fumadocs does not replace stay on this
 * barrel (local-server notice, tag nav, hash controller, status shell, SSE
 * summary panel).
 *
 * **Not on this barrel (harness / deep-import only):** the superseded custom
 * operation chrome (`api-operation-section`, `api-method-badge`,
 * `api-operation-examples`, `api-response-media-type`). Those modules remain
 * under this ownership tree for `/api-renderer-harness` and focused unit
 * fixtures — they are not the published `/docs/references/api` renderer path.
 *
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
  API_ACCENT_CHROME_QUIET_COLOR,
  API_ACCENT_CHROME_ROOT_ATTR,
  API_ACCENT_CHROME_SELECTED_COLOR,
  API_ACCENT_CHROME_STYLESHEET,
  API_ACCENT_METHOD_LABEL_COLOR_CLASSES,
  API_ACCENT_TAB_QUIET_SELECTOR,
  API_ACCENT_TAB_SELECTED_SELECTOR,
} from "./api-accent-chrome";
export {
  ApiOpenApiCodeBlock,
  type ApiOpenApiCodeBlockProps,
} from "./api-code-block";
export {
  ApiLocalServerBaseUrlNotice,
  type ApiLocalServerBaseUrlNoticeProps,
} from "./api-local-server-base-url";
export {
  ApiNavigationVerificationHarness,
  type ApiNavigationVerificationHarnessProps,
} from "./api-navigation-verification-harness";
export {
  ApiOperationCopyLink,
  type ApiOperationCopyLinkProps,
} from "./api-operation-copy-link";
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
  API_FUMADOCS_OPERATION_ATTR,
  API_FUMADOCS_OPERATIONS_ATTR,
  API_OPERATION_PATH_TOKEN_ATTR,
  API_PUBLISHED_PRIMARY_OPERATION_RENDERER,
  API_SCHEMA_COMPONENT_PROBE,
  API_SCHEMA_SLOT_ATTR,
  API_SCHEMA_UI_OPTIONS,
  ApiReferenceAPIPage,
  apiReferenceApiPagePlaygroundDisabled,
  apiReferenceSchemaUiShowsExamples,
  createApiOpenApiCodeUsageRegistry,
  readApiOperationSummaryLabel,
} from "./api-page";
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
  API_ACCENT_CHROME_REMAP,
  API_ACCENT_CSS_VARS,
  API_ACCENT_TOKEN_CLASSES,
  API_CODE_COPY_POLICY,
  API_CODE_PANEL_ATTR,
  API_METHOD_BADGE_TONE_CLASSES,
  API_SHIKI_OPTIONS,
  API_THEME_ROOT_ATTR,
  API_TOKEN_CLASSES,
  type ApiMethodBadgeToneKey,
  apiMethodBadgeToneClass,
  avoidsPrimaryAccentClasses,
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
