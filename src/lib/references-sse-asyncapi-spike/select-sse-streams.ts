/**
 * Story 004 — temporary OpenAPI→AsyncAPI projector selection path.
 *
 * Selects SSE streams by OpenAPI path / operation / response status /
 * `text/event-stream` media type, then resolves payload roots from that media
 * type's `x-event-schema`. Never hard-codes schema component names as the
 * selection mechanism.
 *
 * Pure document inspection — no filesystem IO.
 */

import {
  SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE,
  SSE_SPIKE_RESPONSE_STATUS,
} from "./native-sse-render-evidence";
import type { OpenApiLike } from "./observe-sse-operations";
import {
  SSE_SPIKE_OPERATIONS,
  type SseSpikeOperation,
  type SseSpikeRole,
} from "./sse-operations";

export { SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE, SSE_SPIKE_RESPONSE_STATUS };

export type SseStreamMediaTypeObject = {
  schema?: unknown;
  "x-event-schema"?: unknown;
};

export type SelectedSseStream = {
  path: string;
  method: "get";
  operationId: string;
  role: SseSpikeRole;
  roleLabel: string;
  /** Response status used for selection (always 200 for published SSE ops). */
  status: typeof SSE_SPIKE_RESPONSE_STATUS;
  /** Media type used for selection. */
  mediaType: typeof SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE;
  /** Wire schema on the media type (typically a plain string). */
  wireSchema: unknown;
  /**
   * Payload root JSON Pointer / `$ref` resolved from `x-event-schema`.
   * Never invent schema names; always read the extension.
   */
  payloadRootRef: string;
  /**
   * Local component name derived from the resolved `$ref` (for AsyncAPI
   * message labels). Empty when the ref is not a components/schemas pointer.
   */
  payloadRootSchemaName: string;
  /**
   * Preferred consumer streams are canonical + ephemeral. Compatibility-only
   * `GET /events` is projected when present but labeled non-preferred.
   */
  preferred: boolean;
  /** Explicit role label for generated AsyncAPI channel descriptions. */
  compatibilityLabel: "preferred" | "compatibility-only-non-preferred";
};

export type SelectSseStreamsErrorCode =
  | "missing-path"
  | "missing-operation"
  | "operation-id-mismatch"
  | "missing-response"
  | "missing-text-event-stream"
  | "missing-x-event-schema"
  | "invalid-x-event-schema";

export class SelectSseStreamsError extends Error {
  readonly code: SelectSseStreamsErrorCode;
  readonly path: string;
  readonly operationId: string;

  constructor(
    code: SelectSseStreamsErrorCode,
    path: string,
    operationId: string,
    detail: string,
  ) {
    super(
      `SSE stream selection failed for ${operationId} (${path}): ${code} — ${detail}`,
    );
    this.name = "SelectSseStreamsError";
    this.code = code;
    this.path = path;
    this.operationId = operationId;
  }
}

/**
 * Read the `text/event-stream` media-type object for one path/status without
 * inventing schema names.
 */
export function readSseMediaTypeObject(
  doc: OpenApiLike,
  path: string,
  status: string = SSE_SPIKE_RESPONSE_STATUS,
  mediaType: string = SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE,
): SseStreamMediaTypeObject | undefined {
  return doc.paths?.[path]?.get?.responses?.[status]?.content?.[mediaType] as
    | SseStreamMediaTypeObject
    | undefined;
}

/**
 * Resolve the payload root from a media type's `x-event-schema`. Accepts a
 * JSON Pointer string (for example `#/components/schemas/FactoryEvent`).
 */
export function resolvePayloadRootFromXEventSchema(
  media: SseStreamMediaTypeObject | undefined,
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

function preferredForRole(role: SseSpikeRole): boolean {
  return role !== "compatibility-only";
}

function compatibilityLabelForRole(
  role: SseSpikeRole,
): SelectedSseStream["compatibilityLabel"] {
  return role === "compatibility-only"
    ? "compatibility-only-non-preferred"
    : "preferred";
}

/**
 * Select one SSE stream by path / operation / status / media type and resolve
 * its payload root from `x-event-schema`.
 */
export function selectSseStreamFromOpenApi(
  doc: OpenApiLike,
  inventoryItem: SseSpikeOperation,
  options: {
    status?: typeof SSE_SPIKE_RESPONSE_STATUS;
    mediaType?: typeof SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE;
  } = {},
): SelectedSseStream {
  const status = options.status ?? SSE_SPIKE_RESPONSE_STATUS;
  const mediaType = options.mediaType ?? SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE;
  const pathItem = doc.paths?.[inventoryItem.path];
  if (!pathItem) {
    throw new SelectSseStreamsError(
      "missing-path",
      inventoryItem.path,
      inventoryItem.operationId,
      "path missing from OpenAPI paths object",
    );
  }

  const operation = pathItem.get;
  if (!operation) {
    throw new SelectSseStreamsError(
      "missing-operation",
      inventoryItem.path,
      inventoryItem.operationId,
      "GET operation missing",
    );
  }

  if (operation.operationId !== inventoryItem.operationId) {
    throw new SelectSseStreamsError(
      "operation-id-mismatch",
      inventoryItem.path,
      inventoryItem.operationId,
      `expected operationId ${inventoryItem.operationId}, found ${String(operation.operationId)}`,
    );
  }

  const response = operation.responses?.[status];
  if (!response) {
    throw new SelectSseStreamsError(
      "missing-response",
      inventoryItem.path,
      inventoryItem.operationId,
      `response ${status} missing`,
    );
  }

  const media = response.content?.[mediaType] as
    | SseStreamMediaTypeObject
    | undefined;
  if (!media) {
    throw new SelectSseStreamsError(
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
    throw new SelectSseStreamsError(
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
 * Select all inventory SSE streams. Order matches `SSE_SPIKE_OPERATIONS`
 * (canonical → ephemeral → compatibility-only).
 */
export function selectSseStreamsFromOpenApi(
  doc: OpenApiLike,
  inventory: readonly SseSpikeOperation[] = SSE_SPIKE_OPERATIONS,
): SelectedSseStream[] {
  return inventory.map((item) => selectSseStreamFromOpenApi(doc, item));
}

/**
 * Anti-pattern guard for tests: selecting streams by hard-coded component
 * schema names alone is not the spike mechanism. Real selection always walks
 * path → operation → status → `text/event-stream` → `x-event-schema`.
 */
export function selectSseStreamsByHardCodedSchemaNamesOnly(
  _doc: OpenApiLike,
  hardCodedNames: readonly string[],
): never {
  void _doc;
  void hardCodedNames;
  throw new Error(
    "Hard-coded schema-name-only selection is rejected: resolve payload roots from each SSE media type's x-event-schema after selecting by path/operation/status/media-type.",
  );
}
