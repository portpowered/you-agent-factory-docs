"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  isReferenceInventoryFilterActive,
  REFERENCE_INVENTORY_FILTER_ALL,
  type ReferenceInventoryFilterState,
  type ReferenceInventoryLifecycleFilter,
  type ReferenceInventoryVisibilityFilter,
  referenceInventoryLifecycleFilterOptions,
  referenceInventoryVisibilityFilterOptions,
} from "./reference-inventory-filter";

export type ReferenceInventoryFilterProps = {
  filter: ReferenceInventoryFilterState;
  onFilterChange: (next: ReferenceInventoryFilterState) => void;
  /**
   * Published visibility strings present on the current inventory. Options are
   * derived from these values only — never invented.
   */
  publishedVisibilities?: readonly (string | undefined)[];
  /**
   * When false, hide the visibility select (for example MCP tools that do not
   * publish visibility). Lifecycle select stays available.
   */
  showVisibilityFilter?: boolean;
  /**
   * Accessible name for the filter region (for example "Filter CLI commands").
   */
  legend: string;
  /** Accessible label for the text query field. */
  queryLabel: string;
  /** Placeholder for the text query field. */
  queryPlaceholder?: string;
  className?: string;
  /** Optional result count shown beside the legend when filtering is active. */
  resultCount?: number;
  totalCount?: number;
};

/**
 * Keyboard-accessible inventory filter controls (text + lifecycle + optional
 * visibility). Presentation state only — callers own the filter object and
 * apply pure helpers; this component never mutates projections.
 */
export function ReferenceInventoryFilter({
  filter,
  onFilterChange,
  publishedVisibilities = [],
  showVisibilityFilter = true,
  legend,
  queryLabel,
  queryPlaceholder = "Filter by name or path…",
  className,
  resultCount,
  totalCount,
}: ReferenceInventoryFilterProps) {
  const reactId = useId();
  const lifecycleOptions = referenceInventoryLifecycleFilterOptions();
  const visibilityOptions = referenceInventoryVisibilityFilterOptions(
    publishedVisibilities,
  );
  const showVisibility = showVisibilityFilter && visibilityOptions.length > 1;
  const filterActive = isReferenceInventoryFilterActive(filter);

  const queryId = `${reactId}-query`;
  const lifecycleId = `${reactId}-lifecycle`;
  const visibilityId = `${reactId}-visibility`;

  return (
    <fieldset
      className={cn(
        "m-0 flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-3 py-3",
        className,
      )}
      data-reference-inventory-filter=""
      data-filter-active={filterActive ? "true" : "false"}
    >
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {legend}
        {filterActive &&
        resultCount !== undefined &&
        totalCount !== undefined ? (
          <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">
            Showing {resultCount} of {totalCount}
          </span>
        ) : null}
      </legend>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={queryId}
          >
            {queryLabel}
          </label>
          <input
            className="h-8 rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-reference-inventory-filter-query=""
            id={queryId}
            onChange={(event) =>
              onFilterChange({ ...filter, query: event.target.value })
            }
            placeholder={queryPlaceholder}
            type="search"
            value={filter.query}
          />
        </div>

        <div className="flex min-w-[10rem] flex-col gap-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={lifecycleId}
          >
            Lifecycle
          </label>
          <select
            className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-reference-inventory-filter-lifecycle=""
            id={lifecycleId}
            onChange={(event) =>
              onFilterChange({
                ...filter,
                lifecycle: event.target
                  .value as ReferenceInventoryLifecycleFilter,
              })
            }
            value={filter.lifecycle}
          >
            {lifecycleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {showVisibility ? (
          <div className="flex min-w-[10rem] flex-col gap-1">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor={visibilityId}
            >
              Visibility
            </label>
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-reference-inventory-filter-visibility=""
              id={visibilityId}
              onChange={(event) =>
                onFilterChange({
                  ...filter,
                  visibility: event.target
                    .value as ReferenceInventoryVisibilityFilter,
                })
              }
              value={filter.visibility}
            >
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {filterActive ? (
          <button
            className="h-8 rounded-md border border-border bg-background px-3 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-reference-inventory-filter-clear=""
            onClick={() =>
              onFilterChange({
                query: "",
                lifecycle: REFERENCE_INVENTORY_FILTER_ALL,
                visibility: REFERENCE_INVENTORY_FILTER_ALL,
              })
            }
            type="button"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}
