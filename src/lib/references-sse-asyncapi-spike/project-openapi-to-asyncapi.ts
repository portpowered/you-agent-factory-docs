/**
 * Temporary deterministic OpenAPI→AsyncAPI projector.
 *
 * Story 004 — selection path (path/operation/status/media-type → x-event-schema).
 * Story 005 — full transitive `$ref` closure, source hash, semantic inventory,
 * and fail-closed validation.
 * Story 006 — FactoryEvent envelope-attached type mappings; FactoryResponseEvent
 * kind/phase/payload selection documented without inventing a discriminator.
 *
 * Input is the packaged OpenAPI document only. Generated AsyncAPI is always
 * regenerated — never a second authored corpus.
 *
 * Pure projection — no filesystem IO. Callers supply already-loaded OpenAPI
 * text/object (from the public packaged artifact / validated acquisition path).
 */

import {
  collectSchemaRefClosure,
  type SchemaRefClosure,
} from "./collect-schema-ref-closure";
import {
  appendEnvelopeRuleDescription,
  assertEnvelopeProjectionRules,
  buildEnvelopeMessageAnnotations,
  type EnvelopeProjectionEvidence,
  type EnvelopeProjectionMessageAnnotations,
} from "./envelope-projection-rules";
import type { OpenApiLike } from "./observe-sse-operations";
import {
  assertInventoryMatchesExpected,
  assertProjectionClosureValid,
  buildSemanticInventory,
  hashOpenApiSource,
  type ProjectionSemanticInventory,
} from "./projection-inventory";
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
  /** Always the x-event-schema envelope root — never a payload-only schema. */
  payload: { $ref: string };
  description: string;
} & EnvelopeProjectionMessageAnnotations;

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
    /** SHA-256 hex of the packaged OpenAPI artifact used for this projection. */
    "x-openapi-source-hash": string;
    /** Explicit generated-file notice (also mirrored in description). */
    "x-generated-file-notice": typeof ASYNCAPI_GENERATED_FILE_NOTICE;
    /** Machine-checkable semantic inventory for fail-closed drift checks. */
    "x-semantic-inventory": ProjectionSemanticInventory;
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
    /** Full transitive schema closure for selected payload roots. */
    schemas: Record<string, unknown>;
  };
};

export type OpenApiToAsyncApiProjection = {
  /** Regenerated AsyncAPI document (never treat as authored corpus). */
  asyncapi: ProjectedAsyncApiDocument;
  /** Streams selected by path/operation/status/media-type + x-event-schema. */
  selectedStreams: SelectedSseStream[];
  /** Explicit notice that the document is generated. */
  generatedFileNotice: typeof ASYNCAPI_GENERATED_FILE_NOTICE;
  /** SHA-256 hex of the packaged OpenAPI source. */
  sourceHash: string;
  /** Semantic inventory for the projection. */
  inventory: ProjectionSemanticInventory;
  /** Union `$ref` closure across selected roots. */
  schemaClosure: SchemaRefClosure;
  /** Envelope-attachment / no-invented-discriminator evidence (story 006). */
  envelopeEvidence: EnvelopeProjectionEvidence;
};

export type ProjectOpenApiSseOptions = {
  inventory?: readonly SseSpikeOperation[];
  /**
   * Exact packaged OpenAPI source text used to compute `x-openapi-source-hash`.
   * Prefer this over a precomputed hash so the digest always matches bytes.
   */
  sourceText?: string;
  /** Precomputed SHA-256 hex when source text is unavailable. */
  sourceHash?: string;
  /**
   * When provided, projection fails closed if the live inventory drifts from
   * this recorded snapshot (must regenerate instead of shipping stale output).
   */
  expectedInventory?: ProjectionSemanticInventory;
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

function resolveSourceHash(options: ProjectOpenApiSseOptions): string {
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
 * Project selected SSE streams into a temporary AsyncAPI 3 document, copying
 * the full transitive schema closure for selected payload roots.
 */
export function projectSelectedStreamsToAsyncApi(
  doc: OpenApiLike & {
    components?: { schemas?: Record<string, unknown> };
  },
  streams: readonly SelectedSseStream[],
  sourceHash: string,
): {
  asyncapi: ProjectedAsyncApiDocument;
  inventory: ProjectionSemanticInventory;
  schemaClosure: SchemaRefClosure;
  envelopeEvidence: EnvelopeProjectionEvidence;
} {
  const rootRefs = streams.map((stream) => stream.payloadRootRef);
  const schemaClosure = collectSchemaRefClosure(doc, rootRefs);
  assertProjectionClosureValid(streams, doc, schemaClosure);

  const inventory = buildSemanticInventory(
    doc,
    streams,
    sourceHash,
    schemaClosure,
  );

  const channels: ProjectedAsyncApiDocument["channels"] = {};
  const operations: ProjectedAsyncApiDocument["operations"] = {};
  const messages: ProjectedAsyncApiDocument["components"]["messages"] = {};

  for (const stream of streams) {
    const channelId = channelIdForSelectedStream(stream);
    const messageId = messageIdForSelectedStream(stream);
    const envelopeAnnotations = buildEnvelopeMessageAnnotations(
      stream.payloadRootSchemaName,
    );
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
      // Envelope root only — never emit payload-variant schemas as standalone
      // complete event messages (FactoryEvent mapping targets stay fragments).
      payload: { $ref: stream.payloadRootRef },
      description: appendEnvelopeRuleDescription(
        baseDescription,
        stream.payloadRootSchemaName,
      ),
      ...envelopeAnnotations,
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

  const asyncapi: ProjectedAsyncApiDocument = {
    asyncapi: ASYNCAPI_SPIKE_VERSION,
    info: {
      title: "Factory SSE streams (temporary W02 projection)",
      version: "0.0.0-spike",
      description: ASYNCAPI_GENERATED_FILE_NOTICE,
      "x-generated-from": "packaged-openapi",
      "x-spike-status": "non-production-temporary",
      "x-openapi-source-hash": sourceHash,
      "x-generated-file-notice": ASYNCAPI_GENERATED_FILE_NOTICE,
      "x-semantic-inventory": inventory,
    },
    channels,
    operations,
    components: {
      messages,
      schemas: schemaClosure.schemas,
    },
  };

  const envelopeEvidence = assertEnvelopeProjectionRules(asyncapi, streams);

  return {
    asyncapi,
    inventory,
    schemaClosure,
    envelopeEvidence,
  };
}

/**
 * Project packaged OpenAPI SSE operations to AsyncAPI using the selection path,
 * full `$ref` closure, source hash, and semantic inventory.
 */
export function projectOpenApiSseToAsyncApi(
  doc: OpenApiLike & {
    components?: { schemas?: Record<string, unknown> };
  },
  options: ProjectOpenApiSseOptions = {},
): OpenApiToAsyncApiProjection {
  const inventoryOps = options.inventory ?? SSE_SPIKE_OPERATIONS;
  const selectedStreams = selectSseStreamsFromOpenApi(doc, inventoryOps);
  const sourceHash = resolveSourceHash(options);
  const projected = projectSelectedStreamsToAsyncApi(
    doc,
    selectedStreams,
    sourceHash,
  );

  if (options.expectedInventory) {
    assertInventoryMatchesExpected(
      projected.inventory,
      options.expectedInventory,
    );
  }

  return {
    asyncapi: projected.asyncapi,
    selectedStreams,
    generatedFileNotice: ASYNCAPI_GENERATED_FILE_NOTICE,
    sourceHash,
    inventory: projected.inventory,
    schemaClosure: projected.schemaClosure,
    envelopeEvidence: projected.envelopeEvidence,
  };
}
