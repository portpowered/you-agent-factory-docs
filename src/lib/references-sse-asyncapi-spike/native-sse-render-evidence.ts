/**
 * Story 002 — machine-checkable evidence for how native fumadocs-openapi
 * displays `text/event-stream` and whether it ignores, exposes, or traverses
 * `x-event-schema`.
 *
 * Classification of the renderer behavior is measured against
 * fumadocs-openapi@10.10.3 on `/spikes/sse-openapi`. OpenAPI observers cite
 * the unmodified media-type objects so reviewers can reproduce the inputs.
 */

import {
  type OpenApiLike,
  observeSseOperationsFromOpenApi,
} from "./observe-sse-operations";
import {
  SSE_SPIKE_OPERATIONS,
  type SseSpikeOperationItem,
  type SseSpikeRole,
} from "./sse-operations";

/** How the native response-body UI presents the SSE media schema. */
export type NativeTextEventStreamDisplay =
  /** Response schema UI shows a plain JSON Schema `string` (plus description). */
  | "plain-string-schema"
  /** Reserved if a future renderer adds a dedicated stream/event UI. */
  | "richer-stream-ui";

/**
 * How the native renderer treats the media-type vendor extension
 * `x-event-schema`.
 */
export type NativeXEventSchemaHandling =
  /** Extension retained on the document but not shown or followed in the UI. */
  | "ignored"
  /** Extension shown as opaque metadata without resolving the payload schema. */
  | "exposed-opaque"
  /** Extension followed so the payload component schema becomes the response root. */
  | "traversed";

export const SSE_SPIKE_RESPONSE_STATUS = "200" as const;
export const SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE = "text/event-stream" as const;

/**
 * Measured native fumadocs-openapi@10.10.3 behavior for this spike's three
 * SSE operations (see investigation evidence + HTML probes).
 */
export const NATIVE_FUMADOCS_SSE_RENDER = {
  renderer: "fumadocs-openapi@10.10.3",
  textEventStreamDisplay:
    "plain-string-schema" as const satisfies NativeTextEventStreamDisplay,
  xEventSchemaHandling: "ignored" as const satisfies NativeXEventSchemaHandling,
} as const;

export type CitedSseMediaType = {
  path: string;
  method: "get";
  operationId: string | undefined;
  role: SseSpikeRole;
  roleLabel: string;
  status: typeof SSE_SPIKE_RESPONSE_STATUS;
  mediaType: typeof SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE;
  /** Exact `schema` object on the media type (unmodified OpenAPI). */
  schema: unknown;
  /** Exact `x-event-schema` value on the media type (unmodified OpenAPI). */
  xEventSchema: unknown;
};

export type NativeSseRenderEvidence = CitedSseMediaType & {
  schemaIsPlainString: boolean;
  schemaDescription: string | undefined;
  xEventSchemaRef: string | undefined;
  /** OpenAPI-side: media schema does not `$ref` / embed the x-event-schema target. */
  mediaSchemaDoesNotTraverseXEventSchema: boolean;
  textEventStreamDisplay: NativeTextEventStreamDisplay;
  xEventSchemaHandling: NativeXEventSchemaHandling;
};

