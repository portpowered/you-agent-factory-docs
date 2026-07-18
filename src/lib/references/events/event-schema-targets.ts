/**
 * W04 addressable schema targets for selected event-stream payload roots.
 *
 * Consumes W04 `SchemaAddress` / `ReferenceAnchorRegistry` helpers so later
 * catalog stories can deep-link envelope and payload schemas without inventing
 * a second event schema corpus. Does not normalize full family models here —
 * only maps `x-event-schema` roots to addressable display targets.
 *
 * Pure helpers — no filesystem IO.
 */

import {
  anchorForIdentity,
  createReferenceAnchorRegistry,
  type ReferenceAnchorRegistry,
  type RegisteredReferenceAnchor,
} from "@/lib/references/reference-anchor-registry";
import {
  createSchemaAddress,
  formatSchemaAddress,
  type SchemaAddress,
} from "@/lib/references/schema-model";
import type { SelectedEventStream } from "./select-event-streams";
import { EVENTS_OPENAPI_EXPORT } from "./stream-operations";

/** Default owning page id for events corpus anchors (W11 wires final routes). */
export const EVENTS_CORPUS_OWNING_PAGE_ID = "references/events" as const;

export type EventSchemaDisplayTarget = {
  operationId: string;
  role: SelectedEventStream["role"];
  payloadRootRef: string;
  payloadRootSchemaName: string;
  /** W04 schema address into packaged OpenAPI. */
  schemaAddress: SchemaAddress;
  /** Formatted `artifact#pointer` display string. */
  formattedAddress: string;
  /** Deterministic schema-pointer anchor fragment (no leading `#`). */
  schemaPointerAnchor: string;
  /** Deterministic event-kind anchor for the payload root schema name. */
  eventAnchor: string;
};

/**
 * Convert a `#/components/schemas/Name` (or `/components/schemas/Name`) ref
 * into a JSON Pointer suitable for W04 schema addresses.
 */
export function jsonPointerFromComponentsRef(ref: string): string {
  const trimmed = ref.trim();
  if (trimmed.startsWith("#")) {
    return trimmed.slice(1);
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/components/schemas/${trimmed}`;
}

/**
 * Build a W04 schema address for a selected stream's `x-event-schema` root.
 */
export function schemaAddressForSelectedEventStream(
  stream: SelectedEventStream,
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): SchemaAddress {
  return createSchemaAddress({
    publicArtifactId,
    pointer: jsonPointerFromComponentsRef(stream.payloadRootRef),
  });
}

/**
 * Build addressable display targets for every selected stream without creating
 * a parallel schema corpus.
 */
export function eventSchemaDisplayTargetsForStreams(
  streams: readonly SelectedEventStream[],
  publicArtifactId: string = EVENTS_OPENAPI_EXPORT,
): EventSchemaDisplayTarget[] {
  return streams.map((stream) => {
    const schemaAddress = schemaAddressForSelectedEventStream(
      stream,
      publicArtifactId,
    );
    const schemaPointerAnchor = anchorForIdentity(
      "schema-pointer",
      schemaAddress.pointer,
    );
    const eventIdentity =
      stream.payloadRootSchemaName.length > 0
        ? stream.payloadRootSchemaName
        : stream.operationId;
    return {
      operationId: stream.operationId,
      role: stream.role,
      payloadRootRef: stream.payloadRootRef,
      payloadRootSchemaName: stream.payloadRootSchemaName,
      schemaAddress,
      formattedAddress: formatSchemaAddress(schemaAddress),
      schemaPointerAnchor,
      eventAnchor: anchorForIdentity("event", eventIdentity),
    };
  });
}

/**
 * Register unique schema-pointer + event anchors for selected streams into a
 * W04 registry. Dedupes by schema pointer / event identity so canonical and
 * compatibility-only streams that share FactoryEvent do not collide.
 * Fails closed on per-page fragment collisions for distinct identities.
 */
export function registerEventSchemaTargets(
  streams: readonly SelectedEventStream[],
  options: {
    owningPageId?: string;
    publicArtifactId?: string;
    registry?: ReferenceAnchorRegistry;
  } = {},
): {
  registry: ReferenceAnchorRegistry;
  targets: EventSchemaDisplayTarget[];
  registered: RegisteredReferenceAnchor[];
} {
  const owningPageId = options.owningPageId ?? EVENTS_CORPUS_OWNING_PAGE_ID;
  const registry = options.registry ?? createReferenceAnchorRegistry();
  const targets = eventSchemaDisplayTargetsForStreams(
    streams,
    options.publicArtifactId ?? EVENTS_OPENAPI_EXPORT,
  );
  const registered: RegisteredReferenceAnchor[] = [];
  const seenSchemaPointers = new Set<string>();
  const seenEventIdentities = new Set<string>();

  for (const target of targets) {
    const pointer = target.schemaAddress.pointer;
    if (!seenSchemaPointers.has(pointer)) {
      seenSchemaPointers.add(pointer);
      const itemId = `schema:${pointer}`;
      registry.register({
        owningPageId,
        itemId,
        kind: "schema-pointer",
        identity: pointer,
      });
      const entry = registry.get(owningPageId, itemId);
      if (entry) {
        registered.push(entry);
      }
    }

    const eventIdentity =
      target.payloadRootSchemaName.length > 0
        ? target.payloadRootSchemaName
        : target.operationId;
    if (!seenEventIdentities.has(eventIdentity)) {
      seenEventIdentities.add(eventIdentity);
      const itemId = `event-root:${eventIdentity}`;
      registry.register({
        owningPageId,
        itemId,
        kind: "event",
        identity: eventIdentity,
      });
      const entry = registry.get(owningPageId, itemId);
      if (entry) {
        registered.push(entry);
      }
    }
  }

  return { registry, targets, registered };
}
