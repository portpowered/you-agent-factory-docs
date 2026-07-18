/**
 * Optional OpenAPI→AsyncAPI projection for the W09 events corpus.
 *
 * Generated AsyncAPI is a projection only — never a second authored corpus.
 * OpenAPI remains event truth. Output is source-hashed, carries an explicit
 * generated-file notice, and fails closed on unresolved refs / inventory drift.
 *
 * Pure projection — no filesystem IO. Callers supply already-loaded OpenAPI
 * text/object from `loadEventsOpenApi` (W03 public-subpath resolution).
 *
 * Does not import or pin `@fumadocs/asyncapi`.
 */

import {
  assertEventInventoryMatchesExpected,
  type EventSemanticInventory,
  hashOpenApiSource,
  resolveEventCorpusInventory,
} from "./event-semantic-inventory";
import type { EventsOpenApiDocument } from "./openapi-document";
import type { EventSchemaRefClosure } from "./schema-ref-closure";
import {
  type SelectedEventStream,
  selectEventStreamsFromOpenApi,
} from "./select-event-streams";
import {
  EVENT_STREAM_OPERATIONS,
  type EventStreamOperation,
} from "./stream-operations";

/** Generated-file notice embedded in AsyncAPI info.description. */
export const EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE =
  "GENERATED FILE — optional W09 projection from packaged OpenAPI. Do not hand-edit. Regenerate from the OpenAPI→AsyncAPI projector; OpenAPI remains the canonical event-schema source." as const;

export const EVENTS_ASYNCAPI_VERSION = "3.0.0" as const;

export type EventsProjectedAsyncApiMessage = {
  name: string;
  title: string;
  contentType: "application/json";
  /** Always the x-event-schema envelope root — never a payload-only schema. */
  payload: { $ref: string };
  description: string;
};

export type EventsProjectedAsyncApiChannel = {
  address: string;
  title: string;
  description: string;
  messages: Record<string, { $ref: string }>;
};

export type EventsProjectedAsyncApiDocument = {
  asyncapi: typeof EVENTS_ASYNCAPI_VERSION;
  info: {
    title: string;
    version: string;
    description: string;
    "x-generated-from": "packaged-openapi";
    "x-projection-role": "optional-generated-only";
    /** SHA-256 hex of the packaged OpenAPI artifact used for this projection. */
    "x-openapi-source-hash": string;
    /** Explicit generated-file notice (also mirrored in description). */
    "x-generated-file-notice": typeof EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE;
    /** Machine-checkable semantic inventory for fail-closed drift checks. */
    "x-semantic-inventory": EventSemanticInventory;
  };
  channels: Record<string, EventsProjectedAsyncApiChannel>;
  operations: Record<
    string,
    {
      action: "receive";
      channel: { $ref: string };
      summary: string;
      description: string;
    }
  >;
  components: {
    messages: Record<string, EventsProjectedAsyncApiMessage>;
    schemas: Record<string, unknown>;
  };
};

export type EventsOpenApiToAsyncApiProjection = {
  asyncapi: EventsProjectedAsyncApiDocument;
  selectedStreams: SelectedEventStream[];
  generatedFileNotice: typeof EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE;
  sourceHash: string;
  inventory: EventSemanticInventory;
  schemaClosure: EventSchemaRefClosure;
};

export type ProjectEventsOpenApiToAsyncApiOptions = {
  inventory?: readonly EventStreamOperation[];
  sourceText?: string;
  sourceHash?: string;
  expectedInventory?: EventSemanticInventory;
};

export function channelIdForSelectedEventStream(
  stream: SelectedEventStream,
): string {
  return stream.operationId;
}

export function messageIdForSelectedEventStream(
  stream: SelectedEventStream,
): string {
  if (stream.payloadRootSchemaName.length > 0) {
    return `${stream.operationId}__${stream.payloadRootSchemaName}`;
  }
  return `${stream.operationId}__payload`;
}

function channelDescription(stream: SelectedEventStream): string {
  const preference =
    stream.compatibilityLabel === "compatibility-only-non-preferred"
      ? "Label: compatibility-only / non-preferred. Prefer the canonical session-scoped FactoryEvent stream for new consumers."
      : "Label: preferred consumer stream.";

  return [
    stream.roleLabel,
    `Role: ${stream.role}.`,
    preference,
    `Selected from OpenAPI ${stream.method.toUpperCase()} ${stream.path} responses.${stream.status}.content.${stream.mediaType}.`,
    `Payload root resolved from x-event-schema: ${stream.payloadRootRef}.`,
  ].join(" ");
}

