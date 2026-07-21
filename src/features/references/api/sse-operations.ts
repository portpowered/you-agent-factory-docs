/**
 * Production inventory of the three published SSE operations and their hybrid
 * API-page roles (W02 placement decision: hybrid).
 *
 * Migrated from the W02 spike inventory into the W08 ownership surface. Roles
 * are presentation policy for the API page — not a second OpenAPI corpus.
 * Full event envelope/payload catalogs remain W09.
 */

export type ApiSseRole = "canonical" | "ephemeral" | "compatibility-only";

export type ApiSseOperation = {
  path: string;
  method: "get";
  operationId: string;
  role: ApiSseRole;
  /** Human-readable role label for the API-page summary. */
  roleLabel: string;
  /**
   * Whether this stream is preferred/canonical for new consumers.
   * Compatibility-only is always false.
   */
  preferredOrCanonical: boolean;
  /**
   * Payload root JSON Pointer published via `x-event-schema` on the
   * `text/event-stream` media type (baseline observation from packaged OpenAPI).
   */
  eventSchemaRef: string;
};

/**
 * Canonical inventory under hybrid placement. Order is canonical → ephemeral →
 * compatibility-only so summaries read in preferred-consumer order.
 */
export const API_SSE_OPERATIONS = [
  {
    path: "/factory-sessions/{session_id}/events",
    method: "get",
    operationId: "getEventsBySessionId",
    role: "canonical",
    roleLabel: "Canonical session-scoped FactoryEvent stream",
    preferredOrCanonical: true,
    eventSchemaRef: "#/components/schemas/FactoryEvent",
  },
  {
    path: "/factory-sessions/{session_id}/response-events",
    method: "get",
    operationId: "getFactoryResponseEventsBySessionId",
    role: "ephemeral",
    roleLabel: "Ephemeral FactoryResponseEvent stream",
    preferredOrCanonical: false,
    eventSchemaRef: "#/components/schemas/FactoryResponseEvent",
  },
  {
    path: "/events",
    method: "get",
    operationId: "getEvents",
    role: "compatibility-only",
    roleLabel: "Compatibility-only process-global FactoryEvent stream",
    preferredOrCanonical: false,
    eventSchemaRef: "#/components/schemas/FactoryEvent",
  },
] as const satisfies readonly ApiSseOperation[];

export type ApiSseOperationItem = (typeof API_SSE_OPERATIONS)[number];

/** Marker attribute for SSE operation summary chrome. */
export const API_SSE_SUMMARY_ATTR = "data-api-sse-summary" as const;

/** Marker attribute for the SSE role badge. */
export const API_SSE_ROLE_ATTR = "data-api-sse-role" as const;

/**
 * Look up a published SSE operation by operationId (preferred) or path+method.
 */
export function findApiSseOperation(options: {
  operationId?: string;
  path?: string;
  method?: string;
}): ApiSseOperationItem | undefined {
  const operationId = options.operationId?.trim();
  if (operationId) {
    const byId = API_SSE_OPERATIONS.find(
      (operation) => operation.operationId === operationId,
    );
    if (byId) return byId;
  }

  const path = options.path?.trim();
  const method = options.method?.trim().toLowerCase();
  if (!path || !method) return undefined;

  return API_SSE_OPERATIONS.find(
    (operation) => operation.path === path && operation.method === method,
  );
}

/** True when the operation is one of the three published SSE streams. */
export function isApiSseOperation(options: {
  operationId?: string;
  path?: string;
  method?: string;
}): boolean {
  return findApiSseOperation(options) !== undefined;
}

/**
 * Static-only safety contract for SSE summaries on the API surface.
 * Summaries never open a live event-stream connection.
 */
export const API_SSE_SUMMARY_SAFETY = {
  opensLiveEventStreamConnection: false,
  implementsFullEventCatalog: false,
  eventCatalogOwner: "W09",
} as const;
