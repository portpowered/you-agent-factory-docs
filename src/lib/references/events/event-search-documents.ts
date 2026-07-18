/**
 * Event corpus search documents + collision-checked catalog anchors (W09).
 *
 * Emits Orama-ready `ReferenceSearchDocumentShape` records for FactoryEvent
 * discriminator types and FactoryResponseEvent payload variants. Final page /
 * nav / Orama wiring remains W11/W15/W16 — this module only owns the event
 * search-document shapes and stable anchors.
 *
 * Pure helpers — no filesystem, Orama, or UI.
 */

import {
  createReferenceAnchorRegistry,
  type ReferenceAnchorRegistry,
  type RegisteredReferenceAnchor,
} from "@/lib/references/reference-anchor-registry";
import {
  createReferenceItem,
  type ReferenceItem,
} from "@/lib/references/reference-item";
import {
  createReferenceSearchDocumentBuilder,
  REFERENCE_FAMILY_PAGE_PATHS,
  type ReferenceSearchDocumentShape,
} from "@/lib/references/reference-search-projection";
import { EVENTS_CORPUS_OWNING_PAGE_ID } from "./event-schema-targets";
import type { FactoryEventCatalog } from "./factory-event-catalog";
import type { FactoryResponseEventCatalog } from "./factory-response-event-catalog";
import { EVENTS_OPENAPI_EXPORT } from "./stream-operations";

export const EVENT_SEARCH_DOCUMENT_TAGS = {
  factoryEventType: "factory-event-type",
  factoryEventPayload: "factory-event-payload",
  factoryResponseEventPayload: "factory-response-event-payload",
  ephemeral: "ephemeral",
} as const;

export type EventCatalogNavEntry = {
  id: string;
  label: string;
  anchor: string;
  /** Search / filter identity text. */
  identityText: string;
  aliases: string[];
  description?: string;
  kind: "factory-event-type" | "factory-response-event-payload";
};

export type BuildEventSearchDocumentsOptions = {
  /** Owning page path for search URLs (defaults to `/docs/references/events`). */
  pagePath?: string;
  /** Owning page id for registry collision checks. */
  owningPageId?: string;
  publicArtifactId?: string;
  registry?: ReferenceAnchorRegistry;
};

export type EventCorpusSearchDocumentsResult = {
  items: ReferenceItem[];
  documents: ReferenceSearchDocumentShape[];
  navEntries: EventCatalogNavEntry[];
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
};

/**
 * Build ReferenceItems for every FactoryEvent discriminator mapping.
 */
export function factoryEventTypeReferenceItems(
  catalog: FactoryEventCatalog,
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): ReferenceItem[] {
  return catalog.mappings.map((mapping) =>
    createReferenceItem({
      id: `events:factory-event:${mapping.eventType}`,
      family: "events",
      title: mapping.eventType,
      description: `FactoryEvent.type ${mapping.eventType} → ${mapping.payloadSchemaName}`,
      lifecycle: { state: "active" },
      source: {
        publicArtifactId,
        pointer: `/components/schemas/${catalog.envelopeSchemaName}/discriminator/mapping/${mapping.eventType}`,
      },
      aliases: [mapping.payloadSchemaName, mapping.payloadSchemaRef],
      anchor: mapping.eventTypeAnchor,
    }),
  );
}

/**
 * Build ReferenceItems for every FactoryResponseEvent payload oneOf variant.
 */
export function factoryResponseEventPayloadReferenceItems(
  catalog: FactoryResponseEventCatalog,
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): ReferenceItem[] {
  return catalog.payloadVariants.map((variant) =>
    createReferenceItem({
      id: `events:factory-response-event-payload:${variant.payloadSchemaName}`,
      family: "events",
      title: variant.payloadSchemaName,
      description: `FactoryResponseEvent payload oneOf member ${variant.payloadSchemaName} (ephemeral)`,
      lifecycle: { state: "active" },
      source: {
        publicArtifactId,
        pointer: variant.payloadAddress.pointer,
      },
      aliases: [variant.payloadSchemaRef, "FactoryResponseEvent"],
      anchor: variant.payloadVariantAnchor,
    }),
  );
}

/**
 * Register FactoryEvent type + FactoryResponseEvent payload anchors into a
 * W04 registry. Fails closed on per-page fragment collisions for distinct
 * identities. Does not mutate catalog models.
 */
