import {
  DataTable,
  type DataTableColumn,
} from "@/features/factory-ui/data-display";
import matrixData from "./matrix.json";

type HarnessId = "claude" | "codex" | "opencode" | "pi" | "cursor" | "agy";

type SupportValue = "yes" | "no" | "partial" | "n/a";

type MatrixFeatureRow = {
  id: string;
  feature: string;
  claude: SupportValue;
  codex: SupportValue;
  opencode: SupportValue;
  pi: SupportValue;
  cursor: SupportValue;
  agy: SupportValue;
};

const HARNESS_IDS = [
  "claude",
  "codex",
  "opencode",
  "pi",
  "cursor",
  "agy",
] as const satisfies readonly HarnessId[];

/** Wide matrix minimum width; pair with the overflow-x scroll wrapper. */
const MATRIX_TABLE_MIN_WIDTH_CLASS = "min-w-2xl";

function isSupportValue(value: unknown): value is SupportValue {
  return (
    value === "yes" || value === "no" || value === "partial" || value === "n/a"
  );
}

function loadMatrixRows():
  | { state: "success"; rows: MatrixFeatureRow[] }
  | { state: "empty" }
  | { state: "error" } {
  const features = matrixData.features;
  if (!Array.isArray(features) || features.length === 0) {
    return { state: "empty" };
  }

  const rows: MatrixFeatureRow[] = [];
  for (const feature of features) {
    if (
      typeof feature?.id !== "string" ||
      typeof feature?.label !== "string" ||
      typeof feature?.cells !== "object" ||
      feature.cells === null
    ) {
      return { state: "error" };
    }

    const cells = feature.cells as Record<string, unknown>;
    const row: MatrixFeatureRow = {
      id: feature.id,
      feature: feature.label,
      claude: "n/a",
      codex: "n/a",
      opencode: "n/a",
      pi: "n/a",
      cursor: "n/a",
      agy: "n/a",
    };

    for (const harnessId of HARNESS_IDS) {
      const value = cells[harnessId];
      if (!isSupportValue(value)) {
        return { state: "error" };
      }
      row[harnessId] = value;
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    return { state: "empty" };
  }

  return { state: "success", rows };
}

function buildColumns(): DataTableColumn<MatrixFeatureRow>[] {
  const harnessColumns: DataTableColumn<MatrixFeatureRow>[] =
    matrixData.harnesses.map((harness) => ({
      id: harness.id,
      header: harness.label,
      cell: (row) => row[harness.id as HarnessId],
    }));

  return [
    {
      id: "feature",
      header: matrixData.featureColumnHeader,
      cell: (row) => row.feature,
    },
    ...harnessColumns,
  ];
}

/**
 * Page-local feature × harness support matrix for documentation/harness-support.
 * Column definitions and row data stay page-owned via colocated matrix.json.
 */
export function HarnessSupportMatrix() {
  const loaded = loadMatrixRows();
  const columns = buildColumns();

  if (loaded.state === "error") {
    return (
      <div
        className="my-6 overflow-x-auto"
        data-harness-support-matrix=""
        data-testid="harness-support-matrix"
      >
        <DataTable
          ariaLabel={matrixData.ariaLabel}
          columns={columns}
          data={[]}
          errorMessage={matrixData.errorMessage}
          getRowKey={(row) => row.id}
          state="error"
          tableClassName={MATRIX_TABLE_MIN_WIDTH_CLASS}
        />
      </div>
    );
  }

  if (loaded.state === "empty") {
    return (
      <div
        className="my-6 overflow-x-auto"
        data-harness-support-matrix=""
        data-testid="harness-support-matrix"
      >
        <DataTable
          ariaLabel={matrixData.ariaLabel}
          columns={columns}
          data={[]}
          emptyMessage={matrixData.emptyMessage}
          getRowKey={(row) => row.id}
          state="empty"
          tableClassName={MATRIX_TABLE_MIN_WIDTH_CLASS}
        />
      </div>
    );
  }

  return (
    <div
      className="my-6 overflow-x-auto"
      data-harness-support-matrix=""
      data-testid="harness-support-matrix"
    >
      <DataTable
        ariaLabel={matrixData.ariaLabel}
        columns={columns}
        data={loaded.rows}
        emptyMessage={matrixData.emptyMessage}
        getRowKey={(row) => row.id}
        state="success"
        tableClassName={MATRIX_TABLE_MIN_WIDTH_CLASS}
      />
    </div>
  );
}
