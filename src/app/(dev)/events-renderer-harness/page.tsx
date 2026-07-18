import { notFound } from "next/navigation";
import { eventStreamOperationSummaryModelsFromCorpus } from "@/components/references/events/event-stream-display";
import { EventsVerificationHarness } from "@/components/references/events/events-verification-harness";
import {
  buildEventReconnectLifecycleCorpus,
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  eventsOpenApiTurbopackLoadDependencies,
  resolveEventCorpus,
} from "@/lib/references/events";

/**
 * Non-production W09 events renderer harness.
 *
 * Publishes no /docs/references/events nav, sitemap, or search inventory.
 * Hidden in production unless ENABLE_EVENTS_RENDERER_HARNESS=1.
 *
 * Uses Turbopack-safe OpenAPI resolution (manifest join) because Next does not
 * expose Bun's `import.meta.resolve` for `@you-agent-factory/api/openapi`.
 */
export default function EventsRendererHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_EVENTS_RENDERER_HARNESS !== "1"
  ) {
    notFound();
  }

  const corpus = resolveEventCorpus({
    loadDependencies: eventsOpenApiTurbopackLoadDependencies(),
  });
  const summaries = eventStreamOperationSummaryModelsFromCorpus({
    selectedStreams: corpus.selectedStreams,
    schemaTargets: corpus.schemaTargets,
  });
  const factoryEventCatalog = buildFactoryEventCatalog(corpus.openapi.document);
  const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
    corpus.openapi.document,
  );
  const reconnectLifecycle = buildEventReconnectLifecycleCorpus(
    corpus.openapi.document,
  );

  return (
    <EventsVerificationHarness
      factoryEventCatalog={factoryEventCatalog}
      factoryResponseEventCatalog={factoryResponseEventCatalog}
      pagePath="/events-renderer-harness"
      reconnectLifecycle={reconnectLifecycle}
      sourceHash={corpus.sourceHash}
      summaries={summaries}
    />
  );
}