export function registerEventCatalogAnchors(
  factoryEventCatalog: FactoryEventCatalog,
  factoryResponseEventCatalog: FactoryResponseEventCatalog,
  options: {
    owningPageId?: string;
    registry?: ReferenceAnchorRegistry;
  } = {},
): {
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
} {
  const owningPageId = options.owningPageId ?? EVENTS_CORPUS_OWNING_PAGE_ID;
  const registry = options.registry ?? createReferenceAnchorRegistry();
  const registered: RegisteredReferenceAnchor[] = [];

  for (const mapping of factoryEventCatalog.mappings) {
    const itemId = `event-type:${mapping.eventType}`;
    const anchor = registry.register({
      owningPageId,
      itemId,
      kind: "event",
      identity: mapping.eventType,
    });
    if (anchor !== mapping.eventTypeAnchor) {
      throw new Error(
        `FactoryEvent type anchor drift for ${mapping.eventType}: registry produced "${anchor}" but catalog has "${mapping.eventTypeAnchor}".`,
      );
    }
    const entry = registry.get(owningPageId, itemId);
    if (entry) {
      registered.push(entry);
    }
  }

  for (const variant of factoryResponseEventCatalog.payloadVariants) {
    const itemId = `response-payload:${variant.payloadSchemaName}`;
    const anchor = registry.register({
      owningPageId,
      itemId,
      kind: "event",
      identity: variant.payloadSchemaName,
    });
    if (anchor !== variant.payloadVariantAnchor) {
      throw new Error(
        `FactoryResponseEvent payload anchor drift for ${variant.payloadSchemaName}: registry produced "${anchor}" but catalog has "${variant.payloadVariantAnchor}".`,
      );
    }
    const entry = registry.get(owningPageId, itemId);
    if (entry) {
      registered.push(entry);
    }
  }

  return { registry, registered };
}

function toNavEntry(
  item: ReferenceItem,
  kind: EventCatalogNavEntry["kind"],
): EventCatalogNavEntry {
  const entry: EventCatalogNavEntry = {
    id: item.id,
    label: item.title,
    anchor: item.anchor,
    identityText: item.title,
    aliases: [...item.aliases],
    kind,
  };
  if (item.description !== undefined) {
    entry.description = item.description;
  }
  return entry;
}

/**
 * Build search documents + nav entries for the events corpus. Registers
 * anchors for collision checks. Does not wire Orama or page inventories.
 */
export function buildEventCorpusSearchDocuments(
  factoryEventCatalog: FactoryEventCatalog,
  factoryResponseEventCatalog: FactoryResponseEventCatalog,
  options: BuildEventSearchDocumentsOptions = {},
): EventCorpusSearchDocumentsResult {
  const pagePath = options.pagePath ?? REFERENCE_FAMILY_PAGE_PATHS.events;
  const publicArtifactId = options.publicArtifactId ?? EVENTS_OPENAPI_EXPORT;

  const { registry, registered } = registerEventCatalogAnchors(
    factoryEventCatalog,
    factoryResponseEventCatalog,
    {
      owningPageId: options.owningPageId ?? EVENTS_CORPUS_OWNING_PAGE_ID,
      ...(options.registry !== undefined ? { registry: options.registry } : {}),
    },
  );

  const factoryItems = factoryEventTypeReferenceItems(
    factoryEventCatalog,
    publicArtifactId,
  );
  const responseItems = factoryResponseEventPayloadReferenceItems(
    factoryResponseEventCatalog,
    publicArtifactId,
  );
  const items = [...factoryItems, ...responseItems];

  const builder = createReferenceSearchDocumentBuilder({
    pagePathByFamily: { events: pagePath },
  });

  const documents: ReferenceSearchDocumentShape[] = [
    ...builder.buildMany(factoryItems, {
      pagePath,
      tags: [
        EVENT_SEARCH_DOCUMENT_TAGS.factoryEventType,
        EVENT_SEARCH_DOCUMENT_TAGS.factoryEventPayload,
      ],
      extraBodyText: "FactoryEvent discriminator payload",
    }),
    ...builder.buildMany(responseItems, {
      pagePath,
      tags: [
        EVENT_SEARCH_DOCUMENT_TAGS.factoryResponseEventPayload,
        EVENT_SEARCH_DOCUMENT_TAGS.ephemeral,
      ],
      extraBodyText: "FactoryResponseEvent ephemeral payload oneOf",
    }),
  ];

  const navEntries: EventCatalogNavEntry[] = [
    ...factoryItems.map((item) => toNavEntry(item, "factory-event-type")),
    ...responseItems.map((item) =>
      toNavEntry(item, "factory-response-event-payload"),
    ),
  ];

  return { items, documents, navEntries, registry, registered };
}

/**
 * Collect unique anchors from search documents (sorted). Useful for drift
 * assertions against catalog models.
 */
export function eventSearchDocumentAnchors(
  documents: readonly ReferenceSearchDocumentShape[],
): string[] {
  return [...new Set(documents.map((document) => document.anchor))].sort();
}
