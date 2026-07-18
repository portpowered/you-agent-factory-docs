/**
 * Story 004 — temporary deterministic OpenAPI→AsyncAPI projector (selection
 * path). Input is the packaged OpenAPI document only. Generated AsyncAPI is
 * always regenerated from selection results — never a second authored corpus.
 *
 * Full transitive `$ref` closure, source hash, and inventory validation land
 * in story 005. This module emits a minimal AsyncAPI 3 document whose channels
 * and message payload `$ref`s come from selected streams' `x-event-schema`.
 *
 * Pure projection — no filesystem IO.
 */

import type { OpenApiLike } from "./observe-sse-operations";
import {
  type SelectedSseStream,
  selectSseStreamsFromOpenApi,
} from "./select-sse-streams";
import { SSE_SPIKE_OPERATIONS, type SseSpikeOperation } from "./sse-operations";

/** Generated-file notice embedded in AsyncAPI info.description. */
export const ASYNCAPI_GENERATED_FILE_NOTICE =
  "GENERATED FILE — temporary W02 spike projection from packaged OpenAPI. Do not hand-edit. Regenerate from the OpenAPI→AsyncAPI projector; OpenAPI remains the canonical event-schema source." as const;

export const ASYNCAPI_SPIKE_VERSION = "3.0.0" as const;

export type AsyncApiMessage = {
  name: string;
  title: string;
  contentType: "application/json";
  payload: { $ref: string };
  description: string;
};

export type AsyncApiChannel = {
  address: string;
  title: string;
  description: string;
  messages: Record<string, { $ref: string }>;
};

export type ProjectedAsyncApiDocument = {
  asyncapi: typeof ASYNCAPI_SPIKE_VERSION;
  info: {
    title: string;
    version: string;
    description: string;
    "x-generated-from": "packaged-openapi";
    "x-spike-status": "non-production-temporary";
  };
  channels: Record<string, AsyncApiChannel>;
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
    messages: Record<string, AsyncApiMessage>;
  };
};

export type OpenApiToAsyncApiProjection = {
  /** Regenerated AsyncAPI document (never treat as authored corpus). */
  asyncapi: ProjectedAsyncApiDocument;
  /** Streams selected by path/operation/status/media-type + x-event-schema. */
  selectedStreams: SelectedSseStream[];
  /** Explicit notice that the document is generated. */
  generatedFileNotice: typeof ASYNCAPI_GENERATED_FILE_NOTICE;
};

/**
 * Deterministic channel id from operation identity (not from schema names).
 */
export function channelIdForSelectedStream(stream: SelectedSseStream): string {
  return stream.operationId;
}

/**
 * Deterministic message component id. Prefer the schema name from the resolved
 * `x-event-schema` ref so renamed roots stay attached; fall back to operationId.
 */
export function messageIdForSelectedStream(stream: SelectedSseStream): string {
  if (stream.payloadRootSchemaName.length > 0) {
    return `${stream.operationId}__${stream.payloadRootSchemaName}`;
  }
  return `${stream.operationId}__payload`;
}

function channelDescription(stream: SelectedSseStream): string {
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

/**
 * Project selected SSE streams into a temporary AsyncAPI 3 document.
 * Payload `$ref`s are copied from each stream's resolved `x-event-schema`.
 */
export function projectSelectedStreamsToAsyncApi(
  streams: readonly SelectedSseStream[],
): ProjectedAsyncApiDocument {
  const channels: ProjectedAsyncApiDocument["channels"] = {};
  const operations: ProjectedAsyncApiDocument["operations"] = {};
  const messages: ProjectedAsyncApiDocument["components"]["messages"] = {};

  for (const stream of streams) {
    const channelId = channelIdForSelectedStream(stream);
    const messageId = messageIdForSelectedStream(stream);

    messages[messageId] = {
      name: messageId,
      title: stream.payloadRootSchemaName || stream.operationId,
      contentType: "application/json",
      payload: { $ref: stream.payloadRootRef },
      description: [
        `Message payload root projected from OpenAPI x-event-schema (${stream.payloadRootRef}).`,
        `Source operation: ${stream.operationId} (${stream.role}).`,
        stream.compatibilityLabel === "compatibility-only-non-preferred"
          ? "Compatibility-only / non-preferred stream."
          : "Preferred stream.",
      ].join(" "),
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

  return {
    asyncapi: ASYNCAPI_SPIKE_VERSION,
    info: {
      title: "Factory SSE streams (temporary W02 projection)",
      version: "0.0.0-spike",
      description: ASYNCAPI_GENERATED_FILE_NOTICE,
      "x-generated-from": "packaged-openapi",
      "x-spike-status": "non-production-temporary",
    },
    channels,
    operations,
    components: { messages },
  };
}

/**
 * Project packaged OpenAPI SSE operations to AsyncAPI using the selection path.
 * Callers supply an already-loaded unmodified OpenAPI object (from the public
 * packaged artifact / validated acquisition path).
 */
export function projectOpenApiSseToAsyncApi(
  doc: OpenApiLike,
  inventory: readonly SseSpikeOperation[] = SSE_SPIKE_OPERATIONS,
): OpenApiToAsyncApiProjection {
  const selectedStreams = selectSseStreamsFromOpenApi(doc, inventory);
  return {
    asyncapi: projectSelectedStreamsToAsyncApi(selectedStreams),
    selectedStreams,
    generatedFileNotice: ASYNCAPI_GENERATED_FILE_NOTICE,
  };
}
