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
import {
  resolveMatrixColumnFocusClassName,
  resolveMatrixRowFocusClassName,
} from "./table-focus";
import { transposeEntityRowsToMatrix } from "./transpose-matrix";
import type {
  AttributeDef,
  AttributeFilterState,
  OrchestratorRecord,
  SortDirection,
} from "./types";

export type OrchestratorFeatureMatrixProps = {
  orchestrators: readonly OrchestratorRecord[];
  attributeDefs: readonly AttributeDef[];
  visibleOrchestratorIds: readonly string[];
  onVisibleOrchestratorIdsChange: (ids: string[]) => void;
  filters: AttributeFilterState;
  onFiltersChange: (next: AttributeFilterState) => void;
  sortAttributeId?: string;
  sortDirection?: SortDirection;
  onSortChange?: (attributeId: string, direction: SortDirection) => void;
  /** Orchestrator column to accent; siblings muted when set. */
  focusColumnId?: string;
  /** Attribute row to accent; siblings muted when set. */
  focusRowId?: string;
  /**
   * Host-owned resolved labels keyed by attribute id (facets + matrix row headers).
   * Falls back to `AttributeDef.labelKey` when omitted.
   */
  labels?: Readonly<Record<string, string>>;
  /** Accessible name for the matrix table. */
  ariaLabel?: string;
  emptyMessage?: string;
  className?: string;
};

const CONTROL_CLASS =
  "h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

type MatrixDisplayRow = {
  id: string;
  attributeId: string;
  attributeLabel: string;
  cellsByEntityId: Record<string, string>;
};

function resolveLabel(
  def: AttributeDef,
  labels: Readonly<Record<string, string>> | undefined,
): string {
  return labels?.[def.id] ?? def.labelKey;
}

function getOrchestratorAttributeValue(
  row: OrchestratorRecord,
  attributeId: string,
): unknown {
  return row.attributes[attributeId];
}

function formatAttributeCellValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (Array.isArray(value)) {
    return value.map(String).join(", ");
  }
  return String(value);
}

/**
 * Visible column order: when sorted, follow filter→sort order among selected
 * ids; otherwise preserve host-owned `visibleOrchestratorIds` order.
 */