export type RenderedSpikeHtmlProbe = {
  textEventStreamMediaLabelCount: number;
  responseBodyStringTypeCount: number;
  /** Literal extension target for FactoryEvent — absent when not exposed/traversed. */
  factoryEventSchemaRefCount: number;
  /** Prose mentions of the extension name (operation descriptions). */
  xEventSchemaProseCount: number;
  discriminatorTokenCount: number;
  textEventStreamDisplay: NativeTextEventStreamDisplay;
  xEventSchemaHandling: NativeXEventSchemaHandling;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mediaTypeObject(
  doc: OpenApiLike,
  path: string,
): Record<string, unknown> | undefined {
  const content =
    doc.paths?.[path]?.get?.responses?.[SSE_SPIKE_RESPONSE_STATUS]?.content?.[
      SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE
    ];
  return isRecord(content) ? content : undefined;
}

/** True when the media `schema` is a non-`$ref` JSON Schema string type. */
export function schemaIsPlainString(schema: unknown): boolean {
  if (!isRecord(schema)) return false;
  if (typeof schema.$ref === "string") return false;
  return schema.type === "string";
}

function schemaDescription(schema: unknown): string | undefined {
  if (!isRecord(schema)) return undefined;
  return typeof schema.description === "string"
    ? schema.description
    : undefined;
}

function xEventSchemaRef(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * True when the media `schema` is not itself a `$ref` (or inline object) that
 * already is the `x-event-schema` payload root — i.e. OpenAPI keeps the wire
 * schema as a plain string while the payload root lives only on the extension.
 */
export function mediaSchemaDoesNotTraverseXEventSchema(
  schema: unknown,
  xEventSchema: unknown,
): boolean {
  const ref = xEventSchemaRef(xEventSchema);
  if (!ref) return false;
  if (!isRecord(schema)) return true;
  if (schema.$ref === ref) return false;
  // Plain string (or any non-ref schema) means the payload root was not inlined.
  return schema.$ref === undefined;
}

/**
 * Cite the unmodified OpenAPI media-type object for each inventory SSE
 * operation (path, method, status, media type, schema, x-event-schema).
 */
export function citeSseMediaTypesFromOpenApi(
  doc: OpenApiLike,
  inventory: readonly SseSpikeOperationItem[] = SSE_SPIKE_OPERATIONS,
): CitedSseMediaType[] {
  const observed = observeSseOperationsFromOpenApi(doc, inventory);
  return observed.map((entry) => {
    const media = mediaTypeObject(doc, entry.path);
    return {
      path: entry.path,
      method: "get",
      operationId: entry.operationId,
      role: entry.role,
      roleLabel: entry.roleLabel,
      status: SSE_SPIKE_RESPONSE_STATUS,
      mediaType: SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE,
      schema: media?.schema,
      xEventSchema: media?.["x-event-schema"],
    };
  });
}

/**
 * Build per-operation native-render evidence from an OpenAPI document plus the
 * measured fumadocs-openapi display classification for this spike.
 */
export function observeNativeSseRenderEvidence(
  doc: OpenApiLike,
  inventory: readonly SseSpikeOperationItem[] = SSE_SPIKE_OPERATIONS,
): NativeSseRenderEvidence[] {
  return citeSseMediaTypesFromOpenApi(doc, inventory).map((cited) => {
    const plain = schemaIsPlainString(cited.schema);
    const noTraverse = mediaSchemaDoesNotTraverseXEventSchema(
      cited.schema,
      cited.xEventSchema,
    );
    const display: NativeTextEventStreamDisplay = plain
      ? NATIVE_FUMADOCS_SSE_RENDER.textEventStreamDisplay
      : "richer-stream-ui";
    // For this packaged contract, plain string + non-traversing schema matches
    // the measured "ignored" handling. If OpenAPI itself inlined the payload
    // root into `schema`, that would be traversal at the document layer.
    const handling: NativeXEventSchemaHandling =
      plain && noTraverse
        ? NATIVE_FUMADOCS_SSE_RENDER.xEventSchemaHandling
        : noTraverse
          ? "exposed-opaque"
          : "traversed";

    return {
      ...cited,
      schemaIsPlainString: plain,
      schemaDescription: schemaDescription(cited.schema),
      xEventSchemaRef: xEventSchemaRef(cited.xEventSchema),
      mediaSchemaDoesNotTraverseXEventSchema: noTraverse,
      textEventStreamDisplay: display,
      xEventSchemaHandling: handling,
    };
  });
}

/**
 * Probe a rendered `/spikes/sse-openapi` HTML document for native display
 * signals (media-type label, string schema UI, absence of payload-schema
 * traversal / extension-field exposure).
 */
export function probeRenderedSpikeHtml(html: string): RenderedSpikeHtmlProbe {
  const textEventStreamMediaLabelCount = countOccurrences(
    html,
    "text/event-stream",
  );
  const responseBodyStringTypeCount = countOccurrences(
    html,
    'font-mono">string</span>',
  );
  const factoryEventSchemaRefCount = countOccurrences(
    html,
    "#/components/schemas/FactoryEvent",
  );
  const xEventSchemaProseCount = countOccurrences(html, "x-event-schema");
  const discriminatorTokenCount = countOccurrences(html, "discriminator");

  const textEventStreamDisplay: NativeTextEventStreamDisplay =
    responseBodyStringTypeCount > 0 && factoryEventSchemaRefCount === 0
      ? "plain-string-schema"
      : "richer-stream-ui";

  // Extension name may appear in operation description prose; the payload
  // `$ref` target must be absent for "ignored" (not exposed, not traversed).
  const xEventSchemaHandling: NativeXEventSchemaHandling =
    factoryEventSchemaRefCount === 0 && discriminatorTokenCount === 0
      ? "ignored"
      : factoryEventSchemaRefCount > 0 && discriminatorTokenCount > 0
        ? "traversed"
        : "exposed-opaque";

  return {
    textEventStreamMediaLabelCount,
    responseBodyStringTypeCount,
    factoryEventSchemaRefCount,
    xEventSchemaProseCount,
    discriminatorTokenCount,
    textEventStreamDisplay,
    xEventSchemaHandling,
  };
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let index = 0;
  while (true) {
    const found = haystack.indexOf(needle, index);
    if (found === -1) return count;
    count += 1;
    index = found + needle.length;
  }
}
