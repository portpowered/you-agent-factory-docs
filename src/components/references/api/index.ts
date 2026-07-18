/**
 * W08 unified HTTP/OpenAPI reference renderer ownership surface.
 *
 * Prefer importing from `@/components/references/api` for production API UI.
 * Keep overlay validators (W06), schema UI (W07), event catalog (W09), and
 * CLI/MCP/JS family renderers (W10) outside this tree. Do not reopen W01/W02
 * spike trees except to migrate reusable helpers into this surface.
 */

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
  API_OPENAPI_PACKAGE_EXPORT,
  API_OPENAPI_SCHEMA_ID,
  API_OPENAPI_SOURCE_BASE_DIR,
  type LoadedApiOpenApiArtifact,
  loadApiOpenApiArtifact,
} from "./load-openapi-artifact";
export {
  type ApiOpenApiOperation,
  type ApiOpenApiSinglePageProjection,
  apiOpenApiServer,
  loadApiOpenApiSinglePageProjection,
} from "./openapi-server";
export {
  API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS,
  API_REFERENCE_OWNERSHIP_IMPORT,
  API_REFERENCE_OWNERSHIP_ROOT,
  type ApiReferenceForbiddenOwnershipRoot,
  isApiReferenceOwnershipPath,
  isForbiddenApiReferenceOwnershipPath,
} from "./ownership";
export {
  API_UI_STATUS_DEFAULT_MESSAGES,
  API_UI_STATUS_DEFAULT_TITLES,
  API_UI_STATUS_KINDS,
  type ApiStatusProps,
  type ApiUiStatus,
  type ApiUiStatusKind,
} from "./types";
