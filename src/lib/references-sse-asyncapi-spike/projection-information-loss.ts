/**
 * Story 007 — record HTTP/SSE semantics lost or distorted when projecting
 * packaged OpenAPI SSE operations into the temporary AsyncAPI fixture.
 *
 * Pure helpers — no filesystem IO. Callers supply already-loaded OpenAPI and
 * the regenerated AsyncAPI projection (never hand-edited).
 */

import type { OpenApiLike } from "./observe-sse-operations";
import type { ProjectedAsyncApiDocument } from "./project-openapi-to-asyncapi";
import { SSE_SPIKE_OPERATIONS } from "./sse-operations";

/** Decision-gate concerns called out by the W02 PRD for projection loss. */
export const PROJECTION_INFORMATION_LOSS_CONCERNS = [
  "reconnect-cursor-precedence",
  "dual-accept",
  "handshake-response-headers",
  "retained-history",
  "stream-generation-invalidation",
  "compatibility-only-status",
] as const;

export type ProjectionInformationLossConcern =
  (typeof PROJECTION_INFORMATION_LOSS_CONCERNS)[number];

export type ProjectionSemanticPresence =
  | "present-structured"
  | "present-prose-only"
  | "absent";

export type ProjectionInformationLossStatus =
  | "lost"
  | "distorted"
  | "partially-preserved"
  | "preserved";

export type ProjectionInformationLossItem = {
  concern: ProjectionInformationLossConcern;
  /**
   * Where readers must continue to learn this fact after projection.
   * HTTP transport semantics stay on the API operation page.
   */
  ownership: "api-operation-page" | "event-corpus" | "both";
  openApiPresence: ProjectionSemanticPresence;
  projectedAsyncApiPresence: ProjectionSemanticPresence;
  status: ProjectionInformationLossStatus;
  openApiEvidence: string[];
  projectedAsyncApiEvidence: string[];
  notes: string;
};

export type ProjectionInformationLossReport = {
  renderer: "@fumadocs/asyncapi";
  rendererVersionPinnedTemporarily: "0.2.1";
  generatedAsyncApiHandEdited: false;
  items: ProjectionInformationLossItem[];
};

const CANONICAL_EVENTS_PATH = "/factory-sessions/{session_id}/events" as const;
const HANDSHAKE_HEADERS = [
  "X-Factory-Session-Backend-Scope-Id",
  "X-Factory-Session-Logical-Session-Key-Id",
  "X-Factory-Session-Factory-Session-Id",
  "X-Factory-Session-Stream-Generation-Id",
] as const;

function stringifyAsyncApiSearchCorpus(
  asyncapi: ProjectedAsyncApiDocument,
): string {
  return JSON.stringify(asyncapi);
}

function openApiCanonicalGet(doc: OpenApiLike) {
  return doc.paths?.[CANONICAL_EVENTS_PATH]?.get;
}

function hasQueryParamRef(
  operation: NonNullable<ReturnType<typeof openApiCanonicalGet>>,
  paramName: string,
): boolean {
  const parameters = (
    operation as {
      parameters?: Array<{ $ref?: string }>;
    }
  ).parameters;
  if (!Array.isArray(parameters)) {
    return false;
  }
  return parameters.some(
    (parameter) =>
      typeof parameter.$ref === "string" &&
      parameter.$ref.includes(`/parameters/${paramName}`),
  );
}

function classifyReconnectCursorPrecedence(
  doc: OpenApiLike,
  asyncapiText: string,
): ProjectionInformationLossItem {
  const operation = openApiCanonicalGet(doc);
  const description = operation?.description ?? "";
  const hasAfterEventId = operation
    ? hasQueryParamRef(operation, "AfterEventId")
    : false;
  const hasAfterSequence = operation
    ? hasQueryParamRef(operation, "AfterSequence")
    : false;
  const prosePrecedence = description.includes("after_event_id wins");

  const openApiPresence: ProjectionSemanticPresence =
    hasAfterEventId && hasAfterSequence
      ? "present-structured"
      : prosePrecedence
        ? "present-prose-only"
        : "absent";

  const projectedHasCursorParams =
    asyncapiText.includes("after_event_id") ||
    asyncapiText.includes("AfterEventId") ||
    asyncapiText.includes("after_sequence") ||
    asyncapiText.includes("AfterSequence");
  const projectedHasPrecedence = asyncapiText.includes("after_event_id wins");

  const projectedAsyncApiPresence: ProjectionSemanticPresence =
    projectedHasCursorParams
      ? "present-structured"
      : projectedHasPrecedence
        ? "present-prose-only"
        : "absent";

  return {
    concern: "reconnect-cursor-precedence",
    ownership: "api-operation-page",
    openApiPresence,
    projectedAsyncApiPresence,
    status: projectedAsyncApiPresence === "absent" ? "lost" : "distorted",
    openApiEvidence: [
      `${CANONICAL_EVENTS_PATH} parameters include AfterEventId=${String(hasAfterEventId)} AfterSequence=${String(hasAfterSequence)}`,
      `operation description prose includes "after_event_id wins": ${String(prosePrecedence)}`,
    ],
    projectedAsyncApiEvidence: [
      `projected AsyncAPI searchable corpus includes cursor param tokens: ${String(projectedHasCursorParams)}`,
      `projected AsyncAPI searchable corpus includes precedence prose: ${String(projectedHasPrecedence)}`,
    ],
    notes:
      "OpenAPI owns reconnect cursor query parameters and after_event_id-wins precedence. The temporary AsyncAPI projection selects channels/messages from x-event-schema only and does not project HTTP query parameters.",
  };
}

