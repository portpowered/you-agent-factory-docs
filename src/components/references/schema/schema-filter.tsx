"use client";

/**
 * Definition / field-path filter control for the W07 schema UI.
 *
 * Holds UI-only query state. Filtering projects visible lists via pure helpers
 * and never mutates W04 canonical models. Keyboard: focus the search input,
 * type to filter, clear/reset with the Clear button (or empty the field).
 */

import { useId, useState } from "react";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import { SchemaFieldTree } from "./schema-field-tree";
import {
  filterSchemaDefinitions,
  filterSchemaFieldTreeNodes,
  normalizeSchemaFilterQuery,
  schemaFilterHasNoMatches,
} from "./schema-filter-display";
import { SchemaStatus } from "./schema-status";
import type { SchemaFieldTreeNode } from "./types";

const DEFAULT_PLACEHOLDER = "Filter definitions and fields…";
const DEFAULT_LABEL = "Filter schema definitions and fields";
const DEFAULT_EMPTY_MESSAGE = "No definitions or fields match this filter.";
const DEFAULT_EMPTY_TITLE = "No matches";

export type SchemaFilterProps = {
  /**
   * Controlled query. When set, the input is controlled and `onQueryChange`
   * should update the parent value.
   */
  value?: string;
  /** Uncontrolled initial query when `value` is omitted. */
  defaultValue?: string;
  /** Fires on every query change (controlled or uncontrolled). */
  onQueryChange?: (query: string) => void;
  /** Accessible label for the search input. */
  label?: string;
  placeholder?: string;
  /**
   * Definitions to filter (projection only). Original array and models are
   * not mutated.
   */
  definitions?: readonly SchemaDefinitionModel[];
  /**
   * Pre-resolved field tree to filter. Original nodes / field models are not
   * mutated.
   */
  fieldNodes?: readonly SchemaFieldTreeNode[];
  /**
   * When true (default), render a simple filtered definition list when
   * `definitions` is provided.
   */
  showDefinitionList?: boolean;
  /**
   * When true (default), render `SchemaFieldTree` for filtered field nodes
   * when `fieldNodes` is provided.
   */
  showFieldTree?: boolean;
  /** Forwarded to the filtered field tree. */
  pagePath?: string;
  /** Initial expansion for filtered field rows. */
  defaultExpanded?: boolean;
  /** Empty-filter status title. */
  emptyTitle?: string;
  /** Empty-filter status message. */
  emptyMessage?: string;
  className?: string;
  "data-testid"?: string;
};

/**
 * Leaf name for a definition list row — prefers title, else pointer leaf.
 */
function definitionListLabel(definition: SchemaDefinitionModel): string {
  if (definition.title !== undefined && definition.title.length > 0) {
    return definition.title;
  }
  const segments = definition.address.pointer
    .split("/")
    .filter((segment) => segment.length > 0);
  return segments.at(-1) ?? definition.address.pointer;
}

export function SchemaFilter({
  value,
  defaultValue = "",
  onQueryChange,
  label = DEFAULT_LABEL,
  placeholder = DEFAULT_PLACEHOLDER,
  definitions,
  fieldNodes,
  showDefinitionList = true,
  showFieldTree = true,
  pagePath,
  defaultExpanded = false,
  emptyTitle = DEFAULT_EMPTY_TITLE,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  className,
  "data-testid": testId = "schema-filter",
}: SchemaFilterProps) {
  const inputId = useId();
  const [uncontrolledQuery, setUncontrolledQuery] = useState(defaultValue);
  const isControlled = value !== undefined;
  const query = isControlled ? value : uncontrolledQuery;

  function setQuery(next: string) {
    if (!isControlled) {
      setUncontrolledQuery(next);
    }
    onQueryChange?.(next);
  }

  const filteredDefinitions =
    definitions !== undefined
      ? filterSchemaDefinitions(definitions, query)
      : undefined;
  const filteredFieldNodes =
    fieldNodes !== undefined
      ? filterSchemaFieldTreeNodes(fieldNodes, query)
      : undefined;

  const noMatches = schemaFilterHasNoMatches({
    query,
    definitions,
    fieldNodes,
  });
  const hasClearableQuery = normalizeSchemaFilterQuery(query).length > 0;
  const showResults =
    !noMatches &&
    ((showDefinitionList &&
      filteredDefinitions !== undefined &&
      filteredDefinitions.length > 0) ||
      (showFieldTree &&
        filteredFieldNodes !== undefined &&
        filteredFieldNodes.length > 0));

  return (
    <div
      className={cn("min-w-0 space-y-3", className)}
      data-schema-filter=""
      data-testid={testId}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={inputId}>
          {label}
        </label>
        <input
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          data-schema-filter="input"
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          type="search"
          value={query}
        />
        <button
          className="shrink-0 rounded-md border border-border px-2.5 py-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          data-schema-filter="clear"
          disabled={!hasClearableQuery}
          onClick={() => setQuery("")}
          type="button"
        >
          Clear
        </button>
      </div>

      {noMatches ? (
        <SchemaStatus
          data-testid={`${testId}-empty`}
          kind="empty"
          message={emptyMessage}
          title={emptyTitle}
        />
      ) : null}

      {showResults ? (
        <div
          className="min-w-0 space-y-4"
          data-schema-filter="results"
          data-testid={`${testId}-results`}
        >
          {showDefinitionList &&
          filteredDefinitions !== undefined &&
          filteredDefinitions.length > 0 ? (
            <section
              aria-label="Filtered definitions"
              data-schema-filter="definitions"
            >
              <h3 className="mb-2 font-medium text-foreground text-sm">
                Definitions
              </h3>
              <ul className="m-0 list-none space-y-1 p-0">
                {filteredDefinitions.map((definition) => {
                  const labelText = definitionListLabel(definition);
                  return (
                    <li
                      className="min-w-0 rounded-md border border-border px-3 py-2"
                      data-schema-filter-definition-pointer={
                        definition.address.pointer
                      }
                      key={definition.address.pointer}
                    >
                      <span
                        className="font-medium text-foreground text-sm"
                        data-schema-filter-definition-title=""
                      >
                        {labelText}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-muted-foreground text-xs">
                        {definition.address.pointer}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {showFieldTree &&
          filteredFieldNodes !== undefined &&
          filteredFieldNodes.length > 0 ? (
            <section aria-label="Filtered fields" data-schema-filter="fields">
              <h3 className="mb-2 font-medium text-foreground text-sm">
                Fields
              </h3>
              <SchemaFieldTree
                data-testid={`${testId}-field-tree`}
                defaultExpanded={defaultExpanded || hasClearableQuery}
                nodes={filteredFieldNodes}
                pagePath={pagePath}
              />
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
