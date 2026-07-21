"use client";

import { useId, useState } from "react";
import {
  type AttributeDef,
  type AttributeFilterState,
  OrchestratorFeatureMatrix,
  type OrchestratorRecord,
  type SortDirection,
} from "@/features/teaching-ui";

export type ComparingOrchestratorsMatrixComposerProps = {
  orchestrators: readonly OrchestratorRecord[];
  attributeDefs: readonly AttributeDef[];
  /** Host-resolved attribute labels keyed by attribute id. */
  labels: Readonly<Record<string, string>>;
  ariaLabel?: string;
  emptyMessage?: string;
  focusColumnLabel?: string;
  focusRowLabel?: string;
  focusNoneLabel?: string;
  initialVisibleOrchestratorIds?: readonly string[];
  initialFilters?: AttributeFilterState;
  initialSortAttributeId?: string;
  initialSortDirection?: SortDirection;
  initialFocusColumnId?: string;
  initialFocusRowId?: string;
};

const CONTROL_CLASS =
  "h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Page-local host for OrchestratorFeatureMatrix: column visibility, AND facet
 * filters, sort, and focus stay in memory (no URL sync in v1).
 */
export function ComparingOrchestratorsMatrixComposer({
  orchestrators,
  attributeDefs,
  labels,
  ariaLabel = "Orchestrator feature matrix",
  emptyMessage = "No orchestrators match the current filters and column selection.",
  focusColumnLabel = "Focus column",
  focusRowLabel = "Focus row",
  focusNoneLabel = "None",
  initialVisibleOrchestratorIds,
  initialFilters = {},
  initialSortAttributeId,
  initialSortDirection = "asc",
  initialFocusColumnId,
  initialFocusRowId,
}: ComparingOrchestratorsMatrixComposerProps) {
  const reactId = useId();
  const [visibleOrchestratorIds, setVisibleOrchestratorIds] = useState<
    string[]
  >(() =>
    initialVisibleOrchestratorIds
      ? [...initialVisibleOrchestratorIds]
      : orchestrators.map((row) => row.id),
  );
  const [filters, setFilters] = useState<AttributeFilterState>(initialFilters);
  const [sortAttributeId, setSortAttributeId] = useState<string | undefined>(
    initialSortAttributeId,
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);
  const [focusColumnId, setFocusColumnId] = useState<string | undefined>(
    initialFocusColumnId,
  );
  const [focusRowId, setFocusRowId] = useState<string | undefined>(
    initialFocusRowId,
  );

  const focusColumnControlId = `${reactId}-focus-column`;
  const focusRowControlId = `${reactId}-focus-row`;

  return (
    <div
      className="flex flex-col gap-3"
      data-comparing-orchestrators-matrix=""
      data-testid="comparing-orchestrators-matrix"
    >
      <fieldset
        className="m-0 flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end"
        data-matrix-focus-controls=""
      >
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Focus
        </legend>

        <div className="flex min-w-[10rem] flex-col gap-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={focusColumnControlId}
          >
            {focusColumnLabel}
          </label>
          <select
            className={CONTROL_CLASS}
            id={focusColumnControlId}
            onChange={(event) => {
              const next = event.target.value;
              setFocusColumnId(next === "" ? undefined : next);
            }}
            value={focusColumnId ?? ""}
          >
            <option value="">{focusNoneLabel}</option>
            {orchestrators.map((orchestrator) => (
              <option key={orchestrator.id} value={orchestrator.id}>
                {orchestrator.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-[10rem] flex-col gap-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={focusRowControlId}
          >
            {focusRowLabel}
          </label>
          <select
            className={CONTROL_CLASS}
            id={focusRowControlId}
            onChange={(event) => {
              const next = event.target.value;
              setFocusRowId(next === "" ? undefined : next);
            }}
            value={focusRowId ?? ""}
          >
            <option value="">{focusNoneLabel}</option>
            {attributeDefs.map((def) => (
              <option key={def.id} value={def.id}>
                {labels[def.id] ?? def.labelKey}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <OrchestratorFeatureMatrix
        ariaLabel={ariaLabel}
        attributeDefs={attributeDefs}
        emptyMessage={emptyMessage}
        filters={filters}
        focusColumnId={focusColumnId}
        focusRowId={focusRowId}
        labels={labels}
        onFiltersChange={setFilters}
        onSortChange={(attributeId, direction) => {
          setSortAttributeId(attributeId);
          setSortDirection(direction);
        }}
        onVisibleOrchestratorIdsChange={setVisibleOrchestratorIds}
        orchestrators={orchestrators}
        sortAttributeId={sortAttributeId}
        sortDirection={sortDirection}
        visibleOrchestratorIds={visibleOrchestratorIds}
      />
    </div>
  );
}
