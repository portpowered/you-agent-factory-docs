/**
 * Focused W09 verification surface for stream roles + event catalogs +
 * reconnect/lifecycle docs + static SSE examples + catalog anchors/nav.
 *
 * Renders EventStreamOperationsList, EventCatalogAnchorsSection,
 * FactoryEventCatalogSection, FactoryResponseEventCatalogSection,
 * EventReconnectLifecycleSection, and SseStaticExamplesSection from
 * already-resolved corpus models. Not a final /docs/references/events page.
 */

import type {
  EventReconnectLifecycleCorpus,
  FactoryEventCatalog,
  FactoryResponseEventCatalog,
  SseStaticExamplesCorpus,
} from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventCatalogAnchorsSection } from "./event-catalog-anchors-section";
import { EventReconnectLifecycleSection } from "./event-reconnect-lifecycle-section";
import type { EventStreamOperationSummaryModel } from "./event-stream-display";
import { EventStreamOperationsList } from "./event-stream-operations-list";
import { EventsSurface } from "./events-surface";
import { FactoryEventCatalogSection } from "./factory-event-catalog-section";
import { FactoryResponseEventCatalogSection } from "./factory-response-event-catalog-section";
import { SseStaticExamplesSection } from "./sse-static-examples-section";

export type EventsVerificationHarnessProps = {
  summaries: readonly EventStreamOperationSummaryModel[];
  factoryEventCatalog?: FactoryEventCatalog;
  factoryResponseEventCatalog?: FactoryResponseEventCatalog;
  reconnectLifecycle?: EventReconnectLifecycleCorpus;
  sseStaticExamples?: SseStaticExamplesCorpus;
  sourceHash?: string;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventsVerificationHarness({
  summaries,
  factoryEventCatalog,
  factoryResponseEventCatalog,
  reconnectLifecycle,
  sseStaticExamples,
  sourceHash,
  pagePath = "/events-renderer-harness",
  className,
  "data-testid": testId = "events-verification-harness",
}: EventsVerificationHarnessProps) {
  const status =
    summaries.length > 0 ||
    factoryEventCatalog !== undefined ||
    factoryResponseEventCatalog !== undefined ||
    reconnectLifecycle !== undefined ||
    sseStaticExamples !== undefined
      ? "success"
      : "empty";

  return (
    <div
      className={cn("mx-auto min-w-0 max-w-5xl space-y-8 px-4 py-6", className)}
      data-events-verification-harness=""
      data-testid={testId}
      {...(sourceHash !== undefined
        ? { "data-events-source-hash": sourceHash }
        : {})}
    >
      <header className="min-w-0 space-y-2">
        <p className="text-sm text-muted-foreground">
          Non-production events renderer harness (W09)
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Event stream operations + event catalogs
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Verifies stream roles, catalog anchors / search documents /
          navigation, the FactoryEvent envelope / discriminator / payload
          catalog, the FactoryResponseEvent envelope / dimensions / payload
          catalog, reconnect / identity / lifecycle contracts, and static SSE
          frame / reconnect examples against packaged OpenAPI. Does not open a
          live Factory connection.
        </p>
      </header>

      <EventsSurface status={status}>
        <div className="min-w-0 space-y-12">
          {summaries.length > 0 ? (
            <EventStreamOperationsList summaries={summaries} />
          ) : null}
          {factoryEventCatalog !== undefined &&
          factoryResponseEventCatalog !== undefined ? (
            <EventCatalogAnchorsSection
              factoryEventCatalog={factoryEventCatalog}
              factoryResponseEventCatalog={factoryResponseEventCatalog}
              pagePath={pagePath}
            />
          ) : null}
          {factoryEventCatalog !== undefined ? (
            <FactoryEventCatalogSection
              catalog={factoryEventCatalog}
              pagePath={pagePath}
            />
          ) : null}
          {factoryResponseEventCatalog !== undefined ? (
            <FactoryResponseEventCatalogSection
              catalog={factoryResponseEventCatalog}
              pagePath={pagePath}
            />
          ) : null}
          {reconnectLifecycle !== undefined ? (
            <EventReconnectLifecycleSection corpus={reconnectLifecycle} />
          ) : null}
          {sseStaticExamples !== undefined ? (
            <SseStaticExamplesSection corpus={sseStaticExamples} />
          ) : null}
        </div>
      </EventsSurface>
    </div>
  );
}
