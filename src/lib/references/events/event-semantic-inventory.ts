/**
 * Semantic inventory + fail-closed validation for the W09 events corpus.
 *
 * OpenAPI remains event truth. Inventory records operation identity, root
 * event schema, discriminator/payload counts, and unresolved-reference count
 * so builds cannot silently ship an incomplete catalog. Optional AsyncAPI
 * projections consume the same inventory and must carry a source hash.
 *
 * Pure helpers — no filesystem IO.
 */

import { createHash } from "node:crypto";
import type { EventsOpenApiComponentsSchemasLike } from "./openapi-document";
import {
  collectEventSchemaRefClosure,
  type EventSchemaRefClosure,
  localSchemaNameFromRef,
} from "./schema-ref-closure";
import type { SelectedEventStream } from "./select-event-streams";
import type { EventStreamRole } from "./stream-operations";

export type EventOperationInventory = {
  path: string;
  operationId: string;
  role: EventStreamRole;
  /** Payload root `$ref` from `x-event-schema`. */
  rootEventSchemaRef: string;
  /** Local component name of the root event schema (empty when not a components ref). */
  rootEventSchemaName: string;
  /**
   * Count of envelope `discriminator.mapping` entries (FactoryEvent `type`
   * mappings). Zero when the root has no discriminator mapping.
   */
  eventTypeCount: number;
  /**
   * Count of payload `oneOf` variants (inline or via `$ref` to a payload
   * schema). Zero when the payload is not a multi-variant union.
   */
  payloadVariantCount: number;
  /** Unresolved transitive `$ref` count for this stream's closure alone. */
  unresolvedReferenceCount: number;
};

export type EventSemanticInventory = {
  /** SHA-256 hex of the packaged OpenAPI artifact bytes used as event truth. */
  sourceHash: string;
  /** Per-operation inventory rows in selection order. */
  operations: EventOperationInventory[];
  /** Union closure stats across all selected roots. */
  schemaClosure: {
    schemaCount: number;
    unresolvedReferenceCount: number;
    unresolvedRefs: string[];
  };
};

export type EventInventoryValidationErrorCode =
  | "missing-x-event-schema"
  | "missing-root-schema"
  | "unresolved-transitive-ref"
  | "inventory-drift";

export class EventInventoryValidationError extends Error {
  readonly code: EventInventoryValidationErrorCode;
  readonly details: string[];

  constructor(
    code: EventInventoryValidationErrorCode,
    message: string,
    details: string[] = [],
  ) {
    super(message);
    this.name = "EventInventoryValidationError";
    this.code = code;
    this.details = details;
  }
}

type SchemaObjectLike = {
  discriminator?: {
    propertyName?: string;
    mapping?: Record<string, string>;
  };
  properties?: Record<string, unknown>;
  oneOf?: unknown[];
  $ref?: string;
};

/**
 * SHA-256 hex digest of packaged OpenAPI source text (UTF-8).
 */
export function hashOpenApiSource(sourceText: string): string {
  return createHash("sha256").update(sourceText, "utf8").digest("hex");
}

function asSchemaObject(value: unknown): SchemaObjectLike | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as SchemaObjectLike;
}

/**
 * Event-type count = number of `discriminator.mapping` keys on the envelope.
 */
export function countEventTypesFromSchema(schema: unknown): number {
  const mapping = asSchemaObject(schema)?.discriminator?.mapping;
  if (!mapping || typeof mapping !== "object") {
    return 0;
  }
  return Object.keys(mapping).length;
}

/**
 * Resolve a property schema that may be an inline object or a `$ref`.
 */
function resolveSchemaNode(
  doc: EventsOpenApiComponentsSchemasLike,
  node: unknown,
): unknown {
  const obj = asSchemaObject(node);
  if (!obj) {
    return node;
  }
  if (typeof obj.$ref === "string") {
    const name = localSchemaNameFromRef(obj.$ref);
    if (!name) {
      return undefined;
    }
    return doc.components?.schemas?.[name];
  }
  return node;
}

