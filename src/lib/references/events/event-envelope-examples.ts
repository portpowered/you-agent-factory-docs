/**
 * Corpus-true JSON examples for the events catalog page.
 *
 * Covers full event envelopes and per-variant payload bodies. Prefer
 * OpenAPI-authored `example` (or first `examples` entry) when present.
 * Otherwise construct a minimal body from packaged component schemas: only
 * published property names, real enum/const values, and required nested refs.
 * Never invent SSE wire fields or unknown envelope/payload keys. Ellipsis
 * placeholder bodies are not sufficient for published catalog examples.
 *
 * Pure transforms — callers supply an already-loaded OpenAPI document.
 */

import type { FactoryEventCatalog } from "./factory-event-catalog";
import {
  FACTORY_EVENT_SCHEMA_NAME,
  FACTORY_EVENT_TYPE_SCHEMA_NAME,
} from "./factory-event-catalog";
import type { FactoryResponseEventCatalog } from "./factory-response-event-catalog";
import { FACTORY_RESPONSE_EVENT_SCHEMA_NAME } from "./factory-response-event-catalog";
import type {
  EventsOpenApiComponentsSchemasLike,
  EventsOpenApiDocument,
} from "./openapi-document";
import { localSchemaNameFromRef } from "./schema-ref-closure";

type FactoryEventCatalogForExample = Omit<
  FactoryEventCatalog,
  "envelopeExample"
>;
type FactoryResponseEventCatalogForExample = Omit<
  FactoryResponseEventCatalog,
  "envelopeExample"
>;
type EventsOpenApiSchemasDoc =
  | EventsOpenApiDocument
  | EventsOpenApiComponentsSchemasLike;

export const EVENT_ENVELOPE_EXAMPLE_ORIGIN = {
  openApiAuthored: "openapi-authored",
  corpusConstructed: "corpus-constructed",
} as const;

export type EventEnvelopeExampleOrigin =
  (typeof EVENT_ENVELOPE_EXAMPLE_ORIGIN)[keyof typeof EVENT_ENVELOPE_EXAMPLE_ORIGIN];

export type EventEnvelopeJsonExample = {
  id: string;
  envelopeSchemaName: string;
  title: string;
  description: string;
  language: "json";
  /** Pretty-printed JSON for CodePanel / clipboard. */
  code: string;
  /** Parsed example body for conformance assertions. */
  value: Record<string, unknown>;
  origin: EventEnvelopeExampleOrigin;
  originLabel: string;
  /** Discriminator / kind identity used when constructing the body. */
  eventIdentity?: string;
  /** Payload schema name used for the nested payload body. */
  payloadSchemaName?: string;
};

/**
 * Corpus-true payload-only JSON example for one discriminator / oneOf variant.
 * Not a complete envelope — field tables remain the schema source of truth.
 */
export type EventPayloadJsonExample = {
  id: string;
  payloadSchemaName: string;
  title: string;
  description: string;
  language: "json";
  /** Pretty-printed JSON for CodePanel / clipboard. */
  code: string;
  /** Parsed example body for conformance assertions. */
  value: Record<string, unknown>;
  origin: EventEnvelopeExampleOrigin;
  originLabel: string;
  /** Discriminator event type when this payload is mapped from FactoryEvent. */
  eventIdentity?: string;
};

const OPENAPI_AUTHORED_ORIGIN_LABEL = "OpenAPI authored example";
const CORPUS_CONSTRUCTED_ORIGIN_LABEL = "Corpus-constructed example";

/** Fixed ISO-8601 timestamp for generated date-time fields (corpus-neutral). */
const EXAMPLE_DATE_TIME = "1970-01-01T00:00:00.000Z";

const MAX_REF_DEPTH = 8;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAuthoredExample(schema: unknown): unknown | undefined {
  if (!isPlainObject(schema)) {
    return undefined;
  }
  if ("example" in schema && schema.example !== undefined) {
    return schema.example;
  }
  // OpenAPI Media Type / Schema Object `examples` map — first entry wins.
  if (isPlainObject(schema.examples)) {
    for (const entry of Object.values(schema.examples)) {
      if (entry === undefined) {
        continue;
      }
      if (isPlainObject(entry) && "value" in entry) {
        return entry.value;
      }
      return entry;
    }
  }
  return undefined;
}

