/**
 * Story 005 — semantic inventory + fail-closed validation for the temporary
 * OpenAPI→AsyncAPI projector. Pure helpers — no filesystem IO.
 *
 * Inventory records operation identity, root event schema, event-type count,
 * payload-variant count, and unresolved-reference count so later builds cannot
 * silently ship a stale event corpus.
 */

import { createHash } from "node:crypto";
import {
  collectSchemaRefClosure,
  localSchemaNameFromRef,
  type OpenApiComponentsSchemasLike,
  type SchemaRefClosure,
} from "./collect-schema-ref-closure";
import type { SelectedSseStream } from "./select-sse-streams";
import type { SseSpikeRole } from "./sse-operations";

export type ProjectionOperationInventory = {
  path: string;
  operationId: string;
  role: SseSpikeRole;
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

export type ProjectionSemanticInventory = {
  /** SHA-256 hex of the packaged OpenAPI artifact bytes used for projection. */
  sourceHash: string;
  /** Per-operation inventory rows in selection order. */
  operations: ProjectionOperationInventory[];
  /** Union closure stats across all selected roots. */
  schemaClosure: {
    schemaCount: number;
    unresolvedReferenceCount: number;
    unresolvedRefs: string[];
  };
};

export type ProjectionValidationErrorCode =
  | "missing-x-event-schema"
  | "missing-root-schema"
  | "unresolved-transitive-ref"
  | "inventory-drift";

export class ProjectionValidationError extends Error {
  readonly code: ProjectionValidationErrorCode;
  readonly details: string[];

  constructor(
    code: ProjectionValidationErrorCode,
    message: string,
    details: string[] = [],
  ) {
    super(message);
    this.name = "ProjectionValidationError";
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
  doc: OpenApiComponentsSchemasLike,
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
  doc: OpenApiComponentsSchemasLike,
  rootSchema: unknown,
): number {
  const envelope = asSchemaObject(rootSchema);
  if (!envelope) {
    return 0;
  }

  // Some roots are themselves a oneOf union (unusual for envelopes, but keep general).
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
export function buildOperationInventory(
  doc: OpenApiComponentsSchemasLike,
  stream: SelectedSseStream,
): ProjectionOperationInventory {
  const rootName = stream.payloadRootSchemaName;
  const rootSchema =
    rootName.length > 0 ? doc.components?.schemas?.[rootName] : undefined;
  const streamClosure = collectSchemaRefClosure(doc, [stream.payloadRootRef]);

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
 * Build the full semantic inventory for a projection.
 */
export function buildSemanticInventory(
  doc: OpenApiComponentsSchemasLike,
  streams: readonly SelectedSseStream[],
  sourceHash: string,
  unionClosure: SchemaRefClosure,
): ProjectionSemanticInventory {
  return {
    sourceHash,
    operations: streams.map((stream) => buildOperationInventory(doc, stream)),
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
export function assertProjectionClosureValid(
  streams: readonly SelectedSseStream[],
  doc: OpenApiComponentsSchemasLike,
  unionClosure: SchemaRefClosure,
): void {
  for (const stream of streams) {
    if (
      stream.payloadRootRef.trim().length === 0 ||
      stream.payloadRootSchemaName.length === 0
    ) {
      throw new ProjectionValidationError(
        "missing-x-event-schema",
        `SSE operation ${stream.operationId} lost a usable x-event-schema payload root (${stream.payloadRootRef}).`,
        [stream.path],
      );
    }

    const rootName = stream.payloadRootSchemaName;
    if (doc.components?.schemas?.[rootName] === undefined) {
      throw new ProjectionValidationError(
        "missing-root-schema",
        `SSE operation ${stream.operationId} x-event-schema points to missing schema ${stream.payloadRootRef}.`,
        [stream.payloadRootRef],
      );
    }
  }

  if (unionClosure.unresolvedReferenceCount > 0) {
    throw new ProjectionValidationError(
      "unresolved-transitive-ref",
      `Projection gained ${unionClosure.unresolvedReferenceCount} unresolved transitive $ref(s).`,
      unionClosure.unresolvedRefs,
    );
  }
}

function stableInventorySnapshot(
  inventory: ProjectionSemanticInventory,
): string {
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
 * inventory without regenerating the projection.
 */
export function assertInventoryMatchesExpected(
  actual: ProjectionSemanticInventory,
  expected: ProjectionSemanticInventory,
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

  throw new ProjectionValidationError(
    "inventory-drift",
    "Semantic inventory drifted from the recorded inventory without regenerating the projection.",
    details,
  );
}
