/**
 * Page-local production mount for /docs/references/events.
 *
 * Resolves the W09 packaged OpenAPI corpus at build/static-render time and
 * mounts the public EventsSurface + stream-role + catalog + reconnect/lifecycle
 * + static SSE sections. Page wiring only — does not edit renderer internals
 * under components/references/events.
 *
 * `EventsCorpusMountView` accepts an already-resolved mount model so page-local
 * tests can prove empty/error published-route states without mocking OpenAPI
 * loaders or scanning renderer trees.
 */

import { EventLinkedComponentSchemas } from "@/features/references/events/event-linked-component-schemas";
import { EventReconnectLifecycleSection } from "@/features/references/events/event-reconnect-lifecycle-section";
import {
  type EventStreamOperationSummaryModel,
  eventStreamOperationSummaryModelsFromCorpus,
} from "@/features/references/events/event-stream-display";
import { EventStreamOperationsList } from "@/features/references/events/event-stream-operations-list";
import { EventsSurface } from "@/features/references/events/events-surface";
import { FactoryEventCatalogSection } from "@/features/references/events/factory-event-catalog-section";
import { FactoryResponseEventCatalogSection } from "@/features/references/events/factory-response-event-catalog-section";
import { SseStaticExamplesSection } from "@/features/references/events/sse-static-examples-section";
import type { EventsUiStatus } from "@/features/references/events/types";
import { ReferenceHashNavigation } from "@/features/references/shared";
import {
  buildEventReconnectLifecycleCorpus,
  buildEventsLinkedComponentSchemas,
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  buildSseStaticExamplesCorpus,
  type EventReconnectLifecycleCorpus,
  type EventsLinkedComponentSchema,
  eventsOpenApiTurbopackLoadDependencies,
  type FactoryEventCatalog,
  type FactoryResponseEventCatalog,
  resolveEventCorpus,
  type SseStaticExamplesCorpus,
} from "@/lib/references/events";

const EVENTS_PAGE_PATH = "/docs/references/events";

export type ResolvedCorpusMount = {
  status: EventsUiStatus;
  statusTitle?: string;
  statusMessage?: string;
  summaries: readonly EventStreamOperationSummaryModel[];
  factoryEventCatalog?: FactoryEventCatalog;
  factoryResponseEventCatalog?: FactoryResponseEventCatalog;
  linkedComponentSchemas?: readonly EventsLinkedComponentSchema[];
  reconnectLifecycle?: EventReconnectLifecycleCorpus;
  sseStaticExamples?: SseStaticExamplesCorpus;
  sourceHash?: string;
};

export function resolvePublishedEventsCorpus(): ResolvedCorpusMount {
  try {
    const corpus = resolveEventCorpus({
      loadDependencies: eventsOpenApiTurbopackLoadDependencies(),
    });
    const summaries = eventStreamOperationSummaryModelsFromCorpus({
      selectedStreams: corpus.selectedStreams,
      schemaTargets: corpus.schemaTargets,
    });
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );
    const linkedComponentSchemas = buildEventsLinkedComponentSchemas(
      corpus.openapi.document,
      factoryEventCatalog,
      factoryResponseEventCatalog,
    );
    const reconnectLifecycle = buildEventReconnectLifecycleCorpus(
      corpus.openapi.document,
    );
    const sseStaticExamples = buildSseStaticExamplesCorpus(
      corpus.openapi.document,
      reconnectLifecycle,
    );

    if (summaries.length === 0) {
      return {
        status: "empty",
        statusTitle: "Empty event corpus",
        statusMessage:
          "No FactoryEvent or FactoryResponseEvent stream operations were published for this artifact.",
        summaries: [],
      };
    }

    return {
      status: "success",
      summaries,
      factoryEventCatalog,
      factoryResponseEventCatalog,
      linkedComponentSchemas,
      reconnectLifecycle,
      sseStaticExamples,
      sourceHash: corpus.sourceHash,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OpenAPI resolution rejected the event corpus.";
    return {
      status: "error",
      statusTitle: "Corpus error",
      statusMessage: message,
      summaries: [],
    };
  }
}

export type EventsCorpusMountViewProps = {
  resolved: ResolvedCorpusMount;
};

/**
 * Renders a resolved published-route corpus mount through EventsSurface.
 * Non-success statuses short-circuit to the public EventsStatus messaging.
 */
export function EventsCorpusMountView({
  resolved,
}: EventsCorpusMountViewProps) {
  return (
    <div
      className="min-w-0 space-y-12"
      data-events-page-corpus-mount=""
      data-events-page-path={EVENTS_PAGE_PATH}
      data-testid="events-corpus-mount"
      {...(resolved.sourceHash !== undefined
        ? { "data-events-source-hash": resolved.sourceHash }
        : {})}
    >
      <ReferenceHashNavigation data-testid="events-reference-hash-navigation" />
      <EventsSurface
        status={resolved.status}
        statusMessage={resolved.statusMessage}
        statusTitle={resolved.statusTitle}
      >
        <div className="min-w-0 space-y-12">
          {resolved.summaries.length > 0 ? (
            <EventStreamOperationsList summaries={resolved.summaries} />
          ) : null}
          {resolved.factoryEventCatalog !== undefined ? (
            <FactoryEventCatalogSection
              catalog={resolved.factoryEventCatalog}
              pagePath={EVENTS_PAGE_PATH}
            />
          ) : null}
          {resolved.factoryResponseEventCatalog !== undefined ? (
            <FactoryResponseEventCatalogSection
              catalog={resolved.factoryResponseEventCatalog}
              pagePath={EVENTS_PAGE_PATH}
            />
          ) : null}
          {resolved.linkedComponentSchemas !== undefined &&
          resolved.linkedComponentSchemas.length > 0 ? (
            <EventLinkedComponentSchemas
              pagePath={EVENTS_PAGE_PATH}
              schemas={resolved.linkedComponentSchemas}
            />
          ) : null}
          {resolved.reconnectLifecycle !== undefined ? (
            <EventReconnectLifecycleSection
              corpus={resolved.reconnectLifecycle}
            />
          ) : null}
          {resolved.sseStaticExamples !== undefined ? (
            <SseStaticExamplesSection corpus={resolved.sseStaticExamples} />
          ) : null}
        </div>
      </EventsSurface>
    </div>
  );
}

/**
 * Mounts the published events corpus on the hybrid references page.
 */
export function EventsCorpusMount() {
  return <EventsCorpusMountView resolved={resolvePublishedEventsCorpus()} />;
}
