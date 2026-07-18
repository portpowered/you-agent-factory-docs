/**
 * Client-facing reconnect / identity / lifecycle contracts for the W09 events
 * corpus.
 *
 * Derived from packaged OpenAPI (canonical session events operation prose,
 * query parameters, handshake response headers, dual-Accept JSON recovery
 * schema). Does not re-implement W08 API OpenAPI UI — dual-Accept / HTTP
 * transport ownership stays summarized with links toward API anchors.
 *
 * Pure document inspection — no filesystem IO.
 */

import type {
  EventsOpenApiDocument,
  EventsOpenApiOperation,
  EventsOpenApiParameterObject,
} from "./openapi-document";
import {
  EVENT_STREAM_OPERATIONS,
  type EventStreamOperationItem,
} from "./stream-operations";

export const EVENT_RECONNECT_CANONICAL_PATH =
  "/factory-sessions/{session_id}/events" as const;

export const EVENT_RECONNECT_CURSOR_PARAM_NAMES = [
  "after_event_id",
  "after_sequence",
] as const;

export type EventReconnectCursorParamName =
  (typeof EVENT_RECONNECT_CURSOR_PARAM_NAMES)[number];

export const EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES = [
  "X-Factory-Session-Backend-Scope-Id",
  "X-Factory-Session-Logical-Session-Key-Id",
  "X-Factory-Session-Factory-Session-Id",
  "X-Factory-Session-Stream-Generation-Id",
] as const;

export type EventIdentityHandshakeHeaderName =
  (typeof EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES)[number];

export const EVENT_JSON_RECONNECT_PROBE_MEDIA_TYPE =
  "application/json" as const;

export const EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME =
  "FactorySessionEventStreamRecovery" as const;

export const EVENT_JSON_RECONNECT_OUTCOME_SCHEMA_NAME =
  "FactorySessionEventStreamRecoveryOutcome" as const;

export const EVENT_JSON_RECONNECT_RETRY_SCHEMA_NAME =
  "FactorySessionEventStreamRecoveryRetry" as const;

/** Baseline observation — assert against live inventory, not a frozen quota. */
export const EVENT_JSON_RECONNECT_PROBE_OUTCOME_BASELINE = [
  "STREAM_READY",
  "CURSOR_STALE",
  "UNKNOWN_SESSION",
] as const;

export const EVENT_STREAM_LIFECYCLE_RESPONSE_GAP_KIND = "STREAM_GAP" as const;

export type EventReconnectLifecycleErrorCode =
  | "missing-canonical-path"
  | "missing-canonical-operation"
  | "missing-cursor-parameter"
  | "missing-handshake-header"
  | "missing-json-reconnect-probe"
  | "missing-recovery-schema"
  | "missing-recovery-outcomes";

export class EventReconnectLifecycleError extends Error {
  readonly code: EventReconnectLifecycleErrorCode;

  constructor(code: EventReconnectLifecycleErrorCode, detail: string) {
    super(`Event reconnect lifecycle build failed: ${code} — ${detail}`);
    this.name = "EventReconnectLifecycleError";
    this.code = code;
  }
}

export type EventReconnectCursorParameter = {
  name: EventReconnectCursorParamName;
  in: "query";
  required: boolean;
  description: string;
  schemaType: string | undefined;
};

export type EventReconnectContractModel = {
  streamPath: typeof EVENT_RECONNECT_CANONICAL_PATH;
  operationId: string;
  cursorParameters: readonly EventReconnectCursorParameter[];
  /**
   * When both cursors are present, `after_event_id` wins.
   */
  precedenceRule: "after_event_id-wins-when-both-present";
  precedenceSummary: string;
  sessionSequenceFallbackSummary: string;
  omitBothStartsFromRetainedHistoryStart: true;
};

export type EventIdentityHandshakeHeader = {
  name: EventIdentityHandshakeHeaderName;
  description: string;
};

export type EventIdentityHandshakeModel = {
  headers: readonly EventIdentityHandshakeHeader[];
  streamGenerationInvalidatesPriorCursors: true;
  summary: string;
};

