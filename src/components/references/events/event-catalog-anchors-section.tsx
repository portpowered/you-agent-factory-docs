/**
 * Composed events catalog navigation + hash focus chrome.
 *
 * Builds nav entries from FactoryEvent + FactoryResponseEvent catalogs via
 * search-document helpers. Final Orama / page inventory wiring remains W11+.
 */

import type {
  FactoryEventCatalog,
  FactoryResponseEventCatalog,
} from "@/lib/references/events";
import { buildEventCorpusSearchDocuments } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventCatalogNavigation } from "./event-catalog-navigation";
import { EventHashNavigation } from "./event-hash-navigation";

export type EventCatalogAnchorsSectionProps = {
  factoryEventCatalog: FactoryEventCatalog;
  factoryResponseEventCatalog: FactoryResponseEventCatalog;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventCatalogAnchorsSection({
  factoryEventCatalog,
  factoryResponseEventCatalog,
  pagePath,
  className,
  "data-testid": testId = "event-catalog-anchors-section",
}: EventCatalogAnchorsSectionProps) {
  const { documents, navEntries, registered } = buildEventCorpusSearchDocuments(
    factoryEventCatalog,
    factoryResponseEventCatalog,
    pagePath !== undefined ? { pagePath } : {},
  );

  return (
    <section
      aria-labelledby="event-catalog-anchors-heading"
      className={cn("min-w-0 space-y-4 overflow-x-auto", className)}
      data-event-catalog-anchor-count={String(registered.length)}
      data-event-catalog-search-document-count={String(documents.length)}
      data-testid={testId}
      id="event-catalog-anchors"
    >
      <h2 className="sr-only" id="event-catalog-anchors-heading">
        Event catalog anchors and search documents
      </h2>
      <EventHashNavigation />
      <EventCatalogNavigation entries={navEntries} />
      <p
        className="m-0 text-muted-foreground text-xs"
        data-event-search-documents-ready=""
      >
        {documents.length} event search documents ready for later Orama /
        reference search wiring (W11/W15/W16).
      </p>
    </section>
  );
}