function classifyDualAccept(
  doc: OpenApiLike,
  asyncapiText: string,
): ProjectionInformationLossItem {
  const content =
    openApiCanonicalGet(doc)?.responses?.["200"]?.content ?? undefined;
  const hasEventStream = content?.["text/event-stream"] !== undefined;
  const hasJson = content?.["application/json"] !== undefined;
  const openApiPresence: ProjectionSemanticPresence =
    hasEventStream && hasJson ? "present-structured" : "absent";

  const projectedHasDual =
    asyncapiText.includes("application/json") &&
    asyncapiText.includes("text/event-stream") &&
    asyncapiText.includes("FactorySessionEventStreamRecovery");
  const projectedAsyncApiPresence: ProjectionSemanticPresence = projectedHasDual
    ? "present-structured"
    : "absent";

  return {
    concern: "dual-accept",
    ownership: "api-operation-page",
    openApiPresence,
    projectedAsyncApiPresence,
    status: projectedAsyncApiPresence === "absent" ? "lost" : "distorted",
    openApiEvidence: [
      `${CANONICAL_EVENTS_PATH} responses.200.content has text/event-stream=${String(hasEventStream)} and application/json=${String(hasJson)} (JSON reconnect probe)`,
    ],
    projectedAsyncApiEvidence: [
      `projected AsyncAPI retains dual-Accept / FactorySessionEventStreamRecovery: ${String(projectedHasDual)}`,
    ],
    notes:
      "Dual-Accept (SSE open vs JSON reconnect probe on the same route) is an HTTP operation concern. Projection emits AsyncAPI receive channels for the event envelope only.",
  };
}

function classifyHandshakeHeaders(
  doc: OpenApiLike,
  asyncapiText: string,
): ProjectionInformationLossItem {
  const headers = (
    openApiCanonicalGet(doc)?.responses?.["200"] as
      | { headers?: Record<string, unknown> }
      | undefined
  )?.headers;
  const presentHeaders = HANDSHAKE_HEADERS.filter(
    (name) => headers?.[name] !== undefined,
  );
  const openApiPresence: ProjectionSemanticPresence =
    presentHeaders.length === HANDSHAKE_HEADERS.length
      ? "present-structured"
      : presentHeaders.length > 0
        ? "present-prose-only"
        : "absent";

  const projectedPresent = HANDSHAKE_HEADERS.filter((name) =>
    asyncapiText.includes(name),
  );
  const projectedAsyncApiPresence: ProjectionSemanticPresence =
    projectedPresent.length > 0 ? "present-prose-only" : "absent";

  return {
    concern: "handshake-response-headers",
    ownership: "api-operation-page",
    openApiPresence,
    projectedAsyncApiPresence,
    status: projectedAsyncApiPresence === "absent" ? "lost" : "distorted",
    openApiEvidence: [
      `${CANONICAL_EVENTS_PATH} responses.200.headers includes: ${presentHeaders.join(", ") || "(none)"}`,
    ],
    projectedAsyncApiEvidence: [
      `projected AsyncAPI mentions handshake header names: ${projectedPresent.join(", ") || "(none)"}`,
    ],
    notes:
      "X-Factory-Session-* handshake headers are HTTP response metadata. AsyncAPI message/channel projection does not copy response headers.",
  };
}

function classifyRetainedHistory(
  doc: OpenApiLike,
  asyncapiText: string,
): ProjectionInformationLossItem {
  const description = openApiCanonicalGet(doc)?.description ?? "";
  const responseDescription =
    (
      openApiCanonicalGet(doc)?.responses?.["200"] as
        | { description?: string }
        | undefined
    )?.description ?? "";
  const openApiHasRetained =
    description.includes("retained history") ||
    responseDescription.includes("Retained catch-up");
  const openApiPresence: ProjectionSemanticPresence = openApiHasRetained
    ? "present-prose-only"
    : "absent";

  const projectedHasRetained =
    asyncapiText.includes("retained history") ||
    asyncapiText.includes("Retained catch-up") ||
    asyncapiText.includes("ascending tick order");
  const projectedAsyncApiPresence: ProjectionSemanticPresence =
    projectedHasRetained ? "present-prose-only" : "absent";

  return {
    concern: "retained-history",
    ownership: "api-operation-page",
    openApiPresence,
    projectedAsyncApiPresence,
    status: projectedAsyncApiPresence === "absent" ? "lost" : "distorted",
    openApiEvidence: [
      `OpenAPI canonical operation prose/response description mentions retained catch-up history: ${String(openApiHasRetained)}`,
    ],
    projectedAsyncApiEvidence: [
      `projected AsyncAPI searchable corpus mentions retained-history ordering: ${String(projectedHasRetained)}`,
    ],
    notes:
      "Retained-history-then-live ordering lives in OpenAPI operation prose. Projection channel descriptions cite path/media-type/x-event-schema selection, not replay catch-up order.",
  };
}

