/**
 * Focused W09 verification surface for stream roles + event catalogs.
 *
 * Renders EventStreamOperationsList, FactoryEventCatalogSection, and
 * FactoryResponseEventCatalogSection from already-resolved corpus models.
 * Not a final /docs/references/events page.
 */

import type {
  FactoryEventCatalog,
  FactoryResponseEventCatalog,
} from "@/lib/references/events";
import { cn } from "@/lib/utils";
import type { EventStreamOperationSummaryModel } from "./event-stream-display";
import { EventStreamOperationsList } from "./event-stream-operations-list";
import { EventsSurface } from "./events-surface";
import { FactoryEventCatalogSection } from "./factory-event-catalog-section";
import { FactoryResponseEventCatalogSection } from "./factory-response-event-catalog-section";

export type EventsVerificationHarnessProps = {
  summaries: readonly EventStreamOperationSummaryModel[];
  factoryEventCatalog?: FactoryEventCatalog;
  factoryResponseEventCatalog?: FactoryResponseEventCatalog;
  sourceHash?: string;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventsVerificationHarness({
  summaries,
  factoryEventCatalog,
  factoryResponseEventCatalog,
  sourceHash,
  pagePath = "/events-renderer-harness",
  className,
  "data-testid": testId = "events-verification-harness",
}: EventsVerificationHarnessProps) {
  const status =
    summaries.length > 0 ||
    factoryEventCatalog !== undefined ||
    factoryResponseEventCatalog !== undefined
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
          Verifies stream roles, the FactoryEvent envelope / discriminator /
          payload catalog, and the FactoryResponseEvent envelope / dimensions /
          payload catalog against packaged OpenAPI. Does not open a live Factory
          connection.
        </p>
      </header>

      <EventsSurface status={status}>
        <div className="min-w-0 space-y-12">
          {summaries.length > 0 ? (
            <EventStreamOperationsList summaries={summaries} />
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
        </div>
      </EventsSurface>
    </div>
  );
}
