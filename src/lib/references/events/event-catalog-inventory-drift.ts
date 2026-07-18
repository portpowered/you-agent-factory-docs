/**
 * Fail-closed inventory drift helpers for the W09 events corpus (story 009).
 *
 * Compare cataloged / search-document identities against identities taken
 * directly from packaged OpenAPI (`discriminator.mapping`, payload `oneOf`,
 * kind/phase enums). Counts are derived dynamically — never hard-coded product
 * quotas. Pure transforms; callers supply an already-loaded OpenAPI document
 * and built catalogs.
 */

import {
  compareFamilyInventoryIdentities,
  type FamilyInventoryDriftResult,
  type FamilyInventoryIdentityKind,
} from "@/lib/references/family-inventory-contract-drift";
import type { EventCorpusSearchDocumentsResult } from "./event-search-documents";
import {
  FACTORY_EVENT_SCHEMA_NAME,
  type FactoryEventCatalog,
  factoryEventCatalogEventTypes,
} from "./factory-event-catalog";
import {
  FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME,
  FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
  FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME,
  type FactoryResponseEventCatalog,
  factoryResponseEventCatalogKindValues,
  factoryResponseEventCatalogPayloadSchemaNames,
  factoryResponseEventCatalogPhaseValues,
} from "./factory-response-event-catalog";
import type { EventsOpenApiComponentsSchemasLike } from "./openapi-document";
import { localSchemaNameFromRef } from "./schema-ref-closure";

export type EventCatalogInventoryIdentityKind = Extract<
  FamilyInventoryIdentityKind,
  | "event type"
  | "event type→payload mapping"
  | "response-event payload"
  | "response-event kind"
  | "response-event phase"
>;

export type EventCatalogInventoryDriftErrorCode = "inventory-drift";

export class EventCatalogInventoryDriftError extends Error {
  readonly code: EventCatalogInventoryDriftErrorCode = "inventory-drift";
  readonly identityKind: EventCatalogInventoryIdentityKind;
  readonly missingFromInventory: string[];
  readonly extraInInventory: string[];

