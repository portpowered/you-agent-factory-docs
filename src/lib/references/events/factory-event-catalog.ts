/**
 * FactoryEvent envelope + discriminator → payload catalog from packaged OpenAPI.
 *
 * OpenAPI remains event truth. Normalizes component schemas into W04
 * `SchemaDefinitionModel` graphs via the shared W03/W04 JSON Schema normalizer
 * so W07 schema UI adapters can render envelope fields and payload variants
 * without inventing a second event schema corpus.
 *
 * Pure transforms — callers supply an already-loaded OpenAPI document.
 */

import { normalizeJsonSchemaArtifact } from "@/lib/references/normalize-json-schema-artifact";
import { anchorForIdentity } from "@/lib/references/reference-anchor-registry";
import {
  createSchemaAddress,
  type SchemaAddress,
  type SchemaDefinitionModel,
  type SchemaDiscriminatorModel,
} from "@/lib/references/schema-model";
import type { EventsOpenApiComponentsSchemasLike } from "./openapi-document";
import { localSchemaNameFromRef } from "./schema-ref-closure";
import { EVENTS_OPENAPI_EXPORT } from "./stream-operations";

export const FACTORY_EVENT_SCHEMA_NAME = "FactoryEvent" as const;
/** Discriminator enum referenced by `FactoryEvent.type`. */
export const FACTORY_EVENT_TYPE_SCHEMA_NAME = "FactoryEventType" as const;
/** Shared context object referenced by `FactoryEvent.context`. */
export const FACTORY_EVENT_CONTEXT_SCHEMA_NAME = "FactoryEventContext" as const;

export type FactoryEventCatalogErrorCode =
  | "missing-factory-event-schema"
  | "missing-discriminator"
  | "invalid-discriminator-mapping"
  | "missing-payload-schema"
  | "missing-envelope-component";

export class FactoryEventCatalogError extends Error {
  readonly code: FactoryEventCatalogErrorCode;
  readonly details: string[];

  constructor(
    code: FactoryEventCatalogErrorCode,
    message: string,
    details: string[] = [],
  ) {
    super(message);
    this.name = "FactoryEventCatalogError";
    this.code = code;
    this.details = details;
  }
}

export type FactoryEventDiscriminatorMapping = {
  /** Discriminator value on `FactoryEvent.type` (for example `RUN_REQUEST`). */
  eventType: string;
  /** Local component schema name for the mapped payload. */
  payloadSchemaName: string;
  /** OpenAPI `#/components/schemas/...` ref for the mapped payload. */
  payloadSchemaRef: string;
  /** W04 address for the payload schema. */
  payloadAddress: SchemaAddress;
  /** Stable schema-pointer anchor for the payload (no leading `#`). */
  payloadSchemaPointerAnchor: string;
  /** Stable event-kind anchor for the discriminator value (no leading `#`). */
  eventTypeAnchor: string;
};

/**
 * Envelope field `$ref` component rendered as its own catalog definition
 * (for example `FactoryEventType`, `FactoryEventContext`). Payload oneOf
 * members stay in the discriminator/payload catalog, not here.
 */
export type FactoryEventEnvelopeComponent = {
  /** Local OpenAPI component schema name. */
  schemaName: string;
  /** Envelope property that references this component (for example `type`). */
  envelopeFieldName: string;
  address: SchemaAddress;
  definition: SchemaDefinitionModel;
};

