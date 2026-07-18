/**
 * W02 non-production SSE OpenAPI spike — the three published event-stream
 * operations and their roles. Selection is by path/method identity so later
 * AsyncAPI projection (stories 004+) can resolve payload roots from
 * `x-event-schema` without hard-coding schema names here.
 */

export const SSE_SPIKE_STATUS = "non-production-temporary" as const;

export const SSE_SPIKE_DOCUMENT_ID = "factory" as const;

export const SSE_SPIKE_OPENAPI_EXPORT =
  "@you-agent-factory/api/openapi" as const;

export type SseSpikeRole = "canonical" | "ephemeral" | "compatibility-only";

export type SseSpikeOperation = {
  path: string;
  method: "get";
  operationId: string;
  role: SseSpikeRole;
  /** Human-readable role label for the spike surface. */
  roleLabel: string;
};

/**
 * Canonical inventory of SSE operations under investigation. Order is
 * canonical → ephemeral → compatibility-only so the spike surface reads in
 * preferred-consumer order.
 */
export const SSE_SPIKE_OPERATIONS = [
  {
    path: "/factory-sessions/{session_id}/events",
    method: "get",
    operationId: "getEventsBySessionId",
    role: "canonical",
    roleLabel: "Canonical session-scoped FactoryEvent stream",
  },
  {
    path: "/factory-sessions/{session_id}/response-events",
    method: "get",
    operationId: "getFactoryResponseEventsBySessionId",
    role: "ephemeral",
    roleLabel: "Ephemeral FactoryResponseEvent stream",
  },
  {
    path: "/events",
    method: "get",
    operationId: "getEvents",
    role: "compatibility-only",
    roleLabel: "Compatibility-only process-global FactoryEvent stream",
  },
] as const satisfies readonly SseSpikeOperation[];

export type SseSpikeOperationItem = (typeof SSE_SPIKE_OPERATIONS)[number];

/** Fumadocs OpenAPI `operations` prop — path + method only. */
export const SSE_SPIKE_API_PAGE_OPERATIONS = SSE_SPIKE_OPERATIONS.map(
  ({ path, method }) => ({ path, method }),
);

export const SSE_SPIKE_ROUTE = "/spikes/sse-openapi" as const;

/**
 * Spike safety contract: static OpenAPI render only. No live Factory host,
 * proxy route, or playground request execution.
 */
export const SSE_SPIKE_SAFETY = {
  opensLiveFactoryConnection: false,
  addsProxyRoute: false,
  enablesLiveRequestPlayground: false,
  playgroundEnabled: false,
  proxyUrl: undefined,
} as const;