function schemasMap(
  doc: EventsOpenApiSchemasDoc,
): Record<string, unknown> | undefined {
  const schemas = doc.components?.schemas;
  if (schemas === undefined || !isPlainObject(schemas)) {
    return undefined;
  }
  return schemas as Record<string, unknown>;
}

function resolveSchemaNode(
  schema: unknown,
  schemas: Record<string, unknown> | undefined,
  depth: number,
): Record<string, unknown> | undefined {
  if (!isPlainObject(schema)) {
    return undefined;
  }
  if (typeof schema.$ref === "string") {
    const name = localSchemaNameFromRef(schema.$ref);
    if (name === undefined || schemas === undefined || depth >= MAX_REF_DEPTH) {
      return undefined;
    }
    return resolveSchemaNode(schemas[name], schemas, depth + 1);
  }

  // OpenAPI allOf wrappers: merge/$ref first member then overlay siblings.
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    let merged: Record<string, unknown> = {};
    for (const member of schema.allOf) {
      const resolved = resolveSchemaNode(member, schemas, depth + 1);
      if (resolved !== undefined) {
        merged = { ...merged, ...resolved };
      }
    }
    const { allOf: _allOf, ...rest } = schema;
    return { ...merged, ...rest };
  }

  return schema;
}

function firstStringEnum(schema: Record<string, unknown>): string | undefined {
  if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
    return undefined;
  }
  const first = schema.enum[0];
  return typeof first === "string" ? first : undefined;
}

function stringPlaceholder(
  path: string,
  schema: Record<string, unknown>,
): string {
  if (schema.format === "date-time") {
    return EXAMPLE_DATE_TIME;
  }
  if (typeof schema.pattern === "string") {
    // FactoryName-style identifiers: prefer a pattern-safe lowercase slug.
    if (schema.pattern.includes("[a-z0-9]")) {
      return "example-factory";
    }
  }
  if (typeof schema.minLength === "number" && schema.minLength > 0) {
    return `example-${path}`.slice(0, Math.max(schema.minLength, 8));
  }
  return `example-${path}`;
}

function valueForResolvedSchema(
  schema: Record<string, unknown>,
  schemas: Record<string, unknown> | undefined,
  path: string,
  depth: number,
): unknown {
  if (schema.const !== undefined) {
    return schema.const;
  }
  if (schema.default !== undefined) {
    return schema.default;
  }

  const enumValue = firstStringEnum(schema);
  if (enumValue !== undefined) {
    return enumValue;
  }

  const type = schema.type;
  const typeToken = Array.isArray(type) ? type[0] : type;

  if (typeToken === "object" || schema.properties !== undefined) {
    return objectExampleFromSchema(schema, schemas, depth);
  }
  if (typeToken === "array") {
    return [];
  }
  if (typeToken === "integer" || typeToken === "number") {
    // Response-event sequence 0 is reserved for synthetic markers — use 1.
    if (path === "sequence" || path.endsWith(".sequence")) {
      return 1;
    }
    if (typeof schema.minimum === "number") {
      return schema.minimum;
    }
    return 0;
  }
  if (typeToken === "boolean") {
    return false;
  }
  if (typeToken === "null") {
    return null;
  }
  // string or untyped leaf
  return stringPlaceholder(path, schema);
}