export type FactoryEventCatalog = {
  envelopeSchemaName: typeof FACTORY_EVENT_SCHEMA_NAME;
  envelopeAddress: SchemaAddress;
  /** Full envelope definition including discriminator composition. */
  envelopeDefinition: SchemaDefinitionModel;
  /**
   * Envelope definition without discriminator/composition — used when the
   * dedicated discriminator map owns mapping chrome so payload-only schemas
   * are not confused with the shared envelope.
   */
  envelopeFieldsDefinition: SchemaDefinitionModel;
  /**
   * Direct envelope `$ref` components (type / context) normalized from
   * packaged OpenAPI — rendered on the events page, not only as `$ref` labels.
   */
  envelopeComponents: FactoryEventEnvelopeComponent[];
  discriminatorPropertyName: string;
  discriminator: SchemaDiscriminatorModel;
  /** Sorted by event type for stable catalog order. */
  mappings: FactoryEventDiscriminatorMapping[];
  /** Payload definitions keyed by local schema name. */
  payloadDefinitionsByName: Record<string, SchemaDefinitionModel>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalize one OpenAPI `components.schemas` entry into a W04 definition with
 * the correct `/components/schemas/<name>` address pointer.
 */
export function normalizeOpenApiComponentSchemaDefinition(
  schemaName: string,
  schema: unknown,
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): SchemaDefinitionModel {
  if (!isPlainObject(schema)) {
    throw new FactoryEventCatalogError(
      "missing-payload-schema",
      `OpenAPI component schema ${schemaName} must be an object.`,
      [schemaName],
    );
  }

  return normalizeJsonSchemaArtifact(schema, {
    publicArtifactId,
    rootPointer: `/components/schemas/${schemaName}`,
  }).root;
}

function envelopeFieldsOnly(
  envelope: SchemaDefinitionModel,
): SchemaDefinitionModel {
  const { composition: _composition, ...rest } = envelope;
  return rest;
}

/**
 * Collect direct envelope field `$ref` targets (excluding `payload`, which the
 * discriminator map / payload catalog owns) and normalize each from OpenAPI.
 */
function buildEnvelopeComponents(
  envelopeFields: SchemaDefinitionModel,
  schemas: Record<string, unknown> | undefined,
  publicArtifactId: string,
): FactoryEventEnvelopeComponent[] {
  const properties = envelopeFields.properties ?? {};
  const components: FactoryEventEnvelopeComponent[] = [];
  const details: string[] = [];

  for (const [fieldName, field] of Object.entries(properties)) {
    if (fieldName === "payload") {
      continue;
    }
    const pointer = field.refTarget?.pointer;
    if (pointer === undefined) {
      continue;
    }
    const schemaName =
      pointer
        .split("/")
        .filter((segment) => segment.length > 0)
        .at(-1) ?? "";
    if (schemaName.length === 0) {
      details.push(
        `${fieldName}: could not derive component schema name from ${pointer}`,
      );
      continue;
    }
    const schema = schemas?.[schemaName];
    if (schema === undefined) {
      details.push(`${fieldName}: missing components.schemas.${schemaName}`);
      continue;
    }
    const definition = normalizeOpenApiComponentSchemaDefinition(
      schemaName,
      schema,
      publicArtifactId,
    );
    components.push({
      schemaName,
      envelopeFieldName: fieldName,
      address: createSchemaAddress(definition.address),
      definition,
    });
  }

  if (details.length > 0) {
    throw new FactoryEventCatalogError(
      "missing-envelope-component",
      `${FACTORY_EVENT_SCHEMA_NAME} envelope component refs are incomplete against packaged OpenAPI.`,
      details,
    );
  }

  // Prefer a stable type → context order when both are present; otherwise
  // keep discovery order from the envelope property map.
  const rank = (name: string): number => {
    if (name === FACTORY_EVENT_TYPE_SCHEMA_NAME) {
      return 0;
    }
    if (name === FACTORY_EVENT_CONTEXT_SCHEMA_NAME) {
      return 1;
    }
    return 2;
  };
  components.sort((a, b) => {
    const byRank = rank(a.schemaName) - rank(b.schemaName);
    if (byRank !== 0) {
      return byRank;
    }
    return a.schemaName.localeCompare(b.schemaName);
  });

  return components;
}

/**
 * Build the FactoryEvent envelope + discriminator → payload catalog from a
 * loaded OpenAPI document. Fails closed when the envelope, discriminator, or a
 * mapped payload schema is missing.
 */
export function buildFactoryEventCatalog(
  doc: EventsOpenApiComponentsSchemasLike,
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): FactoryEventCatalog {
  const schemas = doc.components?.schemas;
  const factoryEventSchema = schemas?.[FACTORY_EVENT_SCHEMA_NAME];
  if (factoryEventSchema === undefined) {
    throw new FactoryEventCatalogError(
      "missing-factory-event-schema",
      `Packaged OpenAPI is missing components.schemas.${FACTORY_EVENT_SCHEMA_NAME}.`,
      [FACTORY_EVENT_SCHEMA_NAME],
    );
  }

  const envelopeDefinition = normalizeOpenApiComponentSchemaDefinition(
    FACTORY_EVENT_SCHEMA_NAME,
    factoryEventSchema,
    publicArtifactId,
  );

  const discriminator = envelopeDefinition.composition?.discriminator;
  if (
    discriminator === undefined ||
    typeof discriminator.propertyName !== "string" ||
    discriminator.propertyName.trim().length === 0
  ) {
    throw new FactoryEventCatalogError(
      "missing-discriminator",
      `${FACTORY_EVENT_SCHEMA_NAME} is missing a usable discriminator.propertyName mapping.`,
      [FACTORY_EVENT_SCHEMA_NAME],
    );
  }

  const mappingEntries = Object.entries(discriminator.mapping ?? {});
  if (mappingEntries.length === 0) {
    throw new FactoryEventCatalogError(
      "missing-discriminator",
      `${FACTORY_EVENT_SCHEMA_NAME} discriminator has no mapping entries.`,
      [FACTORY_EVENT_SCHEMA_NAME],
    );
  }

  mappingEntries.sort(([a], [b]) => a.localeCompare(b));

  const mappings: FactoryEventDiscriminatorMapping[] = [];
  const payloadDefinitionsByName: Record<string, SchemaDefinitionModel> = {};
  const details: string[] = [];

  for (const [eventType, payloadAddress] of mappingEntries) {
    const payloadSchemaName =
      payloadAddress.pointer
        .split("/")
        .filter((segment) => segment.length > 0)
        .at(-1) ?? "";
    if (payloadSchemaName.length === 0) {
      details.push(
        `${eventType}: could not derive payload schema name from ${payloadAddress.pointer}`,
      );
      continue;
    }

    const payloadSchema = schemas?.[payloadSchemaName];
    if (payloadSchema === undefined) {
      details.push(
        `${eventType}: missing components.schemas.${payloadSchemaName}`,
      );
      continue;
    }

    if (payloadDefinitionsByName[payloadSchemaName] === undefined) {
      payloadDefinitionsByName[payloadSchemaName] =
        normalizeOpenApiComponentSchemaDefinition(
          payloadSchemaName,
          payloadSchema,
          publicArtifactId,
        );
    }

    const payloadSchemaRef = `#/components/schemas/${payloadSchemaName}`;
    mappings.push({
      eventType,
      payloadSchemaName,
      payloadSchemaRef,
      payloadAddress: createSchemaAddress(payloadAddress),
      payloadSchemaPointerAnchor: anchorForIdentity(
        "schema-pointer",
        payloadAddress.pointer,
      ),
      eventTypeAnchor: anchorForIdentity("event", eventType),
    });
  }

  if (details.length > 0) {
    throw new FactoryEventCatalogError(
      "invalid-discriminator-mapping",
      `${FACTORY_EVENT_SCHEMA_NAME} discriminator mapping is incomplete against packaged OpenAPI.`,
      details,
    );
  }

  const envelopeFieldsDefinition = envelopeFieldsOnly(envelopeDefinition);
  const envelopeComponents = buildEnvelopeComponents(
    envelopeFieldsDefinition,
    schemas as Record<string, unknown> | undefined,
    publicArtifactId,
  );

  // Fail closed when the required type/context components are absent from the
  // envelope graph (readers must see them as full definitions, not $ref-only).
  const componentNames = new Set(
    envelopeComponents.map((entry) => entry.schemaName),
  );
  for (const requiredName of [
    FACTORY_EVENT_TYPE_SCHEMA_NAME,
    FACTORY_EVENT_CONTEXT_SCHEMA_NAME,
  ]) {
    if (!componentNames.has(requiredName)) {
      throw new FactoryEventCatalogError(
        "missing-envelope-component",
        `${FACTORY_EVENT_SCHEMA_NAME} is missing required envelope component ${requiredName}.`,
        [requiredName],
      );
    }
  }

  return {
    envelopeSchemaName: FACTORY_EVENT_SCHEMA_NAME,
    envelopeAddress: createSchemaAddress(envelopeDefinition.address),
    envelopeDefinition,
    envelopeFieldsDefinition,
    envelopeComponents,
    discriminatorPropertyName: discriminator.propertyName,
    discriminator: {
      propertyName: discriminator.propertyName,
      mapping: Object.fromEntries(
        mappings.map((entry) => [entry.eventType, entry.payloadAddress]),
      ),
    },
    mappings,
    payloadDefinitionsByName,
  };
}

/**
 * Event types present in the catalog (sorted). Useful for drift assertions
 * against live OpenAPI inventory without freezing a product quota.
 */
export function factoryEventCatalogEventTypes(
  catalog: FactoryEventCatalog,
): string[] {
  return catalog.mappings.map((entry) => entry.eventType);
}

/**
 * Payload schema names present in the catalog (unique, sorted).
 */
export function factoryEventCatalogPayloadSchemaNames(
  catalog: FactoryEventCatalog,
): string[] {
  return [
    ...new Set(catalog.mappings.map((entry) => entry.payloadSchemaName)),
  ].sort();
}

/**
 * Resolve a payload definition by discriminator event type.
 */
export function factoryEventPayloadDefinitionForType(
  catalog: FactoryEventCatalog,
  eventType: string,
): SchemaDefinitionModel | undefined {
  const mapping = catalog.mappings.find(
    (entry) => entry.eventType === eventType,
  );
  if (mapping === undefined) {
    return undefined;
  }
  return catalog.payloadDefinitionsByName[mapping.payloadSchemaName];
}

/**
 * Derive local schema name from a `#/components/schemas/...` ref or pointer.
 * Re-export convenience for catalog consumers.
 */
export function payloadSchemaNameFromRef(ref: string): string | undefined {
  return localSchemaNameFromRef(ref);
}
