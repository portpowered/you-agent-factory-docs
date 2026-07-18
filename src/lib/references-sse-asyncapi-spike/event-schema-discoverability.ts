/**
 * Story 003 — machine-checkable evidence for whether native SSE operation
 * rendering makes FactoryEvent discriminator mappings and FactoryResponseEvent
 * kind/phase/oneOf payload shapes discoverable without a custom projection.
 *
 * Distinguishes:
 * - Contract facts on `components.schemas` (what OpenAPI defines)
 * - Native SSE render discoverability (what fumadocs-openapi shows on the
 *   operation page when `x-event-schema` is ignored — see story 002)
 */

import {
  type CitedSseMediaType,
  citeSseMediaTypesFromOpenApi,
  NATIVE_FUMADOCS_SSE_RENDER,
} from "./native-sse-render-evidence";
import type { OpenApiLike } from "./observe-sse-operations";
import {
  SSE_SPIKE_OPERATIONS,
  type SseSpikeOperationItem,
  type SseSpikeRole,
} from "./sse-operations";

export const FACTORY_EVENT_SCHEMA_NAME = "FactoryEvent" as const;
export const FACTORY_RESPONSE_EVENT_SCHEMA_NAME =
  "FactoryResponseEvent" as const;
export const FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME =
  "FactoryResponseEventPayload" as const;

export const FACTORY_EVENT_SCHEMA_REF =
  `#/components/schemas/${FACTORY_EVENT_SCHEMA_NAME}` as const;
export const FACTORY_RESPONSE_EVENT_SCHEMA_REF =
  `#/components/schemas/${FACTORY_RESPONSE_EVENT_SCHEMA_NAME}` as const;
export const FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF =
  `#/components/schemas/${FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME}` as const;

/** Whether a contract fact is visible from the native SSE operation render. */
export type NativeDiscoverability =
  /** Visible on the SSE operation page without following x-event-schema. */
  | "discoverable"
  /** Present in OpenAPI components but not shown on the native SSE render. */
  | "not-discoverable";

export type OpenApiComponentsLike = OpenApiLike & {
  components?: {
    schemas?: Record<string, unknown>;
  };
};

export type FactoryEventContractFacts = {
  schemaName: typeof FACTORY_EVENT_SCHEMA_NAME;
  schemaRef: typeof FACTORY_EVENT_SCHEMA_REF;
  hasTypeDiscriminator: boolean;
  discriminatorPropertyName: string | undefined;
  /** Count of `discriminator.mapping` entries (type → payload schema). */
  mappingCount: number;
  mappingKeys: string[];
  payloadIsOneOf: boolean;
  payloadVariantCount: number;
};

export type FactoryResponseEventContractFacts = {
  schemaName: typeof FACTORY_RESPONSE_EVENT_SCHEMA_NAME;
  schemaRef: typeof FACTORY_RESPONSE_EVENT_SCHEMA_REF;
  hasKindProperty: boolean;
  hasPhaseProperty: boolean;
  payloadSchemaRef: string | undefined;
  /** Envelope itself has no OpenAPI discriminator object. */
  envelopeHasDiscriminator: boolean;
  payloadHasOneOf: boolean;
  payloadVariantCount: number;
  /** Payload union has no single propertyName discriminator like FactoryEvent.type. */
  payloadHasDiscriminator: boolean;
  /**
   * Contract note: selection uses kind + phase + structural decoding, not a
   * single simple discriminator mapping like FactoryEvent.type.
   */
  usesSimpleTypeDiscriminatorLikeFactoryEvent: false;
};

export type NativeEventSchemaDiscoverability = {
  role: SseSpikeRole;
  roleLabel: string;
  path: string;
  operationId: string | undefined;
  xEventSchemaRef: string | undefined;
  /** Payload root named by x-event-schema for this stream. */
  rootEventSchema:
    | typeof FACTORY_EVENT_SCHEMA_NAME
    | typeof FACTORY_RESPONSE_EVENT_SCHEMA_NAME
    | "unknown";
  factoryEventTypeMappingsDiscoverable: NativeDiscoverability;
  factoryResponseEventKindPhaseOneOfDiscoverable: NativeDiscoverability;
  /** Why the native page cannot show the payload corpus (story 002 baseline). */
  reason: string;
};