function resolveVisibleColumnEntityIds(
  filteredSorted: readonly OrchestratorRecord[],
  visibleOrchestratorIds: readonly string[],
  sortAttributeId: string | undefined,
): string[] {
  const visibleSet = new Set(visibleOrchestratorIds);
  if (sortAttributeId) {
    return filteredSorted
      .filter((row) => visibleSet.has(row.id))
      .map((row) => row.id);
  }
  const filteredIds = new Set(filteredSorted.map((row) => row.id));
  return visibleOrchestratorIds.filter((id) => filteredIds.has(id));
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
      data-matrix-sort-controls=""
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

type ColumnPickerProps = {
  orchestrators: readonly OrchestratorRecord[];
  visibleOrchestratorIds: readonly string[];
  onVisibleOrchestratorIdsChange: (ids: string[]) => void;
  reactId: string;
};

function ColumnPicker({
  orchestrators,
  visibleOrchestratorIds,
  onVisibleOrchestratorIdsChange,
  reactId,
}: ColumnPickerProps) {
  const visibleSet = new Set(visibleOrchestratorIds);

  return (
    <fieldset
      className="m-0 flex flex-col gap-2 rounded-md border border-border bg-muted/20 px-3 py-3"
      data-matrix-column-picker=""
    >
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Columns
      </legend>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {orchestrators.map((orchestrator) => {
          const controlId = `${reactId}-col-${orchestrator.id}`;
          const checked = visibleSet.has(orchestrator.id);
          return (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              htmlFor={controlId}
              key={orchestrator.id}
            >
              <input
                checked={checked}
                className="size-4 accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id={controlId}
                onChange={(event) => {
                  if (event.target.checked) {
                    if (visibleSet.has(orchestrator.id)) {
                      return;
                    }
                    onVisibleOrchestratorIdsChange([
                      ...visibleOrchestratorIds,
                      orchestrator.id,
                    ]);
                    return;
                  }
                  onVisibleOrchestratorIdsChange(
                    visibleOrchestratorIds.filter(
                      (id) => id !== orchestrator.id,
                    ),
                  );
                }}
                type="checkbox"
              />
              <span>{orchestrator.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Transposed orchestrator feature matrix: columns = selected entities,
 * rows = attribute defs. Composes AttributeFacetBar + filter/sort helpers +
 * factory-ui DataTable; does not merge into FilterableSortableTable.
 */
export function OrchestratorFeatureMatrix({
  orchestrators,
  attributeDefs,
  visibleOrchestratorIds,
  onVisibleOrchestratorIdsChange,
  filters,
  onFiltersChange,
  sortAttributeId,
  sortDirection,
  onSortChange,
  focusColumnId,
  focusRowId,
  labels,
  ariaLabel = "Orchestrator feature matrix",
  emptyMessage = "No orchestrators match the current filters and column selection.",
  className,
}: OrchestratorFeatureMatrixProps) {
  const reactId = useId();

  const filtered = filterRowsByAttributes(
    orchestrators,
    attributeDefs,
    filters,
    getOrchestratorAttributeValue,
  );
  const sorted = sortRowsByAttribute(
    filtered,
    attributeDefs,
    sortAttributeId,
    sortDirection,
    getOrchestratorAttributeValue,
  );
  const columnEntityIds = resolveVisibleColumnEntityIds(
    sorted,
    visibleOrchestratorIds,
    sortAttributeId,
  );

  const matrix = transposeEntityRowsToMatrix(
    sorted,
    attributeDefs,
    columnEntityIds,
    getOrchestratorAttributeValue,
  );

  const nameById = new Map(
    orchestrators.map((orchestrator) => [orchestrator.id, orchestrator.name]),
  );

  const displayRows: MatrixDisplayRow[] = matrix.attributeDefs.map(
    (def, rowIndex) => {
      const cellsByEntityId: Record<string, string> = {};
      for (const [colIndex, entityId] of matrix.columnEntityIds.entries()) {
        cellsByEntityId[entityId] = formatAttributeCellValue(
          matrix.cells[rowIndex]?.[colIndex],
        );
      }
      return {
        id: def.id,
        attributeId: def.id,
        attributeLabel: resolveLabel(def, labels),
        cellsByEntityId,
      };
    },
  );

  const columns: DataTableColumn<MatrixDisplayRow>[] = [
    {
      id: "attribute",
      header: "Attribute",
      cell: (row) => row.attributeLabel,
      headerClassName: "teaching-ui-focus-neutral font-medium",
      cellClassName: "font-medium",
    },
    ...matrix.columnEntityIds.map((entityId) => {
      const focusClass = resolveMatrixColumnFocusClassName(
        entityId,
        focusColumnId,
      );
      return {
        id: entityId,
        header: nameById.get(entityId) ?? entityId,
        headerClassName: focusClass,
        cellClassName: focusClass,
        cell: (row: MatrixDisplayRow) => row.cellsByEntityId[entityId] ?? "—",
      } satisfies DataTableColumn<MatrixDisplayRow>;
    }),
  ];

  const filterableDefs = attributeDefs.filter((def) => def.filterable);
  const sortableDefs = attributeDefs.filter((def) => def.sortable);
  const showSortControls =
    typeof onSortChange === "function" && sortableDefs.length > 0;
  const tableState =
    displayRows.length === 0 || columnEntityIds.length === 0
      ? "empty"
      : "success";

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      data-orchestrator-feature-matrix=""
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

      <ColumnPicker
        onVisibleOrchestratorIdsChange={onVisibleOrchestratorIdsChange}
        orchestrators={orchestrators}
        reactId={reactId}
        visibleOrchestratorIds={visibleOrchestratorIds}
      />

      <DataTable
        ariaLabel={ariaLabel}
        columns={columns}
        data={tableState === "empty" ? [] : displayRows}
        emptyMessage={emptyMessage}
        getRowKey={(row) => row.id}
        rowClassName={(row) =>
          resolveMatrixRowFocusClassName(row.attributeId, focusRowId)
        }
        state={tableState}
      />
    </div>
  );
}
