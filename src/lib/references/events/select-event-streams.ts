/**
 * Select SSE streams for the W09 events corpus from packaged OpenAPI.
 *
 * Selection is always path → GET operation → response status →
 * `text/event-stream` media type → `x-event-schema` payload root. Never
 * hard-code schema component names as the sole selection rule.
 *
 * Pure document inspection — no filesystem IO.
 */

import {
  EVENTS_SSE_MEDIA_TYPE,
  EVENTS_SSE_RESPONSE_STATUS,
  type EventsOpenApiDocument,
  type EventsOpenApiMediaTypeObject,
} from "./openapi-document";
import {
  EVENT_STREAM_OPERATIONS,
  type EventStreamOperation,
  type EventStreamRole,
} from "./stream-operations";

export type SelectedEventStream = {
  path: string;
  method: "get";
  operationId: string;
  role: EventStreamRole;
  roleLabel: string;
  status: typeof EVENTS_SSE_RESPONSE_STATUS;
  mediaType: typeof EVENTS_SSE_MEDIA_TYPE;
  wireSchema: unknown;
  /** Payload root JSON Pointer / `$ref` from `x-event-schema`. */
  payloadRootRef: string;
  /** Local component name from `#/components/schemas/...` (empty when not). */
  payloadRootSchemaName: string;
  /** True for canonical + ephemeral; false for compatibility-only. */
  preferred: boolean;
  compatibilityLabel: "preferred" | "compatibility-only-non-preferred";
};

export type SelectEventStreamsErrorCode =
  | "missing-path"
  | "missing-operation"
  | "operation-id-mismatch"
  | "missing-response"
  | "missing-text-event-stream"
  | "missing-x-event-schema"
  | "invalid-x-event-schema";

export class SelectEventStreamsError extends Error {
  readonly code: SelectEventStreamsErrorCode;
  readonly path: string;
  readonly operationId: string;

  constructor(
    code: SelectEventStreamsErrorCode,
    path: string,
    operationId: string,
    detail: string,
  ) {
    super(
      `Event stream selection failed for ${operationId} (${path}): ${code} — ${detail}`,
    );
    this.name = "SelectEventStreamsError";
    this.code = code;
    this.path = path;
    this.operationId = operationId;
  }
}

/**
 * Read the `text/event-stream` media-type object for one path/status.
 */
export function readEventsSseMediaTypeObject(
  doc: EventsOpenApiDocument,
  path: string,
  status: string = EVENTS_SSE_RESPONSE_STATUS,
  mediaType: string = EVENTS_SSE_MEDIA_TYPE,
): EventsOpenApiMediaTypeObject | undefined {
  return doc.paths?.[path]?.get?.responses?.[status]?.content?.[mediaType];
}

/**
 * Resolve the payload root from a media type's `x-event-schema`.
 */
export function resolvePayloadRootFromXEventSchema(
  media: EventsOpenApiMediaTypeObject | undefined,
): string {
  const value = media?.["x-event-schema"];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `x-event-schema must be a non-empty string ref; got ${JSON.stringify(value)}`,
    );
  }
  return value.trim();
}

/**
 * Derive the local schema name from a `#/components/schemas/...` pointer.
 * Returns "" for unexpected ref shapes so callers do not invent names.
 */
export function schemaNameFromComponentsRef(ref: string): string {
  const match = /^#\/components\/schemas\/([^/]+)$/.exec(ref);
  return match?.[1] ?? "";
}

function preferredForRole(role: EventStreamRole): boolean {
  // Preferred consumers: canonical + ephemeral. Compatibility-only is present
  // but never preferred over the session-scoped streams.
  return role !== "compatibility-only";
}

function compatibilityLabelForRole(
  role: EventStreamRole,
): SelectedEventStream["compatibilityLabel"] {
  return role === "compatibility-only"
    ? "compatibility-only-non-preferred"
    : "preferred";
}

