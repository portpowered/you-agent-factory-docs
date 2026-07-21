/**
 * Collect nested OpenAPI component schemas cited from the already-rendered
 * FactoryEvent / FactoryResponseEvent catalog surfaces so the events page can
 * inline them as on-page SchemaDefinition anchors (InferenceOutcome-class).
 *
 * Pure document walk + W04 normalization — no IO / React. Does not invent
 * schemas: only published `components.schemas` entries reachable via `$ref`
 * from the catalogs already shown on the page. Excludes envelope / payload /
 * dimension schemas that those catalogs already render.
 */

import { anchorForIdentity } from "@/lib/references/reference-anchor-registry";
import {
  createSchemaAddress,
  type SchemaAddress,
  type SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import type { FactoryEventCatalog } from "./factory-event-catalog";
import { normalizeOpenApiComponentSchemaDefinition } from "./factory-event-catalog";
import type { FactoryResponseEventCatalog } from "./factory-response-event-catalog";
import type { EventsOpenApiComponentsSchemasLike } from "./openapi-document";
import { collectEventSchemaRefClosure } from "./schema-ref-closure";
import { EVENTS_OPENAPI_EXPORT } from "./stream-operations";

export type EventsLinkedComponentSchema = {
  /** Local OpenAPI component schema name. */
  schemaName: string;
  /** OpenAPI `#/components/schemas/...` ref. */
  schemaRef: string;
  address: SchemaAddress;
  /** Stable W04 schema-pointer anchor (no leading `#`). */
  schemaPointerAnchor: string;
  definition: SchemaDefinitionModel;
};

/**
 * Schema names already rendered by FactoryEvent / FactoryResponseEvent catalog
 * sections (envelope, envelope `$ref` components, dimensions, payloads).
 */
export function eventsAlreadyRenderedComponentSchemaNames(
  factoryEventCatalog: FactoryEventCatalog,
  factoryResponseEventCatalog: FactoryResponseEventCatalog,
): string[] {
  const names = new Set<string>();

  names.add(factoryEventCatalog.envelopeSchemaName);
  for (const component of factoryEventCatalog.envelopeComponents) {
    names.add(component.schemaName);
  }
  for (const name of Object.keys(
    factoryEventCatalog.payloadDefinitionsByName,
  )) {
    names.add(name);
  }

  names.add(factoryResponseEventCatalog.envelopeSchemaName);
  names.add(factoryResponseEventCatalog.kind.schemaName);
  names.add(factoryResponseEventCatalog.phase.schemaName);
  names.add(factoryResponseEventCatalog.provenance.schemaName);
  names.add(factoryResponseEventCatalog.payloadUnionSchemaName);
  for (const name of Object.keys(
    factoryResponseEventCatalog.payloadDefinitionsByName,
  )) {
    names.add(name);
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}

/**
 * Build normalized linked component schemas that events SchemaRefLinks / deep
 * links target but that catalog sections do not already render.
 *
 * Walks the transitive `$ref` closure from already-rendered catalog roots,
 * then drops those roots so only nested linked targets remain. Missing /
 * unpublished names never appear (fail-closed via schema-ref-closure).
 */
export function buildEventsLinkedComponentSchemas(
  doc: EventsOpenApiComponentsSchemasLike,
  factoryEventCatalog: FactoryEventCatalog,
  factoryResponseEventCatalog: FactoryResponseEventCatalog,
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): EventsLinkedComponentSchema[] {
  const alreadyRendered = new Set(
    eventsAlreadyRenderedComponentSchemaNames(
      factoryEventCatalog,
      factoryResponseEventCatalog,
    ),
  );
  const sourceSchemas = doc.components?.schemas ?? {};
  const rootRefs = [...alreadyRendered]
    .filter((name) => sourceSchemas[name] !== undefined)
    .map((name) => `#/components/schemas/${name}`);

  const closure = collectEventSchemaRefClosure(doc, rootRefs);
  const linkedNames = closure.schemaNames.filter(
    (name) => !alreadyRendered.has(name),
  );

  const linked: EventsLinkedComponentSchema[] = [];
  for (const schemaName of linkedNames) {
    const schema = sourceSchemas[schemaName];
    if (schema === undefined) {
      continue;
    }
    const definition = normalizeOpenApiComponentSchemaDefinition(
      schemaName,
      schema,
      publicArtifactId,
    );
    const address = createSchemaAddress(definition.address);
    linked.push({
      schemaName,
      schemaRef: `#/components/schemas/${schemaName}`,
      address,
      schemaPointerAnchor: anchorForIdentity("schema-pointer", address.pointer),
      definition,
    });
  }

  return linked;
}
