"use client";

import { useState } from "react";
import type { DataTableColumn } from "@/features/factory-ui/data-display";
import {
  type AttributeFilterState,
  FilterableSortableTable,
  OrchestratorFeatureMatrix,
  type OrchestratorRecord,
  type SortDirection,
} from "@/features/teaching-ui";
import {
  FIXTURE_ATTRIBUTE_DEFS,
  FIXTURE_ATTRIBUTE_LABELS,
  FIXTURE_ORCHESTRATOR_IDS,
  FIXTURE_ORCHESTRATORS,
  getFixtureOrchestratorAttributeValue,
} from "@/features/teaching-ui/tables/__fixtures__/orchestrator-matrix";

type EntityRow = OrchestratorRecord & {
  openSourceLabel: string;
  summary: string;
  license: string;
  capabilities: string;
};

function toEntityRows(rows: readonly OrchestratorRecord[]): EntityRow[] {
  return rows.map((row) => ({
    ...row,
    openSourceLabel: row.attributes["attr.open-source"] === true ? "yes" : "no",
    summary: String(row.attributes["attr.summary"] ?? ""),
    license: String(row.attributes["attr.license"] ?? ""),
    capabilities: Array.isArray(row.attributes["attr.capabilities"])
      ? row.attributes["attr.capabilities"].map(String).join(", ")
      : "",
  }));
}

const ENTITY_COLUMNS: DataTableColumn<EntityRow>[] = [
  { id: "name", header: "Orchestrator", cell: (row) => row.name },
  {
    id: "open-source",
    header: "Open source",
    cell: (row) => row.openSourceLabel,
  },
  { id: "summary", header: "Summary", cell: (row) => row.summary },
  { id: "license", header: "License", cell: (row) => row.license },
  {
    id: "capabilities",
    header: "Capabilities",
    cell: (row) => row.capabilities,
  },
];

/**
 * Teaching-ui harness shell with the W-table section filled.
 * Chart / list sections stay labeled placeholders for sibling lanes.
 */