export type EventStreamLifecycleModel = {
  retainedHistoryThenLiveSummary: string;
  keepaliveWaitingStateSummary: string;
  gapBehaviorSummary: string;
  responseEventStreamGapKind: typeof EVENT_STREAM_LIFECYCLE_RESPONSE_GAP_KIND;
  staleCursorRecoverySummary: string;
};

export type EventJsonReconnectProbeRetryField = {
  name: string;
  description: string;
};

export type EventJsonReconnectProbeModel = {
  streamPath: typeof EVENT_RECONNECT_CANONICAL_PATH;
  acceptMediaType: typeof EVENT_JSON_RECONNECT_PROBE_MEDIA_TYPE;
  sseMediaType: "text/event-stream";
  recoverySchemaName: typeof EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME;
  outcomes: readonly string[];
  retryFields: readonly EventJsonReconnectProbeRetryField[];
  summary: string;
  /**
   * Dual-Accept / HTTP transport ownership remains on the API operation page
   * (W08). Events corpus documents client-facing probe outcomes only.
   */
  httpTransportOwnership: "api-operation-page";
  apiTransportSummaryHref: string;
};

export type EventReconnectLifecycleCorpus = {
  reconnect: EventReconnectContractModel;
  identity: EventIdentityHandshakeModel;
  lifecycle: EventStreamLifecycleModel;
  jsonReconnectProbe: EventJsonReconnectProbeModel;
  /** Stable section anchors for deep links within the events surface. */
  anchors: {
    reconnect: "event-reconnect-contract";
    identity: "event-identity-handshake";
    lifecycle: "event-stream-lifecycle";
    jsonReconnectProbe: "event-json-reconnect-probe";
  };
};

function canonicalOperation(doc: EventsOpenApiDocument): {
  operation: EventStreamOperationItem;
  openApiOperation: EventsOpenApiOperation;
} {
  const operation = EVENT_STREAM_OPERATIONS.find(
    (item) => item.role === "canonical",
  );
  if (operation === undefined) {
    throw new EventReconnectLifecycleError(
      "missing-canonical-path",
      "canonical EVENT_STREAM_OPERATIONS entry is missing",
    );
  }

  const pathItem = doc.paths?.[operation.path];
  if (pathItem === undefined) {
    throw new EventReconnectLifecycleError(
      "missing-canonical-path",
      `OpenAPI paths missing ${operation.path}`,
    );
  }

  const openApiOperation = pathItem.get;
  if (openApiOperation === undefined) {
    throw new EventReconnectLifecycleError(
      "missing-canonical-operation",
      `OpenAPI GET missing for ${operation.path}`,
    );
  }

  return { operation, openApiOperation };
}

