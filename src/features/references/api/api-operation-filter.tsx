"use client";

/**
 * Keyboard-accessible operation filter control for the W08 API surface.
 *
 * Holds UI-only query state (controlled or uncontrolled). Callers project
 * visible nav groups via pure helpers in `operation-filter.ts` — this control
 * never mutates the tag-grouped model.
 */

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  API_PRINT_CHROME_ATTR,
  API_PRINT_CHROME_HIDE,
} from "./a11y-verification";
import {
  API_OPERATION_FILTER_ATTR,
  API_OPERATION_FILTER_LABEL,
  API_OPERATION_FILTER_PLACEHOLDER,
  normalizeApiOperationFilterQuery,
} from "./operation-filter";

export type ApiOperationFilterProps = {
  /** Controlled query. When set, the input is controlled. */
  value?: string;
  /** Uncontrolled initial query when `value` is omitted. */
  defaultValue?: string;
  /** Fires on every query change (controlled or uncontrolled). */
  onQueryChange?: (query: string) => void;
  /** Accessible label for the search input. */
  label?: string;
  placeholder?: string;
  /** Optional result count shown when filtering is active. */
  resultCount?: number;
  totalCount?: number;
  className?: string;
  "data-testid"?: string;
};

/**
 * Search + clear control for filtering operations by method, path, summary,
 * or operation ID.
 */
export function ApiOperationFilter({
  value,
  defaultValue = "",
  onQueryChange,
  label = API_OPERATION_FILTER_LABEL,
  placeholder = API_OPERATION_FILTER_PLACEHOLDER,
  resultCount,
  totalCount,
  className,
  "data-testid": testId = "api-operation-filter",
}: ApiOperationFilterProps) {
  const inputId = useId();
  const [uncontrolledQuery, setUncontrolledQuery] = useState(defaultValue);
  const isControlled = value !== undefined;
  const query = isControlled ? value : uncontrolledQuery;
  const hasClearableQuery = normalizeApiOperationFilterQuery(query).length > 0;
  const showCount =
    hasClearableQuery && resultCount !== undefined && totalCount !== undefined;

  function setQuery(next: string) {
    if (!isControlled) {
      setUncontrolledQuery(next);
    }
    onQueryChange?.(next);
  }

  return (
    <div
      className={cn("min-w-0 space-y-2", className)}
      {...{
        [API_OPERATION_FILTER_ATTR]: "",
        [API_PRINT_CHROME_ATTR]: API_PRINT_CHROME_HIDE,
      }}
      data-api-operation-filter-active={hasClearableQuery ? "true" : "false"}
      data-testid={testId}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={inputId}>
          {label}
        </label>
        <input
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          data-api-operation-filter="input"
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          type="search"
          value={query}
        />
        <button
          className="shrink-0 rounded-md border border-border px-2.5 py-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          data-api-operation-filter="clear"
          disabled={!hasClearableQuery}
          onClick={() => setQuery("")}
          type="button"
        >
          Clear
        </button>
      </div>
      {showCount ? (
        <p
          className="text-xs text-muted-foreground"
          data-api-operation-filter="count"
        >
          Showing {resultCount} of {totalCount} operations
        </p>
      ) : null}
    </div>
  );
}
