/**
 * Production event-stream operation inventory for W09.
 *
 * Migrated from the non-production W02 spike
 * (`src/lib/references-sse-asyncapi-spike/sse-operations.ts`). Selection remains
 * by path/method identity so later stories can resolve payload roots from
 * OpenAPI `x-event-schema` without hard-coding schema names as the sole rule.
 */

export const EVENTS_OPENAPI_EXPORT = "@you-agent-factory/api/openapi" as const;

export const EVENT_STREAM_ROLES = [
  "canonical",
  "ephemeral",
  "compatibility-only",
] as const;

export type EventStreamRole = (typeof EVENT_STREAM_ROLES)[number];

export type EventStreamOperation = {
  path: string;
  method: "get";
  operationId: string;
  role: EventStreamRole;
  /** Human-readable role label for catalog / summary chrome. */
  roleLabel: string;
  /** Envelope / payload root name published for this stream. */
  payloadRoot: "FactoryEvent" | "FactoryResponseEvent";
};

/**
 * Canonical inventory of SSE operations. Order is canonical → ephemeral →
 * compatibility-only so the corpus reads in preferred-consumer order.
 */
export const EVENT_STREAM_OPERATIONS = [
  {
    path: "/factory-sessions/{session_id}/events",
    method: "get",
    operationId: "getEventsBySessionId",
    role: "canonical",
    roleLabel: "Canonical session-scoped FactoryEvent stream",
    payloadRoot: "FactoryEvent",
  },
  {
    path: "/factory-sessions/{session_id}/response-events",
    method: "get",
    operationId: "getFactoryResponseEventsBySessionId",
    role: "ephemeral",
    roleLabel: "Ephemeral FactoryResponseEvent stream",
    payloadRoot: "FactoryResponseEvent",
  },
  {
    path: "/events",
    method: "get",
    operationId: "getEvents",
    role: "compatibility-only",
    roleLabel: "Compatibility-only process-global FactoryEvent stream",
    payloadRoot: "FactoryEvent",
  },
] as const satisfies readonly EventStreamOperation[];

export type EventStreamOperationItem = (typeof EVENT_STREAM_OPERATIONS)[number];

/**
 * Production safety contract: static contract render only. No live Factory
 * host, proxy route, or EventSource/fetch stream.
 */
export const EVENT_STREAM_SAFETY = {
  opensLiveFactoryConnection: false,
  addsProxyRoute: false,
  enablesLiveRequestPlayground: false,
  playgroundEnabled: false,
  proxyUrl: undefined,
} as const;

export function eventStreamOperationByRole(
  role: EventStreamRole,
): EventStreamOperationItem | undefined {
  return EVENT_STREAM_OPERATIONS.find((operation) => operation.role === role);
}

export function isPreferredEventStreamRole(role: EventStreamRole): boolean {
  return role === "canonical";
}
