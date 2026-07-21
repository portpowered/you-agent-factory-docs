import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { DataTableColumn } from "@/features/factory-ui/data-display";
import {
  FilterableSortableTable,
  type FilterableSortableTableProps,
} from "./FilterableSortableTable";
import type {
  AttributeDef,
  AttributeFilterState,
  SortDirection,
} from "./types";

afterEach(() => {
  cleanup();
});

type FixtureRow = {
  id: string;
  name: string;
  openSource: boolean;
  license: string;
  capabilities: string[];
};

const attributeDefs: AttributeDef[] = [
  {
    id: "attr.open-source",
    labelKey: "attrs.openSource",
    type: "boolean",
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.license",
    labelKey: "attrs.license",
    type: "single-tag",
    tagEnum: ["mit", "apache-2.0", "proprietary"],
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.capabilities",
    labelKey: "attrs.capabilities",
    type: "multi-tag",
    tagEnum: ["loop", "worktree", "harness"],
    filterable: true,
    sortable: false,
  },
];

const hostLabels: Record<string, string> = {
  "attr.open-source": "Open source",
  "attr.license": "License",
  "attr.capabilities": "Capabilities",
};

const fixtureRows: FixtureRow[] = [
  {
    id: "orch-alpha",
    name: "Alpha",
    openSource: true,
    license: "mit",
    capabilities: ["loop", "harness"],
  },
  {
    id: "orch-beta",
    name: "Beta",
    openSource: false,
    license: "apache-2.0",
    capabilities: ["loop", "worktree"],
  },
  {
    id: "orch-gamma",
    name: "Gamma",
    openSource: true,
    license: "mit",
    capabilities: ["loop", "worktree", "harness"],
  },
];

const columns: DataTableColumn<FixtureRow>[] = [
  {
    id: "name",
    header: "Name",
    cell: (row) => row.name,
  },
  {
    id: "license",
    header: "License",
    cell: (row) => row.license,
  },
];

function getAttributeValue(row: FixtureRow, attributeId: string): unknown {
  switch (attributeId) {
    case "attr.open-source":
      return row.openSource;
    case "attr.license":
      return row.license;
    case "attr.capabilities":
      return row.capabilities;
    default:
      return undefined;
  }
}

type HarnessProps = Omit<
  FilterableSortableTableProps<FixtureRow>,
  | "rows"
  | "columns"
  | "attributeDefs"
  | "getAttributeValue"
  | "filters"
  | "onFiltersChange"
  | "emptyMessage"
  | "labels"
  | "ariaLabel"
> & {
  initialFilters?: AttributeFilterState;
  initialSortAttributeId?: string;
  initialSortDirection?: SortDirection;
  onFiltersChange?: (next: AttributeFilterState) => void;
  onSortChange?: (attributeId: string, direction: SortDirection) => void;
};

function StatefulTable(props: HarnessProps) {
  const {
    initialFilters = {},
    initialSortAttributeId = "attr.license",
    initialSortDirection = "asc",
    onFiltersChange,
    onSortChange,
    ...rest
  } = props;
  const [filters, setFilters] = useState<AttributeFilterState>(initialFilters);
  const [sortAttributeId, setSortAttributeId] = useState(
    initialSortAttributeId,
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);

  return (
    <FilterableSortableTable
      ariaLabel="Orchestrator fixture table"
      attributeDefs={attributeDefs}
      columns={columns}
      emptyMessage="No orchestrators match the current filters."
      filters={filters}
      getAttributeValue={getAttributeValue}
      labels={hostLabels}
      onFiltersChange={(next) => {
        setFilters(next);
        onFiltersChange?.(next);
      }}
      onSortChange={(attributeId, direction) => {
        setSortAttributeId(attributeId);
        setSortDirection(direction);
        onSortChange?.(attributeId, direction);
      }}
      rows={fixtureRows}
      sortAttributeId={sortAttributeId}
      sortDirection={sortDirection}
      {...rest}
    />
  );
}