function resolveParameter(
  doc: EventsOpenApiDocument,
  parameter: EventsOpenApiParameterObject,
): EventsOpenApiParameterObject {
  if (typeof parameter.$ref === "string") {
    const name = parameter.$ref.replace(/^#\/components\/parameters\//, "");
    const resolved = doc.components?.parameters?.[name];
    if (resolved === undefined) {
      throw new EventReconnectLifecycleError(
        "missing-cursor-parameter",
        `unresolved parameter $ref ${parameter.$ref}`,
      );
    }
    return resolved;
  }
  return parameter;
}

function readSchemaEnumValues(schema: unknown): string[] {
  if (
    schema !== null &&
    typeof schema === "object" &&
    Array.isArray((schema as { enum?: unknown }).enum)
  ) {
    return (schema as { enum: unknown[] }).enum.filter(
      (value): value is string => typeof value === "string",
    );
  }
  return [];
}

function readObjectPropertyDescriptions(
  schema: unknown,
): EventJsonReconnectProbeRetryField[] {
  if (schema === null || typeof schema !== "object") {
    return [];
  }
  const properties = (schema as { properties?: Record<string, unknown> })
    .properties;
  if (properties === undefined) {
    return [];
  }
  return Object.entries(properties).map(([name, property]) => ({
    name,
    description:
      property !== null &&
      typeof property === "object" &&
      typeof (property as { description?: unknown }).description === "string"
        ? (property as { description: string }).description
        : "",
  }));
}

/**
 * Build reconnect cursor contract for the canonical session FactoryEvent stream.
 */
export function buildEventReconnectContract(
  doc: EventsOpenApiDocument,
): EventReconnectContractModel {
  const { operation, openApiOperation } = canonicalOperation(doc);
  const parameters = (openApiOperation.parameters ?? []).map((parameter) =>
    resolveParameter(doc, parameter),
  );

  const cursorParameters: EventReconnectCursorParameter[] = [];
  for (const expectedName of EVENT_RECONNECT_CURSOR_PARAM_NAMES) {
    const match = parameters.find(
      (parameter) =>
        parameter.name === expectedName && parameter.in === "query",
    );
    if (match === undefined || typeof match.name !== "string") {
      throw new EventReconnectLifecycleError(
        "missing-cursor-parameter",
        `canonical stream missing query parameter ${expectedName}`,
      );
    }
    cursorParameters.push({
      name: expectedName,
      in: "query",
      required: match.required === true,
      description: match.description ?? "",
      schemaType:
        match.schema !== undefined && typeof match.schema.type === "string"
          ? match.schema.type
          : undefined,
    });
  }

  return {
    streamPath: EVENT_RECONNECT_CANONICAL_PATH,
    operationId: openApiOperation.operationId ?? operation.operationId,
    cursorParameters,
    precedenceRule: "after_event_id-wins-when-both-present",
    precedenceSummary:
      "When both after_event_id and after_sequence are present, after_event_id wins.",
    sessionSequenceFallbackSummary:
      "For session-scoped streams, after_sequence prefers FactoryEvent.context.sessionSequence when that field is present; otherwise it falls back to FactoryEvent.context.sequence. Omitting both cursors starts replay from the beginning of the session's currently retained history.",
    omitBothStartsFromRetainedHistoryStart: true,
  };
}

/**
 * Build identity handshake header contract + stream-generation invalidation.
 */
export function buildEventIdentityHandshake(
  doc: EventsOpenApiDocument,
): EventIdentityHandshakeModel {
  const { openApiOperation } = canonicalOperation(doc);
  const headers = openApiOperation.responses?.["200"]?.headers ?? {};
  const resolved: EventIdentityHandshakeHeader[] = [];

  for (const name of EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES) {
    const header = headers[name];
    if (header === undefined) {
      throw new EventReconnectLifecycleError(
        "missing-handshake-header",
        `canonical 200 response missing handshake header ${name}`,
      );
    }
    resolved.push({
      name,
      description: header.description ?? "",
    });
  }

  return {
    headers: resolved,
    streamGenerationInvalidatesPriorCursors: true,
    summary:
      "Compare X-Factory-Session-* handshake headers with the latest sync-preflight or session-read identity set before reusing a persisted reconnect cursor. A changed streamGenerationId / X-Factory-Session-Stream-Generation-Id invalidates prior cursors even when factorySessionId is unchanged.",
  };
}

/**
 * Build retained-history / keepalive / gap / stale-cursor lifecycle summaries.
 */
export function buildEventStreamLifecycle(
  doc: EventsOpenApiDocument,
): EventStreamLifecycleModel {
  const { openApiOperation } = canonicalOperation(doc);
  const description = openApiOperation.description ?? "";
  const responseDescription =
    openApiOperation.responses?.["200"]?.description ?? "";

  const retainedHistoryThenLiveSummary =
    description.includes("retained history") ||
    responseDescription.includes("Retained catch-up")
      ? "The server sends retained history first in ascending tick order, then continues on the same connection with live FactoryEvent records."
      : "Retained catch-up precedes live FactoryEvent records on the canonical session stream.";

  const keepaliveWaitingStateSummary =
    description.includes("Keepalives") ||
    responseDescription.includes("keep-alive")
      ? "Successful SSE responses use Connection keep-alive. Idle periods while waiting for new canonical events are normal waiting state, not terminal stream completion, unless the HTTP connection closes."
      : "Idle keepalive waiting is normal until the HTTP connection closes.";

  const gapBehaviorSummary =
    "On the ephemeral response-events stream, when a cursor predates retained history the first emitted record is STREAM_GAP and describes the lost range rather than silently skipping events.";

  const staleCursorRecoverySummary =
    description.includes("cursor_stale") || description.includes("stale")
      ? "Cursors that no longer match the retained history boundary return typed invalid-cursor handling (400 on SSE open, CURSOR_STALE on the JSON reconnect probe) rather than silently skipping events."
      : "Stale cursors produce typed invalid-cursor recovery instead of silent skips.";

  return {
    retainedHistoryThenLiveSummary,
    keepaliveWaitingStateSummary,
    gapBehaviorSummary,
    responseEventStreamGapKind: EVENT_STREAM_LIFECYCLE_RESPONSE_GAP_KIND,
    staleCursorRecoverySummary,
  };
}

/**
 * Build JSON reconnect-probe (Accept: application/json) contract for the
 * canonical session endpoint.
 */
export function buildEventJsonReconnectProbe(
  doc: EventsOpenApiDocument,
  options?: { apiTransportSummaryHref?: string },
): EventJsonReconnectProbeModel {
  const { openApiOperation } = canonicalOperation(doc);
  const content = openApiOperation.responses?.["200"]?.content ?? {};
  const jsonContent = content[EVENT_JSON_RECONNECT_PROBE_MEDIA_TYPE];
  const sseContent = content["text/event-stream"];

  if (jsonContent === undefined || sseContent === undefined) {
    throw new EventReconnectLifecycleError(
      "missing-json-reconnect-probe",
      "canonical 200 response must declare both text/event-stream and application/json",
    );
  }

  const schemas = doc.components?.schemas;
  const recovery = schemas?.[EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME];
  const outcomeSchema = schemas?.[EVENT_JSON_RECONNECT_OUTCOME_SCHEMA_NAME];
  const retrySchema = schemas?.[EVENT_JSON_RECONNECT_RETRY_SCHEMA_NAME];

  if (recovery === undefined) {
    throw new EventReconnectLifecycleError(
      "missing-recovery-schema",
      `${EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME} is missing from components.schemas`,
    );
  }

  const outcomes = readSchemaEnumValues(outcomeSchema);
  if (outcomes.length === 0) {
    throw new EventReconnectLifecycleError(
      "missing-recovery-outcomes",
      `${EVENT_JSON_RECONNECT_OUTCOME_SCHEMA_NAME} enum is empty or missing`,
    );
  }

  for (const required of EVENT_JSON_RECONNECT_PROBE_OUTCOME_BASELINE) {
    if (!outcomes.includes(required)) {
      throw new EventReconnectLifecycleError(
        "missing-recovery-outcomes",
        `recovery outcomes omit required ${required}`,
      );
    }
  }

  return {
    streamPath: EVENT_RECONNECT_CANONICAL_PATH,
    acceptMediaType: EVENT_JSON_RECONNECT_PROBE_MEDIA_TYPE,
    sseMediaType: "text/event-stream",
    recoverySchemaName: EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME,
    outcomes: [...outcomes].sort(),
    retryFields: readObjectPropertyDescriptions(retrySchema),
    summary:
      "When Accept includes application/json, the canonical session events route acts as a reconnect probe and returns FactorySessionEventStreamRecovery instead of opening Server-Sent Events. CURSOR_STALE tells clients to retry with omitAfterEventId and omitAfterSequence set. UNKNOWN_SESSION means the selector does not resolve to a live or durable session and never falls back to the default session. STREAM_READY means the probe succeeded and the client may open the SSE stream.",
    httpTransportOwnership: "api-operation-page",
    apiTransportSummaryHref:
      options?.apiTransportSummaryHref ??
      "/docs/references/api#factory-sessions-session_id-events",
  };
}

/**
 * Build the full reconnect / identity / lifecycle / JSON-probe corpus model.
 */
export function buildEventReconnectLifecycleCorpus(
  doc: EventsOpenApiDocument,
  options?: { apiTransportSummaryHref?: string },
): EventReconnectLifecycleCorpus {
  return {
    reconnect: buildEventReconnectContract(doc),
    identity: buildEventIdentityHandshake(doc),
    lifecycle: buildEventStreamLifecycle(doc),
    jsonReconnectProbe: buildEventJsonReconnectProbe(doc, options),
    anchors: {
      reconnect: "event-reconnect-contract",
      identity: "event-identity-handshake",
      lifecycle: "event-stream-lifecycle",
      jsonReconnectProbe: "event-json-reconnect-probe",
    },
  };
}
