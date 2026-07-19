/**
 * FactoryResponseEvent envelope + kind/phase/provenance/payload catalog.
 *
 * OpenAPI remains event truth. Unlike FactoryEvent (type discriminator),
 * response events select payload variants with kind + phase + structural
 * decoding — not every Cartesian combination is valid. Normalizes component
 * schemas into W04 models so W07 adapters can render fields without a second
 * event schema corpus.
 *
 * Pure transforms — callers supply an already-loaded OpenAPI document.
 */

import { normalizeJsonSchemaArtifact } from "@/lib/references/normalize-json-schema-artifact";
import { anchorForIdentity } from "@/lib/references/reference-anchor-registry";
import {
  createSchemaAddress,
  type SchemaAddress,
  type SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import {
  buildFactoryResponseEventEnvelopeJsonExample,
  buildPayloadSchemaJsonExample,
  type EventEnvelopeJsonExample,
  type EventPayloadJsonExample,
} from "./event-envelope-examples";
import type { EventsOpenApiComponentsSchemasLike } from "./openapi-document";
import { localSchemaNameFromRef } from "./schema-ref-closure";
import { EVENTS_OPENAPI_EXPORT } from "./stream-operations";

export const FACTORY_RESPONSE_EVENT_SCHEMA_NAME =
  "FactoryResponseEvent" as const;
export const FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME =
  "FactoryResponseEventKind" as const;
export const FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME =
  "FactoryResponseEventPhase" as const;
export const FACTORY_RESPONSE_EVENT_PROVENANCE_SCHEMA_NAME =
  "FactoryResponseEventProvenance" as const;
export const FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME =
  "FactoryResponseEventPayload" as const;

export type FactoryResponseEventCatalogErrorCode =
  | "missing-factory-response-event-schema"
  | "missing-dimension-schema"
  | "missing-payload-union"
  | "invalid-payload-oneof"
  | "missing-payload-schema";

export class FactoryResponseEventCatalogError extends Error {
  readonly code: FactoryResponseEventCatalogErrorCode;
  readonly details: string[];

  constructor(
    code: FactoryResponseEventCatalogErrorCode,
    message: string,
    details: string[] = [],
  ) {
    super(message);
    this.name = "FactoryResponseEventCatalogError";
    this.code = code;
    this.details = details;
  }
}

export type FactoryResponseEventDimensionValues = {
  schemaName: string;
  address: SchemaAddress;
  definition: SchemaDefinitionModel;
  /** Sorted enum values when the dimension publishes an enum. */
  values: string[];
};

export type FactoryResponseEventPayloadVariant = {
  /** Local component schema name for this oneOf member. */
  payloadSchemaName: string;
  /** OpenAPI `#/components/schemas/...` ref. */
  payloadSchemaRef: string;
  /** W04 address for the payload schema. */
  payloadAddress: SchemaAddress;
  /** Stable schema-pointer anchor (no leading `#`). */
  payloadSchemaPointerAnchor: string;
  /** Stable event-kind anchor for deep-linking the payload variant. */
  payloadVariantAnchor: string;
  /**
   * Corpus-true payload-only JSON example (authored OpenAPI `example` when
   * present; otherwise minimal constructed body from packaged schemas).
   */
  payloadExample: EventPayloadJsonExample;
};

export type FactoryResponseEventCatalog = {
  envelopeSchemaName: typeof FACTORY_RESPONSE_EVENT_SCHEMA_NAME;
  envelopeAddress: SchemaAddress;
  /** Full envelope definition (refs preserved as field targets). */
  envelopeDefinition: SchemaDefinitionModel;
  /**
   * Envelope fields for SchemaDefinition display. Ephemeral observation only —
   * never presented as canonical FactoryEvent replay state.
   */
  envelopeFieldsDefinition: SchemaDefinitionModel;
  kind: FactoryResponseEventDimensionValues;
  phase: FactoryResponseEventDimensionValues;
  provenance: {
    schemaName: string;
    address: SchemaAddress;
    definition: SchemaDefinitionModel;
  };
  payloadUnionSchemaName: typeof FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME;
  payloadUnionAddress: SchemaAddress;
  payloadUnionDefinition: SchemaDefinitionModel;
  /** Sorted by payload schema name for stable catalog order. */
  payloadVariants: FactoryResponseEventPayloadVariant[];
  /** Payload definitions keyed by local schema name. */
  payloadDefinitionsByName: Record<string, SchemaDefinitionModel>;
  /**
   * Explicit contract note: kind × phase × payload is not a free Cartesian
   * product — allowed combinations are validated before publication.
   */
  cartesianCombinationsValid: false;
  /** Ephemeral observation stream — not canonical FactoryEvent replay. */
  ephemeral: true;
  /**
   * Corpus-true full envelope JSON example (authored OpenAPI `example` when
   * present; otherwise minimal constructed body from packaged schemas).
   */
  envelopeExample: EventEnvelopeJsonExample;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeComponent(
  schemaName: string,
  schema: unknown,
  publicArtifactId: string,
): SchemaDefinitionModel {
  if (!isPlainObject(schema)) {
    throw new FactoryResponseEventCatalogError(
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

function requireComponentSchema(
  schemas: Record<string, unknown> | undefined,
  schemaName: string,
  errorCode: FactoryResponseEventCatalogErrorCode,
): unknown {
  const schema = schemas?.[schemaName];
  if (schema === undefined) {
    throw new FactoryResponseEventCatalogError(
      errorCode,
      `Packaged OpenAPI is missing components.schemas.${schemaName}.`,
      [schemaName],
    );
  }
  return schema;
}

function stringEnumValues(definition: SchemaDefinitionModel): string[] {
  const values = (definition.enum ?? [])
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return [...new Set(values)].sort();
}

function payloadSchemaNameFromOneOfMember(
  member: SchemaAddress,
): string | undefined {
  return (
    member.pointer
      .split("/")
      .filter((segment) => segment.length > 0)
      .at(-1) ?? undefined
  );
}

/**
 * Build the FactoryResponseEvent envelope + dimension / payload catalog from a
 * loaded OpenAPI document. Fails closed when the envelope, dimension schemas,
 * or a oneOf payload member is missing.
 */
export function buildFactoryResponseEventCatalog(
  doc: EventsOpenApiComponentsSchemasLike,
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): FactoryResponseEventCatalog {
  const schemas = doc.components?.schemas as
    | Record<string, unknown>
    | undefined;

  const envelopeSchema = requireComponentSchema(
    schemas,
    FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
    "missing-factory-response-event-schema",
  );
  const envelopeDefinition = normalizeComponent(
    FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
    envelopeSchema,
    publicArtifactId,
  );

  const kindSchema = requireComponentSchema(
    schemas,
    FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME,
    "missing-dimension-schema",
  );
  const kindDefinition = normalizeComponent(
    FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME,
    kindSchema,
    publicArtifactId,
  );
  const kindValues = stringEnumValues(kindDefinition);
  if (kindValues.length === 0) {
    throw new FactoryResponseEventCatalogError(
      "missing-dimension-schema",
      `${FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME} publishes no enum values.`,
      [FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME],
    );
  }

  const phaseSchema = requireComponentSchema(
    schemas,
    FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME,
    "missing-dimension-schema",
  );
  const phaseDefinition = normalizeComponent(
    FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME,
    phaseSchema,
    publicArtifactId,
  );
  const phaseValues = stringEnumValues(phaseDefinition);
  if (phaseValues.length === 0) {
    throw new FactoryResponseEventCatalogError(
      "missing-dimension-schema",
      `${FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME} publishes no enum values.`,
      [FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME],
    );
  }

  const provenanceSchema = requireComponentSchema(
    schemas,
    FACTORY_RESPONSE_EVENT_PROVENANCE_SCHEMA_NAME,
    "missing-dimension-schema",
  );
  const provenanceDefinition = normalizeComponent(
    FACTORY_RESPONSE_EVENT_PROVENANCE_SCHEMA_NAME,
    provenanceSchema,
    publicArtifactId,
  );

  const payloadUnionSchema = requireComponentSchema(
    schemas,
    FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
    "missing-payload-union",
  );
  const payloadUnionDefinition = normalizeComponent(
    FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
    payloadUnionSchema,
    publicArtifactId,
  );

  const oneOfMembers = payloadUnionDefinition.composition?.oneOf ?? [];
  if (oneOfMembers.length === 0) {
    throw new FactoryResponseEventCatalogError(
      "missing-payload-union",
      `${FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME} has no oneOf payload members.`,
      [FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME],
    );
  }

  const payloadVariants: FactoryResponseEventPayloadVariant[] = [];
  const payloadDefinitionsByName: Record<string, SchemaDefinitionModel> = {};
  const details: string[] = [];

  for (const member of oneOfMembers) {
    const payloadSchemaName = payloadSchemaNameFromOneOfMember(member);
    if (payloadSchemaName === undefined || payloadSchemaName.length === 0) {
      details.push(
        `could not derive payload schema name from ${member.pointer}`,
      );
      continue;
    }

    const payloadSchema = schemas?.[payloadSchemaName];
    if (payloadSchema === undefined) {
      details.push(`missing components.schemas.${payloadSchemaName}`);
      continue;
    }

    if (payloadDefinitionsByName[payloadSchemaName] === undefined) {
      payloadDefinitionsByName[payloadSchemaName] = normalizeComponent(
        payloadSchemaName,
        payloadSchema,
        publicArtifactId,
      );
    }

    const payloadSchemaRef = `#/components/schemas/${payloadSchemaName}`;
    payloadVariants.push({
      payloadSchemaName,
      payloadSchemaRef,
      payloadAddress: createSchemaAddress(member),
      payloadSchemaPointerAnchor: anchorForIdentity(
        "schema-pointer",
        member.pointer,
      ),
      payloadVariantAnchor: anchorForIdentity("event", payloadSchemaName),
      payloadExample: buildPayloadSchemaJsonExample(doc, {
        payloadSchemaName,
        idPrefix: "factory-response-event-payload",
      }),
    });
  }

  if (details.length > 0) {
    throw new FactoryResponseEventCatalogError(
      "invalid-payload-oneof",
      `${FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME} oneOf inventory is incomplete against packaged OpenAPI.`,
      details,
    );
  }

  payloadVariants.sort((a, b) =>
    a.payloadSchemaName.localeCompare(b.payloadSchemaName),
  );

  const catalogWithoutExample = {
    envelopeSchemaName: FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
    envelopeAddress: createSchemaAddress(envelopeDefinition.address),
    envelopeDefinition,
    envelopeFieldsDefinition: envelopeDefinition,
    kind: {
      schemaName: FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME,
      address: createSchemaAddress(kindDefinition.address),
      definition: kindDefinition,
      values: kindValues,
    },
    phase: {
      schemaName: FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME,
      address: createSchemaAddress(phaseDefinition.address),
      definition: phaseDefinition,
      values: phaseValues,
    },
    provenance: {
      schemaName: FACTORY_RESPONSE_EVENT_PROVENANCE_SCHEMA_NAME,
      address: createSchemaAddress(provenanceDefinition.address),
      definition: provenanceDefinition,
    },
    payloadUnionSchemaName: FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
    payloadUnionAddress: createSchemaAddress(payloadUnionDefinition.address),
    payloadUnionDefinition,
    payloadVariants,
    payloadDefinitionsByName,
    cartesianCombinationsValid: false as const,
    ephemeral: true as const,
  } satisfies Omit<FactoryResponseEventCatalog, "envelopeExample">;

  return {
    ...catalogWithoutExample,
    envelopeExample: buildFactoryResponseEventEnvelopeJsonExample(
      doc,
      catalogWithoutExample,
    ),
  };
}

/**
 * Kind enum values present in the catalog (sorted).
 */
export function factoryResponseEventCatalogKindValues(
  catalog: FactoryResponseEventCatalog,
): string[] {
  return [...catalog.kind.values];
}

/**
 * Phase enum values present in the catalog (sorted).
 */
export function factoryResponseEventCatalogPhaseValues(
  catalog: FactoryResponseEventCatalog,
): string[] {
  return [...catalog.phase.values];
}

/**
 * Payload schema names present in the catalog (sorted).
 */
export function factoryResponseEventCatalogPayloadSchemaNames(
  catalog: FactoryResponseEventCatalog,
): string[] {
  return catalog.payloadVariants.map((entry) => entry.payloadSchemaName);
}

/**
 * Resolve a payload definition by oneOf schema name.
 */
export function factoryResponseEventPayloadDefinitionForName(
  catalog: FactoryResponseEventCatalog,
  payloadSchemaName: string,
): SchemaDefinitionModel | undefined {
  return catalog.payloadDefinitionsByName[payloadSchemaName];
}

/**
 * Derive local schema name from a `#/components/schemas/...` ref or pointer.
 */
export function responsePayloadSchemaNameFromRef(
  ref: string,
): string | undefined {
  return localSchemaNameFromRef(ref);
}