function objectExampleFromSchema(
  schema: Record<string, unknown>,
  schemas: Record<string, unknown> | undefined,
  depth: number,
): Record<string, unknown> {
  const properties = isPlainObject(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((name): name is string => typeof name === "string")
    : [];

  const example: Record<string, unknown> = {};
  for (const name of required) {
    const propertySchema = properties[name];
    const resolved = resolveSchemaNode(propertySchema, schemas, depth);
    if (resolved === undefined) {
      continue;
    }
    example[name] = valueForResolvedSchema(resolved, schemas, name, depth + 1);
  }
  return example;
}

/**
 * Construct a minimal object example from an OpenAPI component schema.
 * Required properties only; nested `$ref`s resolved from the same components map.
 * For `oneOf` / `anyOf`, uses the first constructible member (corpus-true —
 * never invents keys outside a published alternative).
 */
export function constructMinimalOpenApiObjectExample(
  schema: unknown,
  schemas: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const resolved = resolveSchemaNode(schema, schemas, 0);
  if (resolved === undefined) {
    return undefined;
  }
  if (resolved.type === "object" || resolved.properties !== undefined) {
    return objectExampleFromSchema(resolved, schemas, 0);
  }

  for (const key of ["oneOf", "anyOf"] as const) {
    const members = resolved[key];
    if (!Array.isArray(members)) {
      continue;
    }
    for (const member of members) {
      const constructed = constructMinimalOpenApiObjectExample(member, schemas);
      if (constructed !== undefined) {
        return constructed;
      }
    }
  }

  return undefined;
}

/**
 * Lightweight conformance: required keys present, no unpublished keys when
 * `additionalProperties: false`, enums/consts honored on visited leaves.
 */
export function envelopeExampleConformsToOpenApiSchema(
  example: unknown,
  schema: unknown,
  schemas: Record<string, unknown> | undefined,
): { ok: true } | { ok: false; reason: string } {
  if (!isPlainObject(example)) {
    return { ok: false, reason: "example must be a plain object" };
  }

  const resolved = resolveSchemaNode(schema, schemas, 0);
  if (resolved === undefined) {
    return { ok: false, reason: "schema could not be resolved" };
  }

  const properties = isPlainObject(resolved.properties)
    ? resolved.properties
    : {};
  const required = Array.isArray(resolved.required)
    ? resolved.required.filter(
        (name): name is string => typeof name === "string",
      )
    : [];

  if (resolved.additionalProperties === false) {
    for (const key of Object.keys(example)) {
      if (!(key in properties)) {
        return {
          ok: false,
          reason: `closed object forbids unpublished property "${key}"`,
        };
      }
    }
  }

  for (const name of required) {
    if (!(name in example)) {
      return { ok: false, reason: `missing required property "${name}"` };
    }
  }

  for (const [key, value] of Object.entries(example)) {
    const propertySchema = properties[key];
    const field = resolveSchemaNode(propertySchema, schemas, 0);
    if (field === undefined) {
      continue;
    }
    if (field.const !== undefined && !Object.is(field.const, value)) {
      return {
        ok: false,
        reason: `property "${key}" contradicts published const`,
      };
    }
    if (Array.isArray(field.enum) && field.enum.length > 0) {
      const inEnum = field.enum.some((entry) => Object.is(entry, value));
      if (!inEnum) {
        return {
          ok: false,
          reason: `property "${key}" is not a published enum value`,
        };
      }
    }
    if (
      isPlainObject(value) &&
      (field.properties !== undefined || field.type === "object")
    ) {
      const nested = envelopeExampleConformsToOpenApiSchema(
        value,
        field,
        schemas,
      );
      if (!nested.ok) {
        return {
          ok: false,
          reason: `property "${key}": ${nested.reason}`,
        };
      }
    }
  }

  return { ok: true };
}

function formatExampleCode(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildFactoryEventEnvelopeValue(
  doc: EventsOpenApiSchemasDoc,
  catalog: FactoryEventCatalogForExample,
): {
  value: Record<string, unknown>;
  eventIdentity: string;
  payloadSchemaName: string;
} {
  const schemas = schemasMap(doc);
  const mapping = catalog.mappings[0];
  if (mapping === undefined) {
    throw new Error(
      `${FACTORY_EVENT_SCHEMA_NAME} catalog has no discriminator mappings for envelope examples.`,
    );
  }

  const typeSchema = schemas?.[FACTORY_EVENT_TYPE_SCHEMA_NAME];
  const typeResolved = resolveSchemaNode(typeSchema, schemas, 0);
  const typeEnum =
    typeResolved !== undefined ? firstStringEnum(typeResolved) : undefined;
  const eventIdentity =
    typeEnum !== undefined &&
    catalog.mappings.some((entry) => entry.eventType === typeEnum)
      ? typeEnum
      : mapping.eventType;

  const selected =
    catalog.mappings.find((entry) => entry.eventType === eventIdentity) ??
    mapping;

  const envelopeSchema = schemas?.[FACTORY_EVENT_SCHEMA_NAME];
  const constructed = constructMinimalOpenApiObjectExample(
    envelopeSchema,
    schemas,
  );
  if (constructed === undefined) {
    throw new Error(
      `Could not construct a minimal ${FACTORY_EVENT_SCHEMA_NAME} envelope example.`,
    );
  }

  // Force discriminator + mapped payload so the body is a complete, typed frame.
  constructed.type = selected.eventType;
  const payloadSchema = schemas?.[selected.payloadSchemaName];
  const payload =
    constructMinimalOpenApiObjectExample(payloadSchema, schemas) ?? {};
  constructed.payload = payload;

  return {
    value: constructed,
    eventIdentity: selected.eventType,
    payloadSchemaName: selected.payloadSchemaName,
  };
}

function buildFactoryResponseEventEnvelopeValue(
  doc: EventsOpenApiSchemasDoc,
  catalog: FactoryResponseEventCatalogForExample,
): {
  value: Record<string, unknown>;
  eventIdentity: string;
  payloadSchemaName: string;
} {
  const schemas = schemasMap(doc);
  // Prefer a readable session-started frame when those enums exist; still
  // corpus-true (no invented values). kind × phase × payload is not Cartesian.
  const kind =
    catalog.kind.values.find((value) => value === "SESSION") ??
    catalog.kind.values[0];
  const phase =
    catalog.phase.values.find((value) => value === "STARTED") ??
    catalog.phase.values[0];
  const payloadVariant =
    catalog.payloadVariants.find((variant) =>
      variant.payloadSchemaName.includes("Session"),
    ) ?? catalog.payloadVariants[0];
  if (
    kind === undefined ||
    phase === undefined ||
    payloadVariant === undefined
  ) {
    throw new Error(
      `${FACTORY_RESPONSE_EVENT_SCHEMA_NAME} catalog is missing kind/phase/payload for envelope examples.`,
    );
  }

  const envelopeSchema = schemas?.[FACTORY_RESPONSE_EVENT_SCHEMA_NAME];
  const constructed = constructMinimalOpenApiObjectExample(
    envelopeSchema,
    schemas,
  );
  if (constructed === undefined) {
    throw new Error(
      `Could not construct a minimal ${FACTORY_RESPONSE_EVENT_SCHEMA_NAME} envelope example.`,
    );
  }

  constructed.kind = kind;
  constructed.phase = phase;
  const payloadSchema = schemas?.[payloadVariant.payloadSchemaName];
  constructed.payload =
    constructMinimalOpenApiObjectExample(payloadSchema, schemas) ?? {};

  return {
    value: constructed,
    eventIdentity: kind,
    payloadSchemaName: payloadVariant.payloadSchemaName,
  };
}

/**
 * Build one copyable FactoryEvent full-envelope JSON example from packaged OpenAPI.
 */
export function buildFactoryEventEnvelopeJsonExample(
  doc: EventsOpenApiSchemasDoc,
  catalog: FactoryEventCatalogForExample,
): EventEnvelopeJsonExample {
  const schemas = schemasMap(doc);
  const envelopeSchema = schemas?.[FACTORY_EVENT_SCHEMA_NAME];
  const authored = readAuthoredExample(envelopeSchema);

  if (isPlainObject(authored)) {
    return {
      id: "factory-event-envelope-json",
      envelopeSchemaName: FACTORY_EVENT_SCHEMA_NAME,
      title: "FactoryEvent envelope example",
      description: `Authored OpenAPI example for the complete ${FACTORY_EVENT_SCHEMA_NAME} envelope.`,
      language: "json",
      code: formatExampleCode(authored),
      value: authored,
      origin: EVENT_ENVELOPE_EXAMPLE_ORIGIN.openApiAuthored,
      originLabel: OPENAPI_AUTHORED_ORIGIN_LABEL,
    };
  }

  const { value, eventIdentity, payloadSchemaName } =
    buildFactoryEventEnvelopeValue(doc, catalog);

  return {
    id: "factory-event-envelope-json",
    envelopeSchemaName: FACTORY_EVENT_SCHEMA_NAME,
    title: "FactoryEvent envelope example",
    description: `Complete ${FACTORY_EVENT_SCHEMA_NAME} envelope with type ${eventIdentity} and a ${payloadSchemaName} payload body. Field names and enums come from packaged OpenAPI; nested values are minimal corpus-constructed placeholders when OpenAPI omits an authored example.`,
    language: "json",
    code: formatExampleCode(value),
    value,
    origin: EVENT_ENVELOPE_EXAMPLE_ORIGIN.corpusConstructed,
    originLabel: CORPUS_CONSTRUCTED_ORIGIN_LABEL,
    eventIdentity,
    payloadSchemaName,
  };
}

/**
 * Build one copyable FactoryResponseEvent full-envelope JSON example.
 */
export function buildFactoryResponseEventEnvelopeJsonExample(
  doc: EventsOpenApiSchemasDoc,
  catalog: FactoryResponseEventCatalogForExample,
): EventEnvelopeJsonExample {
  const schemas = schemasMap(doc);
  const envelopeSchema = schemas?.[FACTORY_RESPONSE_EVENT_SCHEMA_NAME];
  const authored = readAuthoredExample(envelopeSchema);

  if (isPlainObject(authored)) {
    return {
      id: "factory-response-event-envelope-json",
      envelopeSchemaName: FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
      title: "FactoryResponseEvent envelope example",
      description: `Authored OpenAPI example for the complete ${FACTORY_RESPONSE_EVENT_SCHEMA_NAME} envelope.`,
      language: "json",
      code: formatExampleCode(authored),
      value: authored,
      origin: EVENT_ENVELOPE_EXAMPLE_ORIGIN.openApiAuthored,
      originLabel: OPENAPI_AUTHORED_ORIGIN_LABEL,
    };
  }

  const { value, eventIdentity, payloadSchemaName } =
    buildFactoryResponseEventEnvelopeValue(doc, catalog);

  return {
    id: "factory-response-event-envelope-json",
    envelopeSchemaName: FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
    title: "FactoryResponseEvent envelope example",
    description: `Complete ${FACTORY_RESPONSE_EVENT_SCHEMA_NAME} envelope with kind ${eventIdentity} and a ${payloadSchemaName} payload body. Field names and enums come from packaged OpenAPI; nested values are minimal corpus-constructed placeholders when OpenAPI omits an authored example.`,
    language: "json",
    code: formatExampleCode(value),
    value,
    origin: EVENT_ENVELOPE_EXAMPLE_ORIGIN.corpusConstructed,
    originLabel: CORPUS_CONSTRUCTED_ORIGIN_LABEL,
    eventIdentity,
    payloadSchemaName,
  };
}

function slugForExampleId(schemaName: string): string {
  return schemaName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Build one copyable payload-only JSON example from a packaged OpenAPI
 * component schema. Prefer authored `example` / `examples`; otherwise
 * construct a minimal required-field body (no invented keys).
 */
export function buildPayloadSchemaJsonExample(
  doc: EventsOpenApiSchemasDoc,
  options: {
    payloadSchemaName: string;
    /** Discriminator event type when mapping from FactoryEvent. */
    eventIdentity?: string;
    idPrefix?: string;
  },
): EventPayloadJsonExample {
  const schemas = schemasMap(doc);
  const payloadSchemaName = options.payloadSchemaName;
  const payloadSchema = schemas?.[payloadSchemaName];
  if (payloadSchema === undefined) {
    throw new Error(
      `Missing components.schemas.${payloadSchemaName} for payload JSON example.`,
    );
  }

  const slug = slugForExampleId(payloadSchemaName);
  const idPrefix = options.idPrefix ?? "event-payload";
  const id = `${idPrefix}-json-${slug}`;
  const authored = readAuthoredExample(payloadSchema);

  if (isPlainObject(authored)) {
    return {
      id,
      payloadSchemaName,
      title: `${payloadSchemaName} example`,
      description: `Authored OpenAPI example for the ${payloadSchemaName} payload body.`,
      language: "json",
      code: formatExampleCode(authored),
      value: authored,
      origin: EVENT_ENVELOPE_EXAMPLE_ORIGIN.openApiAuthored,
      originLabel: OPENAPI_AUTHORED_ORIGIN_LABEL,
      ...(options.eventIdentity !== undefined
        ? { eventIdentity: options.eventIdentity }
        : {}),
    };
  }

  const constructed = constructMinimalOpenApiObjectExample(
    payloadSchema,
    schemas,
  );
  if (constructed === undefined) {
    throw new Error(
      `Could not construct a minimal ${payloadSchemaName} payload example.`,
    );
  }

  const identityNote =
    options.eventIdentity !== undefined
      ? ` Mapped from FactoryEvent type ${options.eventIdentity}.`
      : "";

  return {
    id,
    payloadSchemaName,
    title: `${payloadSchemaName} example`,
    description: `Payload-only ${payloadSchemaName} body.${identityNote} Field names and enums come from packaged OpenAPI; values are minimal corpus-constructed placeholders when OpenAPI omits an authored example.`,
    language: "json",
    code: formatExampleCode(constructed),
    value: constructed,
    origin: EVENT_ENVELOPE_EXAMPLE_ORIGIN.corpusConstructed,
    originLabel: CORPUS_CONSTRUCTED_ORIGIN_LABEL,
    ...(options.eventIdentity !== undefined
      ? { eventIdentity: options.eventIdentity }
      : {}),
  };
}
