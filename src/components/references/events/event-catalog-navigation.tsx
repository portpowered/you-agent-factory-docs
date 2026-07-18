"use client";

import { useMemo, useState } from "react";
import {
  createReferenceInventoryFilterState,
  filterReferenceInventoryItems,
  ReferenceInventoryFilter,
  type ReferenceInventoryFilterableItem,
  type ReferenceInventoryFilterState,
} from "@/components/references/shared";
import type { EventCatalogNavEntry } from "@/lib/references/events";
import { cn } from "@/lib/utils";

type FilterableNavEntry = ReferenceInventoryFilterableItem & {
  entry: EventCatalogNavEntry;
};

function toFilterable(entry: EventCatalogNavEntry): FilterableNavEntry {
  const item: FilterableNavEntry = {
    identityText: entry.identityText,
    aliases: entry.aliases,
    entry,
  };
  if (entry.description !== undefined) {
    item.description = entry.description;
  }
  return item;
}

export type EventCatalogNavigationProps = {
  entries: readonly EventCatalogNavEntry[];
  className?: string;
  "data-testid"?: string;
};

/**
 * Keyboard-accessible event catalog navigation with query filtering.
 *
 * Semantic `<nav>` + list of deep links. Presentation filter state only —
 * does not mutate search documents or catalog models. Overflow-safe for
 * narrow viewports (`min-w-0`, `overflow-x-auto`).
 */
export function EventCatalogNavigation({
  entries,
  className,
  "data-testid": testId = "event-catalog-navigation",
}: EventCatalogNavigationProps) {
  const [filter, setFilter] = useState<ReferenceInventoryFilterState>(() =>
    createReferenceInventoryFilterState(),
  );

  const filterable = useMemo(() => entries.map(toFilterable), [entries]);
  const filtered = filterReferenceInventoryItems(filterable, filter);

  return (
    <nav
      aria-labelledby="event-catalog-navigation-heading"
      className={cn("min-w-0 space-y-3 overflow-x-auto", className)}
      data-event-catalog-nav-count={String(entries.length)}
      data-event-catalog-nav-filtered-count={String(filtered.length)}
      data-event-catalog-navigation=""
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="event-catalog-navigation-heading"
        >
          Event catalog navigation
        </h2>
        <p className="text-muted-foreground text-sm">
          Filter and deep-link FactoryEvent types and FactoryResponseEvent
          payload variants. Search documents are produced for later Orama wiring
          — this surface does not open a live stream.
        </p>
      </header>

      <ReferenceInventoryFilter
        filter={filter}
        legend="Filter event catalog"
        onFilterChange={setFilter}
        queryLabel="Event or payload"
        queryPlaceholder="Filter by event type, payload schema, or alias…"
        resultCount={filtered.length}
        showVisibilityFilter={false}
        totalCount={entries.length}
      />

      {filtered.length === 0 ? (
        <p
          className="m-0 text-muted-foreground text-sm"
          data-event-catalog-nav-empty=""
          role="status"
        >
          No event types or payload variants match the current filters.
        </p>
      ) : (
        <ul
          aria-label="Event catalog anchors"
          className="m-0 min-w-0 list-none space-y-1.5 p-0"
          data-event-catalog-nav-list=""
        >
          {filtered.map((item) => (
            <li
              className="min-w-0 border-border/60 border-b pb-1.5 last:border-b-0"
              data-event-catalog-nav-kind={item.entry.kind}
              data-event-catalog-nav-entry={item.entry.id}
              key={item.entry.id}
            >
              <a
                className="inline-flex max-w-full min-w-0 flex-wrap items-baseline gap-2 font-mono text-foreground text-xs underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`#${item.entry.anchor}`}
                data-event-catalog-nav-link={item.entry.anchor}
              >
                <span className="truncate">{item.entry.label}</span>
                <span className="shrink-0 text-muted-foreground">
                  #{item.entry.anchor}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