/**
 * Payload-variant count = length of `oneOf` on the envelope `payload` property
 * (following a `$ref` to a dedicated payload schema when needed).
 */
export function countPayloadVariantsFromRootSchema(
  doc: EventsOpenApiComponentsSchemasLike,
  rootSchema: unknown,
): number {
  const envelope = asSchemaObject(rootSchema);
  if (!envelope) {
    return 0;
  }

  if (Array.isArray(envelope.oneOf)) {
    return envelope.oneOf.length;
  }

  const payloadProp = envelope.properties?.payload;
  const payloadNode = resolveSchemaNode(doc, payloadProp);
  const payload = asSchemaObject(payloadNode);
  if (!payload) {
    return 0;
  }
  if (Array.isArray(payload.oneOf)) {
    return payload.oneOf.length;
  }
  return 0;
}

/**
 * Build one inventory row for a selected stream using its payload-root closure.
 */
export function buildEventOperationInventory(
  doc: EventsOpenApiComponentsSchemasLike,
  stream: SelectedEventStream,
): EventOperationInventory {
  const rootName = stream.payloadRootSchemaName;
  const rootSchema =
    rootName.length > 0 ? doc.components?.schemas?.[rootName] : undefined;
  const streamClosure = collectEventSchemaRefClosure(doc, [
    stream.payloadRootRef,
  ]);

  return {
    path: stream.path,
    operationId: stream.operationId,
    role: stream.role,
    rootEventSchemaRef: stream.payloadRootRef,
    rootEventSchemaName: rootName,
    eventTypeCount: countEventTypesFromSchema(rootSchema),
    payloadVariantCount: countPayloadVariantsFromRootSchema(doc, rootSchema),
    unresolvedReferenceCount: streamClosure.unresolvedReferenceCount,
  };
}

/**
 * Build the full semantic inventory for selected streams.
 */
export function buildEventSemanticInventory(
  doc: EventsOpenApiComponentsSchemasLike,
  streams: readonly SelectedEventStream[],
  sourceHash: string,
  unionClosure: EventSchemaRefClosure,
): EventSemanticInventory {
  return {
    sourceHash,
    operations: streams.map((stream) =>
      buildEventOperationInventory(doc, stream),
    ),
    schemaClosure: {
      schemaCount: unionClosure.schemaNames.length,
      unresolvedReferenceCount: unionClosure.unresolvedReferenceCount,
      unresolvedRefs: [...unionClosure.unresolvedRefs],
    },
  };
}

/**
 * Fail closed when the closure has unresolved refs or a selected root is missing.
 */
export function assertEventCorpusClosureValid(
  streams: readonly SelectedEventStream[],
  doc: EventsOpenApiComponentsSchemasLike,
  unionClosure: EventSchemaRefClosure,
): void {
  for (const stream of streams) {
    if (
      stream.payloadRootRef.trim().length === 0 ||
      stream.payloadRootSchemaName.length === 0
    ) {
      throw new EventInventoryValidationError(
        "missing-x-event-schema",
        `SSE operation ${stream.operationId} lost a usable x-event-schema payload root (${stream.payloadRootRef}).`,
        [stream.path],
      );
    }

    const rootName = stream.payloadRootSchemaName;
    if (doc.components?.schemas?.[rootName] === undefined) {
      throw new EventInventoryValidationError(
        "missing-root-schema",
        `SSE operation ${stream.operationId} x-event-schema points to missing schema ${stream.payloadRootRef}.`,
        [stream.payloadRootRef],
      );
    }
  }

  if (unionClosure.unresolvedReferenceCount > 0) {
    throw new EventInventoryValidationError(
      "unresolved-transitive-ref",
      `Event corpus gained ${unionClosure.unresolvedReferenceCount} unresolved transitive $ref(s).`,
      unionClosure.unresolvedRefs,
    );
  }
}