function resolveSourceHash(
  options: ProjectEventsOpenApiToAsyncApiOptions,
): string {
  if (typeof options.sourceText === "string") {
    return hashOpenApiSource(options.sourceText);
  }
  if (typeof options.sourceHash === "string" && options.sourceHash.length > 0) {
    return options.sourceHash;
  }
  throw new Error(
    "Projection requires sourceText or sourceHash so generated AsyncAPI can carry the packaged OpenAPI source hash.",
  );
}

/**
 * Project selected SSE streams into an optional AsyncAPI 3 document.
 */
export function projectSelectedEventStreamsToAsyncApi(
  doc: EventsOpenApiDocument,
  streams: readonly SelectedEventStream[],
  sourceHash: string,
): {
  asyncapi: EventsProjectedAsyncApiDocument;
  inventory: EventSemanticInventory;
  schemaClosure: EventSchemaRefClosure;
} {
  const { inventory, schemaClosure } = resolveEventCorpusInventory(
    doc,
    streams,
    sourceHash,
  );

  const channels: EventsProjectedAsyncApiDocument["channels"] = {};
  const operations: EventsProjectedAsyncApiDocument["operations"] = {};
  const messages: EventsProjectedAsyncApiDocument["components"]["messages"] =
    {};

  for (const stream of streams) {
    const channelId = channelIdForSelectedEventStream(stream);
    const messageId = messageIdForSelectedEventStream(stream);
    const baseDescription = [
      `Message payload root projected from OpenAPI x-event-schema (${stream.payloadRootRef}).`,
      `Source operation: ${stream.operationId} (${stream.role}).`,
      stream.compatibilityLabel === "compatibility-only-non-preferred"
        ? "Compatibility-only / non-preferred stream."
        : "Preferred stream.",
    ].join(" ");

    messages[messageId] = {
      name: messageId,
      title: stream.payloadRootSchemaName || stream.operationId,
      contentType: "application/json",
      payload: { $ref: stream.payloadRootRef },
      description: baseDescription,
    };

    channels[channelId] = {
      address: stream.path,
      title: stream.roleLabel,
      description: channelDescription(stream),
      messages: {
        [messageId]: {
          $ref: `#/components/messages/${messageId}`,
        },
      },
    };

    operations[`receive_${channelId}`] = {
      action: "receive",
      channel: { $ref: `#/channels/${channelId}` },
      summary: `Receive ${stream.roleLabel}`,
      description: channelDescription(stream),
    };
  }

  const asyncapi: EventsProjectedAsyncApiDocument = {
    asyncapi: EVENTS_ASYNCAPI_VERSION,
    info: {
      title: "Factory SSE streams (optional W09 OpenAPI projection)",
      version: "0.0.0-projection",
      description: EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE,
      "x-generated-from": "packaged-openapi",
      "x-projection-role": "optional-generated-only",
      "x-openapi-source-hash": sourceHash,
      "x-generated-file-notice": EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE,
      "x-semantic-inventory": inventory,
    },
    channels,
    operations,
    components: {
      messages,
      schemas: schemaClosure.schemas,
    },
  };

  return { asyncapi, inventory, schemaClosure };
}

/**
 * Optional projector: OpenAPI SSE operations → source-hashed AsyncAPI.
 */
export function projectEventsOpenApiToAsyncApi(
  doc: EventsOpenApiDocument,
  options: ProjectEventsOpenApiToAsyncApiOptions = {},
): EventsOpenApiToAsyncApiProjection {
  const inventoryOps = options.inventory ?? EVENT_STREAM_OPERATIONS;
  const selectedStreams = selectEventStreamsFromOpenApi(doc, inventoryOps);
  const sourceHash = resolveSourceHash(options);
  const projected = projectSelectedEventStreamsToAsyncApi(
    doc,
    selectedStreams,
    sourceHash,
  );

  if (options.expectedInventory) {
    assertEventInventoryMatchesExpected(
      projected.inventory,
      options.expectedInventory,
    );
  }

  return {
    asyncapi: projected.asyncapi,
    selectedStreams,
    generatedFileNotice: EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE,
    sourceHash,
    inventory: projected.inventory,
    schemaClosure: projected.schemaClosure,
  };
}
