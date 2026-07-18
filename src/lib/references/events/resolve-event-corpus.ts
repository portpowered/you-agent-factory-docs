/**
 * Orchestrate W09 event-corpus resolution from packaged OpenAPI.
 *
 * Build/server-only entry: load via W03 → select streams by
 * path/operation/status/media-type/`x-event-schema` → build fail-closed
 * semantic inventory → optionally project AsyncAPI → map W04 schema targets.
 *
 * Do not import from client components (depends on Node filesystem via W03).
 */

import {
  type EventSchemaDisplayTarget,
  eventSchemaDisplayTargetsForStreams,
} from "./event-schema-targets";
import {
  assertEventInventoryMatchesExpected,
  type EventSemanticInventory,
  hashOpenApiSource,
  resolveEventCorpusInventory,
} from "./event-semantic-inventory";
import type { LoadEventsOpenApiDependencies } from "./load-events-openapi";
import {
  type LoadedEventsOpenApi,
  loadEventsOpenApi,
} from "./load-events-openapi";
import {
  type EventsOpenApiToAsyncApiProjection,
  projectEventsOpenApiToAsyncApi,
} from "./project-events-asyncapi";
import type { EventSchemaRefClosure } from "./schema-ref-closure";
import {
  type SelectedEventStream,
  selectEventStreamsFromOpenApi,
} from "./select-event-streams";
import type { EventStreamOperation } from "./stream-operations";

export type ResolveEventCorpusOptions = {
  /** Override stream inventory (defaults to `EVENT_STREAM_OPERATIONS`). */
  inventory?: readonly EventStreamOperation[];
  /** When set, fail closed if live inventory drifts from this snapshot. */
  expectedInventory?: EventSemanticInventory;
  /**
   * When true, also build the optional source-hashed AsyncAPI projection.
   * Default false — OpenAPI remains event truth; AsyncAPI is optional.
   */
  includeAsyncApiProjection?: boolean;
  loadDependencies?: LoadEventsOpenApiDependencies;
};

export type ResolvedEventCorpus = {
  openapi: LoadedEventsOpenApi;
  sourceHash: string;
  selectedStreams: SelectedEventStream[];
  inventory: EventSemanticInventory;
  schemaClosure: EventSchemaRefClosure;
  /** W04 addressable display targets for payload roots (no second corpus). */
  schemaTargets: EventSchemaDisplayTarget[];
  /** Present only when `includeAsyncApiProjection` is true. */
  asyncApiProjection?: EventsOpenApiToAsyncApiProjection;
};

/**
 * Resolve the production event corpus from packaged OpenAPI (W03).
 */
export function resolveEventCorpus(
  options: ResolveEventCorpusOptions = {},
): ResolvedEventCorpus {
  const openapi = loadEventsOpenApi(options.loadDependencies);
  const sourceHash = hashOpenApiSource(openapi.rawText);
  const selectedStreams = selectEventStreamsFromOpenApi(
    openapi.document,
    options.inventory,
  );
  const { inventory, schemaClosure } = resolveEventCorpusInventory(
    openapi.document,
    selectedStreams,
    sourceHash,
  );

  if (options.expectedInventory) {
    assertEventInventoryMatchesExpected(inventory, options.expectedInventory);
  }

  const schemaTargets = eventSchemaDisplayTargetsForStreams(selectedStreams);

  const result: ResolvedEventCorpus = {
    openapi,
    sourceHash,
    selectedStreams,
    inventory,
    schemaClosure,
    schemaTargets,
  };

  if (options.includeAsyncApiProjection) {
    result.asyncApiProjection = projectEventsOpenApiToAsyncApi(
      openapi.document,
      {
        inventory: options.inventory,
        sourceText: openapi.rawText,
        expectedInventory: options.expectedInventory,
      },
    );
  }

  return result;
}