function stableInventorySnapshot(inventory: EventSemanticInventory): string {
  return JSON.stringify({
    sourceHash: inventory.sourceHash,
    operations: inventory.operations.map((op) => ({
      path: op.path,
      operationId: op.operationId,
      role: op.role,
      rootEventSchemaRef: op.rootEventSchemaRef,
      rootEventSchemaName: op.rootEventSchemaName,
      eventTypeCount: op.eventTypeCount,
      payloadVariantCount: op.payloadVariantCount,
      unresolvedReferenceCount: op.unresolvedReferenceCount,
    })),
    schemaClosure: {
      schemaCount: inventory.schemaClosure.schemaCount,
      unresolvedReferenceCount:
        inventory.schemaClosure.unresolvedReferenceCount,
      unresolvedRefs: inventory.schemaClosure.unresolvedRefs,
    },
  });
}

/**
 * Fail closed when the live inventory drifts from a previously recorded
 * inventory without regenerating the projection / corpus snapshot.
 */
export function assertEventInventoryMatchesExpected(
  actual: EventSemanticInventory,
  expected: EventSemanticInventory,
): void {
  const actualSnap = stableInventorySnapshot(actual);
  const expectedSnap = stableInventorySnapshot(expected);
  if (actualSnap === expectedSnap) {
    return;
  }

  const details: string[] = [];
  if (actual.sourceHash !== expected.sourceHash) {
    details.push(
      `sourceHash: actual=${actual.sourceHash} expected=${expected.sourceHash}`,
    );
  }
  if (actual.schemaClosure.schemaCount !== expected.schemaClosure.schemaCount) {
    details.push(
      `schemaCount: actual=${actual.schemaClosure.schemaCount} expected=${expected.schemaClosure.schemaCount}`,
    );
  }
  if (
    actual.schemaClosure.unresolvedReferenceCount !==
    expected.schemaClosure.unresolvedReferenceCount
  ) {
    details.push(
      `unresolvedReferenceCount: actual=${actual.schemaClosure.unresolvedReferenceCount} expected=${expected.schemaClosure.unresolvedReferenceCount}`,
    );
  }

  const maxOps = Math.max(actual.operations.length, expected.operations.length);
  for (let i = 0; i < maxOps; i += 1) {
    const a = actual.operations[i];
    const e = expected.operations[i];
    if (!a || !e) {
      details.push(`operations[${i}]: length mismatch`);
      continue;
    }
    for (const key of [
      "path",
      "operationId",
      "role",
      "rootEventSchemaRef",
      "rootEventSchemaName",
      "eventTypeCount",
      "payloadVariantCount",
      "unresolvedReferenceCount",
    ] as const) {
      if (a[key] !== e[key]) {
        details.push(
          `operations[${i}].${key}: actual=${String(a[key])} expected=${String(e[key])}`,
        );
      }
    }
  }

  throw new EventInventoryValidationError(
    "inventory-drift",
    "Semantic inventory drifted from the recorded inventory without regenerating the event corpus / AsyncAPI projection.",
    details,
  );
}

/**
 * Resolve selected streams, build union closure + semantic inventory, and fail
 * closed on unresolved refs / missing roots.
 */
export function resolveEventCorpusInventory(
  doc: EventsOpenApiComponentsSchemasLike,
  streams: readonly SelectedEventStream[],
  sourceHash: string,
): {
  inventory: EventSemanticInventory;
  schemaClosure: EventSchemaRefClosure;
} {
  const rootRefs = streams.map((stream) => stream.payloadRootRef);
  const schemaClosure = collectEventSchemaRefClosure(doc, rootRefs);
  assertEventCorpusClosureValid(streams, doc, schemaClosure);
  const inventory = buildEventSemanticInventory(
    doc,
    streams,
    sourceHash,
    schemaClosure,
  );
  return { inventory, schemaClosure };
}