  constructor(
    identityKind: EventCatalogInventoryIdentityKind,
    message: string,
    missingFromInventory: string[] = [],
    extraInInventory: string[] = [],
  ) {
    super(message);
    this.name = "EventCatalogInventoryDriftError";
    this.identityKind = identityKind;
    this.missingFromInventory = missingFromInventory;
    this.extraInInventory = extraInInventory;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Stable identity for a FactoryEvent.type → payload schema pair.
 */
export function factoryEventMappingIdentity(
  eventType: string,
  payloadSchemaName: string,
): string {
  return `${eventType}→${payloadSchemaName}`;
}

function stringEnumValuesFromSchema(schema: unknown): string[] {
  if (!isPlainObject(schema) || !Array.isArray(schema.enum)) {
    return [];
  }
  return [
    ...new Set(
      schema.enum
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  ].sort();
}

/**
 * Extract live FactoryEvent.type values from packaged OpenAPI
 * `discriminator.mapping` keys (sorted).
 */
export function extractFactoryEventTypesFromOpenApi(
  doc: EventsOpenApiComponentsSchemasLike,
): string[] {
  return extractFactoryEventDiscriminatorMappingsFromOpenApi(doc).map(
    (entry) => entry.eventType,
  );
}

/**
 * Extract live FactoryEvent discriminator mappings directly from packaged
 * OpenAPI (not via the catalog builder). Sorted by event type.
 */
export function extractFactoryEventDiscriminatorMappingsFromOpenApi(
  doc: EventsOpenApiComponentsSchemasLike,
): Array<{ eventType: string; payloadSchemaName: string }> {
  const schema = doc.components?.schemas?.[FACTORY_EVENT_SCHEMA_NAME];
  if (!isPlainObject(schema)) {
    return [];
  }
  const discriminator = schema.discriminator;
  if (!isPlainObject(discriminator) || !isPlainObject(discriminator.mapping)) {
    return [];
  }

  const entries: Array<{ eventType: string; payloadSchemaName: string }> = [];
  for (const [eventType, refValue] of Object.entries(discriminator.mapping)) {
    if (typeof refValue !== "string") {
      continue;
    }
    const payloadSchemaName = localSchemaNameFromRef(refValue);
    if (payloadSchemaName === undefined) {
      continue;
    }
    entries.push({ eventType, payloadSchemaName });
  }
  entries.sort((a, b) => a.eventType.localeCompare(b.eventType));
  return entries;
}

/**
 * Mapping identities (`TYPE→PayloadSchema`) from live OpenAPI.
 */
export function extractFactoryEventMappingIdentitiesFromOpenApi(
  doc: EventsOpenApiComponentsSchemasLike,
): string[] {
  return extractFactoryEventDiscriminatorMappingsFromOpenApi(doc).map((entry) =>
    factoryEventMappingIdentity(entry.eventType, entry.payloadSchemaName),
  );
}

/**
 * Extract live FactoryResponseEvent payload oneOf schema names from packaged
 * OpenAPI (sorted).
 */
export function extractFactoryResponseEventPayloadNamesFromOpenApi(
  doc: EventsOpenApiComponentsSchemasLike,
): string[] {
  const schema =
    doc.components?.schemas?.[FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME];
  if (!isPlainObject(schema) || !Array.isArray(schema.oneOf)) {
    return [];
  }

  const names: string[] = [];
  for (const member of schema.oneOf) {
    if (!isPlainObject(member) || typeof member.$ref !== "string") {
      continue;
    }
    const name = localSchemaNameFromRef(member.$ref);
    if (name !== undefined) {
      names.push(name);
    }
  }
  return [...new Set(names)].sort();
}

/**
 * Extract live FactoryResponseEventKind enum values from packaged OpenAPI.
 */
export function extractFactoryResponseEventKindValuesFromOpenApi(
  doc: EventsOpenApiComponentsSchemasLike,
): string[] {
  return stringEnumValuesFromSchema(
    doc.components?.schemas?.[FACTORY_RESPONSE_EVENT_KIND_SCHEMA_NAME],
  );
}

/**
 * Extract live FactoryResponseEventPhase enum values from packaged OpenAPI.
 */
export function extractFactoryResponseEventPhaseValuesFromOpenApi(
  doc: EventsOpenApiComponentsSchemasLike,
): string[] {
  return stringEnumValuesFromSchema(
    doc.components?.schemas?.[FACTORY_RESPONSE_EVENT_PHASE_SCHEMA_NAME],
  );
}

/**
 * Cataloged FactoryEvent.type identities (sorted).
 */
export function factoryEventCatalogTypeIdentities(
  catalog: FactoryEventCatalog,
): string[] {
  return factoryEventCatalogEventTypes(catalog);
}

/**
 * Cataloged FactoryEvent mapping identities (`TYPE→PayloadSchema`).
 */
export function factoryEventCatalogMappingIdentities(
  catalog: FactoryEventCatalog,
): string[] {
  return catalog.mappings.map((entry) =>
    factoryEventMappingIdentity(entry.eventType, entry.payloadSchemaName),
  );
}

/**
 * Cataloged FactoryResponseEvent payload identities (sorted).
 */
export function factoryResponseEventCatalogPayloadIdentities(
  catalog: FactoryResponseEventCatalog,
): string[] {
  return factoryResponseEventCatalogPayloadSchemaNames(catalog);
}

/**
 * Cataloged FactoryResponseEventKind identities (sorted).
 */
export function factoryResponseEventCatalogKindIdentities(
  catalog: FactoryResponseEventCatalog,
): string[] {
  return factoryResponseEventCatalogKindValues(catalog);
}

/**
 * Cataloged FactoryResponseEventPhase identities (sorted).
 */
export function factoryResponseEventCatalogPhaseIdentities(
  catalog: FactoryResponseEventCatalog,
): string[] {
  return factoryResponseEventCatalogPhaseValues(catalog);
}

/**
 * Search-document FactoryEvent.type titles (sorted).
 */
export function eventSearchDocumentFactoryEventTypeIdentities(
  search: EventCorpusSearchDocumentsResult,
): string[] {
  return search.navEntries
    .filter((entry) => entry.kind === "factory-event-type")
    .map((entry) => entry.label)
    .sort();
}

/**
 * Search-document FactoryResponseEvent payload titles (sorted).
 */
export function eventSearchDocumentResponsePayloadIdentities(
  search: EventCorpusSearchDocumentsResult,
): string[] {
  return search.navEntries
    .filter((entry) => entry.kind === "factory-response-event-payload")
    .map((entry) => entry.label)
    .sort();
}

/**
 * Compare live OpenAPI identities to rendered catalog / search identities.
 */
export function compareEventCatalogInventoryIdentities(
  liveIdentities: readonly string[],
  renderedIdentities: readonly string[],
  identityKind: EventCatalogInventoryIdentityKind,
): FamilyInventoryDriftResult {
  return compareFamilyInventoryIdentities(
    liveIdentities,
    renderedIdentities,
    identityKind,
  );
}

/**
 * Fail closed when rendered identities drift from live OpenAPI inventory.
 * Names every missing / unexpected mapping or payload variant in the message.
 */
export function assertEventCatalogInventoryMatchesLive(
  liveIdentities: readonly string[],
  renderedIdentities: readonly string[],
  identityKind: EventCatalogInventoryIdentityKind,
): FamilyInventoryDriftResult {
  const result = compareEventCatalogInventoryIdentities(
    liveIdentities,
    renderedIdentities,
    identityKind,
  );
  if (result.ok) {
    return result;
  }
  throw new EventCatalogInventoryDriftError(
    identityKind,
    result.message,
    result.missingFromInventory,
    result.extraInInventory,
  );
}