/**
 * Select one SSE stream by path / operation / status / media type and resolve
 * its payload root from `x-event-schema`.
 */
export function selectEventStreamFromOpenApi(
  doc: EventsOpenApiDocument,
  inventoryItem: EventStreamOperation,
  options: {
    status?: typeof EVENTS_SSE_RESPONSE_STATUS;
    mediaType?: typeof EVENTS_SSE_MEDIA_TYPE;
  } = {},
): SelectedEventStream {
  const status = options.status ?? EVENTS_SSE_RESPONSE_STATUS;
  const mediaType = options.mediaType ?? EVENTS_SSE_MEDIA_TYPE;
  const pathItem = doc.paths?.[inventoryItem.path];
  if (!pathItem) {
    throw new SelectEventStreamsError(
      "missing-path",
      inventoryItem.path,
      inventoryItem.operationId,
      "path missing from OpenAPI paths object",
    );
  }

  const operation = pathItem.get;
  if (!operation) {
    throw new SelectEventStreamsError(
      "missing-operation",
      inventoryItem.path,
      inventoryItem.operationId,
      "GET operation missing",
    );
  }

  if (operation.operationId !== inventoryItem.operationId) {
    throw new SelectEventStreamsError(
      "operation-id-mismatch",
      inventoryItem.path,
      inventoryItem.operationId,
      `expected operationId ${inventoryItem.operationId}, found ${String(operation.operationId)}`,
    );
  }

  const response = operation.responses?.[status];
  if (!response) {
    throw new SelectEventStreamsError(
      "missing-response",
      inventoryItem.path,
      inventoryItem.operationId,
      `response ${status} missing`,
    );
  }

  const media = response.content?.[mediaType];
  if (!media) {
    throw new SelectEventStreamsError(
      "missing-text-event-stream",
      inventoryItem.path,
      inventoryItem.operationId,
      `media type ${mediaType} missing on response ${status}`,
    );
  }

  let payloadRootRef: string;
  try {
    payloadRootRef = resolvePayloadRootFromXEventSchema(media);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const code =
      media["x-event-schema"] === undefined
        ? "missing-x-event-schema"
        : "invalid-x-event-schema";
    throw new SelectEventStreamsError(
      code,
      inventoryItem.path,
      inventoryItem.operationId,
      detail,
    );
  }

  return {
    path: inventoryItem.path,
    method: inventoryItem.method,
    operationId: inventoryItem.operationId,
    role: inventoryItem.role,
    roleLabel: inventoryItem.roleLabel,
    status,
    mediaType,
    wireSchema: media.schema,
    payloadRootRef,
    payloadRootSchemaName: schemaNameFromComponentsRef(payloadRootRef),
    preferred: preferredForRole(inventoryItem.role),
    compatibilityLabel: compatibilityLabelForRole(inventoryItem.role),
  };
}

/**
 * Select all inventory SSE streams. Order matches `EVENT_STREAM_OPERATIONS`
 * (canonical → ephemeral → compatibility-only).
 */
export function selectEventStreamsFromOpenApi(
  doc: EventsOpenApiDocument,
  inventory: readonly EventStreamOperation[] = EVENT_STREAM_OPERATIONS,
): SelectedEventStream[] {
  return inventory.map((item) => selectEventStreamFromOpenApi(doc, item));
}

/**
 * Anti-pattern guard: selecting streams by hard-coded component schema names
 * alone is rejected. Real selection always walks path → operation → status →
 * media-type → `x-event-schema`.
 */
export function selectEventStreamsByHardCodedSchemaNamesOnly(
  _doc: EventsOpenApiDocument,
  hardCodedNames: readonly string[],
): never {
  void _doc;
  void hardCodedNames;
  throw new Error(
    "Hard-coded schema-name-only selection is rejected: resolve payload roots from each SSE media type's x-event-schema after selecting by path/operation/status/media-type.",
  );
}
