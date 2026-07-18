/**
 * Page-local production mount for /docs/references/events.
 *
 * Resolves the W09 packaged OpenAPI corpus at build/static-render time and
 * mounts the public EventsSurface + stream-role + catalog sections. Page wiring
 * only — does not edit renderer internals under components/references/events.
 *
 * Reconnect / lifecycle / static SSE sections stay for later W11 stories.
 */

import {
  type EventStreamOperationSummaryModel,
  eventStreamOperationSummaryModelsFromCorpus,
} from "@/components/references/events/event-stream-display";
import { EventStreamOperationsList } from "@/components/references/events/event-stream-operations-list";
import { EventsSurface } from "@/components/references/events/events-surface";
import { FactoryEventCatalogSection } from "@/components/references/events/factory-event-catalog-section";
import { FactoryResponseEventCatalogSection } from "@/components/references/events/factory-response-event-catalog-section";
import type { EventsUiStatus } from "@/components/references/events/types";
import {
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  eventsOpenApiTurbopackLoadDependencies,
  type FactoryEventCatalog,
  type FactoryResponseEventCatalog,
  resolveEventCorpus,
} from "@/lib/references/events";

const EVENTS_PAGE_PATH = "/docs/references/events";

type ResolvedCorpusMount = {
  status: EventsUiStatus;
  statusTitle?: string;
  statusMessage?: string;
  summaries: readonly EventStreamOperationSummaryModel[];
  factoryEventCatalog?: FactoryEventCatalog;
  factoryResponseEventCatalog?: FactoryResponseEventCatalog;
  sourceHash?: string;
};

function resolvePublishedEventsCorpus(): ResolvedCorpusMount {
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

/**
 * Mounts the published events corpus on the hybrid references page.
 */
export function EventsCorpusMount() {
  const resolved = resolvePublishedEventsCorpus();

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
        </div>
      </EventsSurface>
    </div>
  );
}