export function TeachingUiHarnessView() {
  const [entityFilters, setEntityFilters] = useState<AttributeFilterState>({});
  const [entitySortAttributeId, setEntitySortAttributeId] = useState<
    string | undefined
  >("attr.open-source");
  const [entitySortDirection, setEntitySortDirection] =
    useState<SortDirection>("asc");
  const [matrixFilters, setMatrixFilters] = useState<AttributeFilterState>({});
  const [matrixSortAttributeId, setMatrixSortAttributeId] = useState<
    string | undefined
  >("attr.license");
  const [matrixSortDirection, setMatrixSortDirection] =
    useState<SortDirection>("asc");
  const [visibleOrchestratorIds, setVisibleOrchestratorIds] = useState<
    string[]
  >([...FIXTURE_ORCHESTRATOR_IDS]);
  const [focusRowId, setFocusRowId] = useState<string | undefined>(
    "orch-gamma",
  );
  const [focusColumnId, setFocusColumnId] = useState<string | undefined>(
    "orch-alpha",
  );
  const [focusAttributeRowId, setFocusAttributeRowId] = useState<
    string | undefined
  >("attr.license");

  const entityRows = toEntityRows(FIXTURE_ORCHESTRATORS);

  return (
    <main
      className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 bg-background px-6 py-10 text-foreground"
      data-teaching-ui-harness=""
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Teaching UI harness
        </h1>
        <p className="text-sm text-muted-foreground">
          Fixture surface for teaching-ui recipes. Table section is owned by
          W-table; chart and list placeholders belong to sibling lanes. Not
          linked from production navigation.
        </p>
      </header>

      <section
        aria-label="Charts placeholder"
        className="space-y-2 rounded-md border border-dashed border-border px-4 py-6"
        data-teaching-ui-harness-section="charts"
      >
        <h2 className="text-lg font-medium">Charts</h2>
        <p className="text-sm text-muted-foreground" role="status">
          Placeholder — owned by W-charts.
        </p>
      </section>

      <section
        aria-label="Lists placeholder"
        className="space-y-2 rounded-md border border-dashed border-border px-4 py-6"
        data-teaching-ui-harness-section="lists"
      >
        <h2 className="text-lg font-medium">Lists</h2>
        <p className="text-sm text-muted-foreground" role="status">
          Placeholder — owned by W-lists.
        </p>
      </section>

      <section
        aria-label="Tables"
        className="space-y-8"
        data-teaching-ui-harness-section="tables"
      >
        <header className="space-y-2">
          <h2 className="text-lg font-medium">Tables</h2>
          <p className="text-sm text-muted-foreground">
            Fixture orchestrators + attribute defs exercising facet filters,
            sort, column picker, entity-row table, and transposed feature
            matrix.
          </p>
        </header>

        <div
          className="flex flex-wrap gap-3"
          data-teaching-ui-harness-focus-controls=""
        >
          <label className="flex flex-col gap-1 text-sm">
            <span>Focus entity row</span>
            <select
              aria-label="Focus entity row"
              className="h-8 rounded-md border border-border bg-background px-2"
              onChange={(event) =>
                setFocusRowId(event.target.value || undefined)
              }
              value={focusRowId ?? ""}
            >
              <option value="">None</option>
              {FIXTURE_ORCHESTRATORS.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Focus matrix column</span>
            <select
              aria-label="Focus matrix column"
              className="h-8 rounded-md border border-border bg-background px-2"
              onChange={(event) =>
                setFocusColumnId(event.target.value || undefined)
              }
              value={focusColumnId ?? ""}
            >
              <option value="">None</option>
              {FIXTURE_ORCHESTRATORS.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Focus matrix attribute row</span>
            <select
              aria-label="Focus matrix attribute row"
              className="h-8 rounded-md border border-border bg-background px-2"
              onChange={(event) =>
                setFocusAttributeRowId(event.target.value || undefined)
              }
              value={focusAttributeRowId ?? ""}
            >
              <option value="">None</option>
              {FIXTURE_ATTRIBUTE_DEFS.map((def) => (
                <option key={def.id} value={def.id}>
                  {FIXTURE_ATTRIBUTE_LABELS[def.id] ?? def.labelKey}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-3" data-teaching-ui-harness-demo="entity-table">
          <h3 className="text-base font-medium">FilterableSortableTable</h3>
          <FilterableSortableTable
            ariaLabel="Fixture orchestrator entity table"
            attributeDefs={FIXTURE_ATTRIBUTE_DEFS}
            columns={ENTITY_COLUMNS}
            emptyMessage="No orchestrators match the current filters."
            filters={entityFilters}
            focusRowId={focusRowId}
            getAttributeValue={getFixtureOrchestratorAttributeValue}
            labels={FIXTURE_ATTRIBUTE_LABELS}
            onFiltersChange={setEntityFilters}
            onSortChange={(attributeId, direction) => {
              setEntitySortAttributeId(attributeId);
              setEntitySortDirection(direction);
            }}
            rows={entityRows}
            sortAttributeId={entitySortAttributeId}
            sortDirection={entitySortDirection}
          />
        </div>

        <div
          className="space-y-3"
          data-teaching-ui-harness-demo="feature-matrix"
        >
          <h3 className="text-base font-medium">OrchestratorFeatureMatrix</h3>
          <OrchestratorFeatureMatrix
            ariaLabel="Fixture orchestrator feature matrix"
            attributeDefs={FIXTURE_ATTRIBUTE_DEFS}
            emptyMessage="No orchestrators match the current filters."
            filters={matrixFilters}
            focusColumnId={focusColumnId}
            focusRowId={focusAttributeRowId}
            labels={FIXTURE_ATTRIBUTE_LABELS}
            onFiltersChange={setMatrixFilters}
            onSortChange={(attributeId, direction) => {
              setMatrixSortAttributeId(attributeId);
              setMatrixSortDirection(direction);
            }}
            onVisibleOrchestratorIdsChange={setVisibleOrchestratorIds}
            orchestrators={FIXTURE_ORCHESTRATORS}
            sortAttributeId={matrixSortAttributeId}
            sortDirection={matrixSortDirection}
            visibleOrchestratorIds={visibleOrchestratorIds}
          />
        </div>
      </section>
    </main>
  );
}
