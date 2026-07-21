"use client";

import { useId } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/features/factory-ui/data-display";
import { cn } from "@/lib/utils";
import { AttributeFacetBar } from "./AttributeFacetBar";
import { filterRowsByAttributes } from "./attribute-filter";
import { sortRowsByAttribute } from "./attribute-sort";
import { resolveTableRowFocusClassName } from "./table-focus";
import type {
  AttributeDef,
  AttributeFilterState,
  GetAttributeValue,
  SortDirection,
} from "./types";

export type FilterableSortableTableProps<Row extends { id: string }> = {
  rows: Row[];
  columns: DataTableColumn<Row>[];
  attributeDefs?: AttributeDef[];
  getAttributeValue?: GetAttributeValue<Row>;
  filters: AttributeFilterState;
  onFiltersChange: (next: AttributeFilterState) => void;
  sortAttributeId?: string;
  sortDirection?: SortDirection;
  onSortChange?: (attributeId: string, direction: SortDirection) => void;
  focusRowId?: string;
  emptyMessage: string;
  /**
   * Host-owned resolved labels keyed by attribute id (facets + sort controls).
   * Falls back to `AttributeDef.labelKey` when omitted.
   */
  labels?: Readonly<Record<string, string>>;
  /** Accessible name for the DataTable. */
  ariaLabel?: string;
  className?: string;
};

const CONTROL_CLASS =
  "h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

function resolveLabel(
  def: AttributeDef,
  labels: Readonly<Record<string, string>> | undefined,
): string {
  return labels?.[def.id] ?? def.labelKey;
}

function noopGetAttributeValue(): unknown {
  return undefined;
}

type SortControlsProps = {
  sortableDefs: readonly AttributeDef[];
  sortAttributeId: string | undefined;
  sortDirection: SortDirection | undefined;
  onSortChange: (attributeId: string, direction: SortDirection) => void;
  labels: Readonly<Record<string, string>> | undefined;
  reactId: string;
};

function SortControls({
  sortableDefs,
  sortAttributeId,
  sortDirection,
  onSortChange,
  labels,
  reactId,
}: SortControlsProps) {
  const attributeControlId = `${reactId}-sort-attribute`;
  const directionControlId = `${reactId}-sort-direction`;
  const activeAttributeId = sortAttributeId ?? sortableDefs[0]?.id ?? "";
  const activeDirection: SortDirection = sortDirection ?? "asc";

  return (
    <fieldset
      className="m-0 flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end"
      data-table-sort-controls=""
    >
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Sort
      </legend>

      <div className="flex min-w-[10rem] flex-col gap-1">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={attributeControlId}
        >
          Sort by
        </label>
        <select
          className={CONTROL_CLASS}
          id={attributeControlId}
          onChange={(event) => {
            const nextId = event.target.value;
            if (!nextId) {
              return;
            }
            onSortChange(nextId, activeDirection);
          }}
          value={activeAttributeId}
        >
          {sortableDefs.map((def) => (
            <option key={def.id} value={def.id}>
              {resolveLabel(def, labels)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-[8rem] flex-col gap-1">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={directionControlId}
        >
          Direction
        </label>
        <select
          className={CONTROL_CLASS}
          id={directionControlId}
          onChange={(event) => {
            const nextDirection = event.target.value as SortDirection;
            if (!activeAttributeId) {
              return;
            }
            onSortChange(activeAttributeId, nextDirection);
          }}
          value={activeDirection}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </fieldset>
  );
}

/**
 * Entity-row teaching table: host-owned filter/sort state → pure helpers →
 * factory-ui DataTable. Composes AttributeFacetBar when filterable defs exist.
 */
export function FilterableSortableTable<Row extends { id: string }>({
  rows,
  columns,
  attributeDefs = [],
  getAttributeValue = noopGetAttributeValue,
  filters,
  onFiltersChange,
  sortAttributeId,
  sortDirection,
  onSortChange,
  focusRowId,
  emptyMessage,
  labels,
  ariaLabel = "Filterable sortable table",
  className,
}: FilterableSortableTableProps<Row>) {
  const reactId = useId();

  const filtered = filterRowsByAttributes(
    rows,
    attributeDefs,
    filters,
    getAttributeValue,
  );
  const visibleRows = sortRowsByAttribute(
    filtered,
    attributeDefs,
    sortAttributeId,
    sortDirection,
    getAttributeValue,
  );

  const filterableDefs = attributeDefs.filter((def) => def.filterable);
  const sortableDefs = attributeDefs.filter((def) => def.sortable);
  const showSortControls =
    typeof onSortChange === "function" && sortableDefs.length > 0;
  const tableState = visibleRows.length === 0 ? "empty" : "success";

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      data-filterable-sortable-table=""
    >
      {filterableDefs.length > 0 ? (
        <AttributeFacetBar
          attributeDefs={attributeDefs}
          filters={filters}
          labels={labels}
          onFiltersChange={onFiltersChange}
        />
      ) : null}

      {showSortControls ? (
        <SortControls
          labels={labels}
          onSortChange={onSortChange}
          reactId={reactId}
          sortableDefs={sortableDefs}
          sortAttributeId={sortAttributeId}
          sortDirection={sortDirection}
        />
      ) : null}

      <DataTable
        ariaLabel={ariaLabel}
        columns={columns}
        data={visibleRows}
        emptyMessage={emptyMessage}
        getRowKey={(row) => row.id}
        rowClassName={(row) =>
          resolveTableRowFocusClassName(row.id, focusRowId)
        }
        state={tableState}
      />
    </div>
  );
}