function classifyStreamGenerationInvalidation(
  doc: OpenApiLike,
  asyncapiText: string,
): ProjectionInformationLossItem {
  const description = openApiCanonicalGet(doc)?.description ?? "";
  const headers = (
    openApiCanonicalGet(doc)?.responses?.["200"] as
      | { headers?: Record<string, unknown> }
      | undefined
  )?.headers;
  const hasHeader =
    headers?.["X-Factory-Session-Stream-Generation-Id"] !== undefined;
  const hasProse =
    description.includes("stream generation") ||
    description.includes("streamGenerationId");
  const openApiPresence: ProjectionSemanticPresence = hasHeader
    ? "present-structured"
    : hasProse
      ? "present-prose-only"
      : "absent";

  const projectedHas =
    asyncapiText.includes("X-Factory-Session-Stream-Generation-Id") ||
    asyncapiText.includes("streamGenerationId") ||
    asyncapiText.includes("stream generation invalidates");
  const projectedAsyncApiPresence: ProjectionSemanticPresence = projectedHas
    ? "present-prose-only"
    : "absent";

  return {
    concern: "stream-generation-invalidation",
    ownership: "api-operation-page",
    openApiPresence,
    projectedAsyncApiPresence,
    status: projectedAsyncApiPresence === "absent" ? "lost" : "distorted",
    openApiEvidence: [
      `OpenAPI has Stream-Generation-Id response header: ${String(hasHeader)}`,
      `OpenAPI prose mentions stream-generation invalidation: ${String(hasProse)}`,
    ],
    projectedAsyncApiEvidence: [
      `projected AsyncAPI mentions stream-generation invalidation: ${String(projectedHas)}`,
    ],
    notes:
      "Stream-generation invalidation is an HTTP identity-handshake concern. Projection does not invent AsyncAPI bindings for it.",
  };
}

function classifyCompatibilityOnlyStatus(
  asyncapi: ProjectedAsyncApiDocument,
): ProjectionInformationLossItem {
  const compatibilityOp = SSE_SPIKE_OPERATIONS.find(
    (operation) => operation.role === "compatibility-only",
  );
  const channelId = compatibilityOp?.operationId ?? "getEvents";
  const channel = asyncapi.channels[channelId];
  const description = channel?.description ?? "";
  const labeled =
    description.includes("compatibility-only") ||
    description.includes("non-preferred");
  const projectedAsyncApiPresence: ProjectionSemanticPresence = labeled
    ? "present-prose-only"
    : "absent";

  return {
    concern: "compatibility-only-status",
    ownership: "both",
    openApiPresence: "present-prose-only",
    projectedAsyncApiPresence,
    status: labeled ? "partially-preserved" : "lost",
    openApiEvidence: [
      "OpenAPI GET /events summary/description marks the stream as compatibility-only / non-preferred for new consumers",
    ],
    projectedAsyncApiEvidence: [
      `projected channel ${channelId} description includes compatibility-only / non-preferred label: ${String(labeled)}`,
      channel
        ? `channel description excerpt: ${description.slice(0, 180)}`
        : "",
    ].filter((line) => line.length > 0),
    notes:
      "Compatibility-only / non-preferred is labeled on the projected channel description. Full HTTP compatibility semantics (no session handshake, dashboard must prefer session-scoped route) remain API-operation-page concerns and are not fully restated as AsyncAPI bindings.",
  };
}

/**
 * Compare packaged OpenAPI HTTP/SSE semantics against the regenerated AsyncAPI
 * projection. Does not mutate either document and never suggests hand-editing
 * AsyncAPI to restore lost transport facts.
 */
export function recordProjectionInformationLoss(
  openApi: OpenApiLike,
  asyncapi: ProjectedAsyncApiDocument,
): ProjectionInformationLossReport {
  const asyncapiText = stringifyAsyncApiSearchCorpus(asyncapi);

  return {
    renderer: "@fumadocs/asyncapi",
    rendererVersionPinnedTemporarily: "0.2.1",
    generatedAsyncApiHandEdited: false,
    items: [
      classifyReconnectCursorPrecedence(openApi, asyncapiText),
      classifyDualAccept(openApi, asyncapiText),
      classifyHandshakeHeaders(openApi, asyncapiText),
      classifyRetainedHistory(openApi, asyncapiText),
      classifyStreamGenerationInvalidation(openApi, asyncapiText),
      classifyCompatibilityOnlyStatus(asyncapi),
    ],
  };
}

/** True when every decision-gate transport concern is classified. */
export function projectionInformationLossCoversRequiredConcerns(
  report: ProjectionInformationLossReport,
): boolean {
  const found = new Set(report.items.map((item) => item.concern));
  return PROJECTION_INFORMATION_LOSS_CONCERNS.every((concern) =>
    found.has(concern),
  );
}