function renderedNames(): string[] {
  const table = screen.getByRole("table", {
    name: "Orchestrator fixture table",
  });
  const bodyRows = within(table).getAllByRole("row").slice(1);
  return bodyRows.map((row) => {
    const cells = within(row).getAllByRole("cell");
    return cells[0]?.textContent ?? "";
  });
}

describe("FilterableSortableTable", () => {
  test("renders entity rows through factory-ui DataTable", () => {
    render(<StatefulTable />);

    expect(
      screen.getByRole("table", { name: "Orchestrator fixture table" }),
    ).toBeTruthy();
    expect(renderedNames()).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  test("filters visible rows via AttributeFacetBar (AND multi-tag)", async () => {
    const user = userEvent.setup();
    render(<StatefulTable />);

    const loop = screen.getByRole("checkbox", { name: "loop" });
    const worktree = screen.getByRole("checkbox", { name: "worktree" });
    await user.click(loop);
    await user.click(worktree);

    expect(renderedNames()).toEqual(["Beta", "Gamma"]);
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  test("sort order is reflected in rendered cells (asc then desc)", async () => {
    const user = userEvent.setup();
    const onSortChange = mock((_id: string, _direction: SortDirection) => {});
    render(
      <StatefulTable
        initialSortAttributeId="attr.license"
        initialSortDirection="asc"
        onSortChange={onSortChange}
      />,
    );

    expect(renderedNames()).toEqual(["Beta", "Alpha", "Gamma"]);

    await user.selectOptions(screen.getByLabelText("Direction"), "desc");

    expect(onSortChange).toHaveBeenCalled();
    expect(renderedNames()).toEqual(["Alpha", "Gamma", "Beta"]);
  });

  test("empty filters show accessible emptyMessage status", async () => {
    const user = userEvent.setup();
    render(<StatefulTable />);

    await user.selectOptions(screen.getByLabelText("Open source"), "false");
    await user.selectOptions(screen.getByLabelText("License"), "mit");

    const status = screen.getByRole("status");
    expect(status.textContent).toContain(
      "No orchestrators match the current filters.",
    );
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.queryByText("Beta")).toBeNull();
  });

  test("focusRowId accents the matching row and mutes siblings", () => {
    render(<StatefulTable focusRowId="orch-beta" />);

    const table = screen.getByRole("table", {
      name: "Orchestrator fixture table",
    });
    const bodyRows = within(table).getAllByRole("row").slice(1);

    const beta = bodyRows.find((row) => row.textContent?.includes("Beta"));
    const alpha = bodyRows.find((row) => row.textContent?.includes("Alpha"));
    const gamma = bodyRows.find((row) => row.textContent?.includes("Gamma"));

    expect(beta?.className).toContain("teaching-ui-focus-accent");
    expect(alpha?.className).toContain("teaching-ui-focus-muted");
    expect(gamma?.className).toContain("teaching-ui-focus-muted");
  });

  test("omitted focusRowId leaves rows neutral", () => {
    render(<StatefulTable />);

    const table = screen.getByRole("table", {
      name: "Orchestrator fixture table",
    });
    const bodyRows = within(table).getAllByRole("row").slice(1);

    for (const row of bodyRows) {
      expect(row.className).toContain("teaching-ui-focus-neutral");
      expect(row.className).not.toContain("teaching-ui-focus-accent");
      expect(row.className).not.toContain("teaching-ui-focus-muted");
    }
  });

  test("sort controls are keyboard-focusable and labeled", async () => {
    const user = userEvent.setup();
    render(<StatefulTable />);

    const sortBy = screen.getByLabelText("Sort by");
    const direction = screen.getByLabelText("Direction");

    await user.tab();
    // Walk until we reach sort controls (facets come first).
    let guard = 0;
    while (document.activeElement !== sortBy && guard < 20) {
      await user.tab();
      guard += 1;
    }
    expect(document.activeElement).toBe(sortBy);

    await user.tab();
    expect(document.activeElement).toBe(direction);
  });
});
