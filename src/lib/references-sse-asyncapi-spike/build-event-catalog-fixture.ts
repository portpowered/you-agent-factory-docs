/**
 * Story 008 — temporary custom schema-backed event-catalog fixture.
 *
 * Builds envelope + payload-variant catalog entries from packaged OpenAPI
 * `components.schemas` via selected SSE streams' `x-event-schema` roots.
 * Spike-only — not a production `/docs/references/events` merge.
 *
 * Pure helpers — no filesystem IO.
 */

import {
  FACTORY_EVENT_SCHEMA_NAME,
  FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
  FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
  type OpenApiComponentsLike,
} from "./event-schema-discoverability";
import {
  type SelectedSseStream,
  selectSseStreamsFromOpenApi,
} from "./select-sse-streams";
import type { SseSpikeRole } from "./sse-operations";

export const EVENT_CATALOG_FIXTURE_STATUS = "non-production-temporary" as const;

export const EVENT_CATALOG_ROUTE = "/spikes/sse-catalog" as const;

export type EventCatalogPayloadVariant = {
  /** Discriminator key (FactoryEvent.type) or oneOf index label. */
  key: string;
  /** Payload schema `$ref` or inline marker. */
  schemaRef: string;
  /** Local component name when `$ref` points at `#/components/schemas/...`. */
  schemaName: string;
};

export type EventCatalogEnvelopeEntry = {
  role: SseSpikeRole;
  roleLabel: string;
  path: string;
  operationId: string;
  preferred: boolean;
  envelopeSchemaName: string;
  envelopeSchemaRef: string;
  /**
   * How payload variants are listed for this envelope.
   * - `type-discriminator-mapping` — FactoryEvent.type mappings
   * - `kind-phase-oneof` — FactoryResponseEvent payload oneOf (no invented discriminator)
   * - `unknown` — unrecognized root
   */
  selectionMode: "type-discriminator-mapping" | "kind-phase-oneof" | "unknown";
  /** Envelope-level discriminator property when present (e.g. `type`). */
  discriminatorPropertyName: string | undefined;
  /** True only when OpenAPI already defines a discriminator — never invented. */
  inventedDiscriminator: false;
  payloadVariants: EventCatalogPayloadVariant[];
};

export type EventCatalogFixture = {
  status: typeof EVENT_CATALOG_FIXTURE_STATUS;
  /** Preferred streams only for the primary catalog (canonical + ephemeral). */
  preferredEntries: EventCatalogEnvelopeEntry[];
  /** Compatibility-only entry when present (labeled non-preferred). */
  compatibilityEntries: EventCatalogEnvelopeEntry[];
  /** All entries in selection order. */
  entries: EventCatalogEnvelopeEntry[];
  totals: {
    preferredEnvelopeCount: number;
    preferredPayloadVariantCount: number;
    compatibilityEnvelopeCount: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function localSchemaNameFromRef(ref: string): string {
  const prefix = "#/components/schemas/";
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : "";
}

function componentSchema(
  doc: OpenApiComponentsLike,
  name: string,
): Record<string, unknown> | undefined {
  const schema = doc.components?.schemas?.[name];
  return isRecord(schema) ? schema : undefined;
}

function readDiscriminatorMapping(
  schema: Record<string, unknown> | undefined,
): {
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
      if (typeof value === "string") {
        mapping[key] = value;
      }
    }
  }
  return { propertyName, mapping };
}

function factoryEventPayloadVariants(
  doc: OpenApiComponentsLike,
): EventCatalogPayloadVariant[] {
  const envelope = componentSchema(doc, FACTORY_EVENT_SCHEMA_NAME);
  const { mapping } = readDiscriminatorMapping(envelope);
  return Object.keys(mapping)
    .sort()
    .map((key) => {
      const schemaRef = mapping[key] ?? "";
      return {
        key,
        schemaRef,
        schemaName: localSchemaNameFromRef(schemaRef),
      };
    });
}

function factoryResponseEventPayloadVariants(
  doc: OpenApiComponentsLike,
): EventCatalogPayloadVariant[] {
  const payload = componentSchema(
    doc,
    FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
  );
  if (!payload || !Array.isArray(payload.oneOf)) {
    return [];
  }
  return payload.oneOf.map((item, index) => {
    const schemaRef =
      isRecord(item) && typeof item.$ref === "string" ? item.$ref : "";
    const schemaName = localSchemaNameFromRef(schemaRef);
    return {
      key: schemaName.length > 0 ? schemaName : `oneOf[${index}]`,
      schemaRef: schemaRef.length > 0 ? schemaRef : `inline:oneOf[${index}]`,
      schemaName,
    };
  });
}

function buildEntryForStream(
  doc: OpenApiComponentsLike,
  stream: SelectedSseStream,
): EventCatalogEnvelopeEntry {
  const envelopeSchemaName = stream.payloadRootSchemaName;
  const envelopeSchemaRef = stream.payloadRootRef;

  if (envelopeSchemaName === FACTORY_EVENT_SCHEMA_NAME) {
    const envelope = componentSchema(doc, FACTORY_EVENT_SCHEMA_NAME);
    const { propertyName } = readDiscriminatorMapping(envelope);
    return {
      role: stream.role,
      roleLabel: stream.roleLabel,
      path: stream.path,
      operationId: stream.operationId,
      preferred: stream.preferred,
      envelopeSchemaName,
      envelopeSchemaRef,
      selectionMode: "type-discriminator-mapping",
      discriminatorPropertyName: propertyName,
      inventedDiscriminator: false,
      payloadVariants: factoryEventPayloadVariants(doc),
    };
  }

  if (envelopeSchemaName === FACTORY_RESPONSE_EVENT_SCHEMA_NAME) {
    return {
      role: stream.role,
      roleLabel: stream.roleLabel,
      path: stream.path,
      operationId: stream.operationId,
      preferred: stream.preferred,
      envelopeSchemaName,
      envelopeSchemaRef,
      selectionMode: "kind-phase-oneof",
      discriminatorPropertyName: undefined,
      inventedDiscriminator: false,
      payloadVariants: factoryResponseEventPayloadVariants(doc),
    };
  }

  return {
    role: stream.role,
    roleLabel: stream.roleLabel,
    path: stream.path,
    operationId: stream.operationId,
    preferred: stream.preferred,
    envelopeSchemaName,
    envelopeSchemaRef,
    selectionMode: "unknown",
    discriminatorPropertyName: undefined,
    inventedDiscriminator: false,
    payloadVariants: [],
  };
}

/**
 * Build the temporary schema-backed event catalog from packaged OpenAPI.
 * Selection follows the same path/operation/status/media-type → x-event-schema
 * rules as the AsyncAPI projector (never hard-coded schema-name selection).
 */
export function buildEventCatalogFixture(
  doc: OpenApiComponentsLike,
): EventCatalogFixture {
  const streams = selectSseStreamsFromOpenApi(doc);
  const entries = streams.map((stream) => buildEntryForStream(doc, stream));
  const preferredEntries = entries.filter((entry) => entry.preferred);
  const compatibilityEntries = entries.filter((entry) => !entry.preferred);
  const preferredPayloadVariantCount = preferredEntries.reduce(
    (sum, entry) => sum + entry.payloadVariants.length,
    0,
  );

  return {
    status: EVENT_CATALOG_FIXTURE_STATUS,
    preferredEntries,
    compatibilityEntries,
    entries,
    totals: {
      preferredEnvelopeCount: preferredEntries.length,
      preferredPayloadVariantCount,
      compatibilityEnvelopeCount: compatibilityEntries.length,
    },
  };
}