export type EventSchemaDiscoverabilityEvidence = {
  renderer: typeof NATIVE_FUMADOCS_SSE_RENDER.renderer;
  xEventSchemaHandling: typeof NATIVE_FUMADOCS_SSE_RENDER.xEventSchemaHandling;
  factoryEvent: FactoryEventContractFacts;
  factoryResponseEvent: FactoryResponseEventContractFacts;
  operations: NativeEventSchemaDiscoverability[];
};

export type DiscoverabilityHtmlProbe = {
  factoryEventSchemaRefCount: number;
  factoryResponseEventSchemaRefCount: number;
  discriminatorTokenCount: number;
  /** Sample FactoryEvent.type mapping key — absent when not discoverable. */
  runRequestMappingKeyCount: number;
  factoryResponseEventKindTokenCount: number;
  factoryResponseEventPhaseTokenCount: number;
  /** Nested content-block discriminator must not imply envelope discovery. */
  contentBlockDiscriminatorNoise: boolean;
  factoryEventTypeMappingsDiscoverable: NativeDiscoverability;
  factoryResponseEventKindPhaseOneOfDiscoverable: NativeDiscoverability;
  rolesDistinguishable: boolean;
  roleMarkerCounts: Record<SseSpikeRole, number>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function componentSchema(
  doc: OpenApiComponentsLike,
  name: string,
): Record<string, unknown> | undefined {
  const schema = doc.components?.schemas?.[name];
  return isRecord(schema) ? schema : undefined;
}

function schemaRefName(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  const prefix = "#/components/schemas/";
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : undefined;
}

function readDiscriminator(schema: Record<string, unknown> | undefined): {
  propertyName: string | undefined;
  mapping: Record<string, string>;
} {
  if (!isRecord(schema?.discriminator)) {
    return { propertyName: undefined, mapping: {} };
  }
  const propertyName =
    typeof schema.discriminator.propertyName === "string"
      ? schema.discriminator.propertyName
      : undefined;
  const mappingRaw = schema.discriminator.mapping;
  const mapping: Record<string, string> = {};
  if (isRecord(mappingRaw)) {
    for (const [key, value] of Object.entries(mappingRaw)) {
      if (typeof value === "string") mapping[key] = value;
    }
  }
  return { propertyName, mapping };
}

function payloadOneOfCount(schema: Record<string, unknown> | undefined): {
  isOneOf: boolean;
  count: number;
} {
  if (!schema) return { isOneOf: false, count: 0 };
  const payload = isRecord(schema.properties)
    ? schema.properties.payload
    : undefined;
  if (isRecord(payload) && Array.isArray(payload.oneOf)) {
    return { isOneOf: true, count: payload.oneOf.length };
  }
  return { isOneOf: false, count: 0 };
}

function oneOfCount(schema: Record<string, unknown> | undefined): {
  isOneOf: boolean;
  count: number;
} {
  if (!schema || !Array.isArray(schema.oneOf)) {
    return { isOneOf: false, count: 0 };
  }
  return { isOneOf: true, count: schema.oneOf.length };
}

/**
 * Contract facts for FactoryEvent on packaged OpenAPI components.schemas.
 * These exist in the document regardless of native SSE render discoverability.
 */
export function observeFactoryEventContractFacts(
  doc: OpenApiComponentsLike,
): FactoryEventContractFacts {
  const schema = componentSchema(doc, FACTORY_EVENT_SCHEMA_NAME);
  const { propertyName, mapping } = readDiscriminator(schema);
  const payload = payloadOneOfCount(schema);
  const mappingKeys = Object.keys(mapping).sort();

  return {
    schemaName: FACTORY_EVENT_SCHEMA_NAME,
    schemaRef: FACTORY_EVENT_SCHEMA_REF,
    hasTypeDiscriminator: propertyName === "type" && mappingKeys.length > 0,
    discriminatorPropertyName: propertyName,
    mappingCount: mappingKeys.length,
    mappingKeys,
    payloadIsOneOf: payload.isOneOf,
    payloadVariantCount: payload.count,
  };
}

/**
 * Contract facts for FactoryResponseEvent + its payload union. Documents that
 * OpenAPI does not supply a single simple discriminator mapping like
 * FactoryEvent.type on the response-event envelope or payload union.
 */
export function observeFactoryResponseEventContractFacts(
  doc: OpenApiComponentsLike,
): FactoryResponseEventContractFacts {
  const envelope = componentSchema(doc, FACTORY_RESPONSE_EVENT_SCHEMA_NAME);
  const payload = componentSchema(
    doc,
    FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
  );
  const properties = isRecord(envelope?.properties)
    ? envelope.properties
    : undefined;
  const payloadProp = isRecord(properties?.payload)
    ? properties.payload
    : undefined;
  const payloadRef =
    typeof payloadProp?.$ref === "string" ? payloadProp.$ref : undefined;
  const payloadUnion = oneOfCount(payload);
  const envelopeDisc = readDiscriminator(envelope);
  const payloadDisc = readDiscriminator(payload);

  return {
    schemaName: FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
    schemaRef: FACTORY_RESPONSE_EVENT_SCHEMA_REF,
    hasKindProperty: isRecord(properties?.kind),
    hasPhaseProperty: isRecord(properties?.phase),
    payloadSchemaRef: payloadRef,
    envelopeHasDiscriminator:
      envelopeDisc.propertyName !== undefined ||
      Object.keys(envelopeDisc.mapping).length > 0,
    payloadHasOneOf: payloadUnion.isOneOf,
    payloadVariantCount: payloadUnion.count,
    payloadHasDiscriminator:
      payloadDisc.propertyName !== undefined ||
      Object.keys(payloadDisc.mapping).length > 0,
    usesSimpleTypeDiscriminatorLikeFactoryEvent: false,
  };
}

function rootEventSchemaName(
  xEventSchema: unknown,
): NativeEventSchemaDiscoverability["rootEventSchema"] {
  const name = schemaRefName(
    typeof xEventSchema === "string" ? xEventSchema : undefined,
  );
  if (name === FACTORY_EVENT_SCHEMA_NAME) return FACTORY_EVENT_SCHEMA_NAME;
  if (name === FACTORY_RESPONSE_EVENT_SCHEMA_NAME) {
    return FACTORY_RESPONSE_EVENT_SCHEMA_NAME;
  }
  return "unknown";
}

/**
 * Per-operation native-render discoverability. With fumadocs-openapi ignoring
 * `x-event-schema`, neither FactoryEvent mappings nor FactoryResponseEvent
 * kind/phase/oneOf shapes appear on the SSE operation page.
 */
export function observeNativeEventSchemaDiscoverability(
  cited: readonly CitedSseMediaType[],
): NativeEventSchemaDiscoverability[] {
  return cited.map((entry) => {
    const root = rootEventSchemaName(entry.xEventSchema);
    const notDiscoverable = "not-discoverable" as const;
    return {
      role: entry.role,
      roleLabel: entry.roleLabel,
      path: entry.path,
      operationId: entry.operationId,
      xEventSchemaRef:
        typeof entry.xEventSchema === "string" ? entry.xEventSchema : undefined,
      rootEventSchema: root,
      factoryEventTypeMappingsDiscoverable: notDiscoverable,
      factoryResponseEventKindPhaseOneOfDiscoverable: notDiscoverable,
      reason:
        `${NATIVE_FUMADOCS_SSE_RENDER.renderer} handles x-event-schema as ` +
        `${NATIVE_FUMADOCS_SSE_RENDER.xEventSchemaHandling}; native SSE ` +
        `response UI stays on the plain string wire schema and does not ` +
        `surface component payload schemas, discriminators, or kind/phase/oneOf.`,
    };
  });
}

/**
 * Full story-003 evidence: contract facts + native discoverability per role.
 */
export function observeEventSchemaDiscoverabilityEvidence(
  doc: OpenApiComponentsLike,
  inventory: readonly SseSpikeOperationItem[] = SSE_SPIKE_OPERATIONS,
): EventSchemaDiscoverabilityEvidence {
  const cited = citeSseMediaTypesFromOpenApi(doc, inventory);
  return {
    renderer: NATIVE_FUMADOCS_SSE_RENDER.renderer,
    xEventSchemaHandling: NATIVE_FUMADOCS_SSE_RENDER.xEventSchemaHandling,
    factoryEvent: observeFactoryEventContractFacts(doc),
    factoryResponseEvent: observeFactoryResponseEventContractFacts(doc),
    operations: observeNativeEventSchemaDiscoverability(cited),
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

/**
 * Count an exact `#/components/schemas/Name` ref, ignoring longer names that
 * share the same prefix (e.g. FactoryResponseEvent vs FactoryResponseEventKind).
 */
export function countExactSchemaRef(
  haystack: string,
  schemaRef: string,
): number {
  if (schemaRef.length === 0) return 0;
  let count = 0;
  let index = 0;
  while (true) {
    const found = haystack.indexOf(schemaRef, index);
    if (found === -1) return count;
    const after = haystack[found + schemaRef.length];
    // Continue the identifier → longer schema name; do not count.
    if (after !== undefined && /[A-Za-z0-9_]/.test(after)) {
      index = found + schemaRef.length;
      continue;
    }
    count += 1;
    index = found + schemaRef.length;
  }
}

/**
 * Probe rendered `/spikes/sse-openapi` HTML for discoverability signals and
 * role distinguishability markers from `SseSpikeSurfaceChrome`.
 */
export function probeEventSchemaDiscoverabilityHtml(
  html: string,
): DiscoverabilityHtmlProbe {
  const factoryEventSchemaRefCount = countExactSchemaRef(
    html,
    FACTORY_EVENT_SCHEMA_REF,
  );
  const factoryResponseEventSchemaRefCount = countExactSchemaRef(
    html,
    FACTORY_RESPONSE_EVENT_SCHEMA_REF,
  );
  const discriminatorTokenCount = countOccurrences(html, "discriminator");
  const runRequestMappingKeyCount = countOccurrences(html, "RUN_REQUEST");
  const factoryResponseEventKindTokenCount = countOccurrences(
    html,
    "FactoryResponseEventKind",
  );
  const factoryResponseEventPhaseTokenCount = countOccurrences(
    html,
    "FactoryResponseEventPhase",
  );
  // Content-block discriminator lives on a nested schema; if it appeared alone
  // it would still not prove envelope FactoryResponseEvent discovery.
  const contentBlockDiscriminatorNoise =
    countOccurrences(html, "FactoryResponseEventContentBlock") > 0;

  const roleMarkerCounts = {
    canonical: countOccurrences(html, 'data-sse-spike-role="canonical"'),
    ephemeral: countOccurrences(html, 'data-sse-spike-role="ephemeral"'),
    "compatibility-only": countOccurrences(
      html,
      'data-sse-spike-role="compatibility-only"',
    ),
  } satisfies Record<SseSpikeRole, number>;

  const rolesDistinguishable =
    roleMarkerCounts.canonical >= 1 &&
    roleMarkerCounts.ephemeral >= 1 &&
    roleMarkerCounts["compatibility-only"] >= 1;

  const factoryEventTypeMappingsDiscoverable: NativeDiscoverability =
    factoryEventSchemaRefCount > 0 &&
    discriminatorTokenCount > 0 &&
    runRequestMappingKeyCount > 0
      ? "discoverable"
      : "not-discoverable";

  const factoryResponseEventKindPhaseOneOfDiscoverable: NativeDiscoverability =
    factoryResponseEventSchemaRefCount > 0 &&
    factoryResponseEventKindTokenCount > 0 &&
    factoryResponseEventPhaseTokenCount > 0
      ? "discoverable"
      : "not-discoverable";

  return {
    factoryEventSchemaRefCount,
    factoryResponseEventSchemaRefCount,
    discriminatorTokenCount,
    runRequestMappingKeyCount,
    factoryResponseEventKindTokenCount,
    factoryResponseEventPhaseTokenCount,
    contentBlockDiscriminatorNoise,
    factoryEventTypeMappingsDiscoverable,
    factoryResponseEventKindPhaseOneOfDiscoverable,
    rolesDistinguishable,
    roleMarkerCounts,
  };
}
