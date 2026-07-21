import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  OrchestratorFeatureMatrix,
  type OrchestratorFeatureMatrixProps,
} from "./OrchestratorFeatureMatrix";
import type {
  AttributeDef,
  AttributeFilterState,
  OrchestratorRecord,
  SortDirection,
} from "./types";

afterEach(() => {
  cleanup();
});

const attributeDefs: AttributeDef[] = [
  {
    id: "attr.open-source",
    labelKey: "attrs.openSource",
    type: "boolean",
    filterable: true,
    sortable: true,
    order: 1,
  },
  {
    id: "attr.license",
    labelKey: "attrs.license",
    type: "single-tag",
    tagEnum: ["mit", "apache-2.0", "proprietary"],
    filterable: true,
    sortable: true,
    order: 2,
  },
  {
    id: "attr.capabilities",
    labelKey: "attrs.capabilities",
    type: "multi-tag",
    tagEnum: ["loop", "worktree", "harness"],
    filterable: true,
    sortable: false,
    order: 3,
  },
];

const hostLabels: Record<string, string> = {
  "attr.open-source": "Open source",
  "attr.license": "License",
  "attr.capabilities": "Capabilities",
};

const fixtureOrchestrators: OrchestratorRecord[] = [
  {
    id: "orch-alpha",
    kind: "orchestrator",
    name: "Alpha",
    attributes: {
      "attr.open-source": true,
      "attr.license": "mit",
      "attr.capabilities": ["loop", "harness"],
    },
  },
  {
    id: "orch-beta",
    kind: "orchestrator",
    name: "Beta",
    attributes: {
      "attr.open-source": false,
      "attr.license": "apache-2.0",
      "attr.capabilities": ["loop", "worktree"],
    },
  },
  {
    id: "orch-gamma",
    kind: "orchestrator",
    name: "Gamma",
    attributes: {
      "attr.open-source": true,
      "attr.license": "mit",
      "attr.capabilities": ["loop", "worktree", "harness"],
    },
  },
];

const allIds = fixtureOrchestrators.map((row) => row.id);

type HarnessProps = Omit<
  OrchestratorFeatureMatrixProps,
  | "orchestrators"
  | "attributeDefs"
  | "visibleOrchestratorIds"
  | "onVisibleOrchestratorIdsChange"
  | "filters"
  | "onFiltersChange"
  | "labels"
  | "ariaLabel"
> & {
  initialFilters?: AttributeFilterState;
  initialVisibleIds?: string[];
  initialSortAttributeId?: string;
  initialSortDirection?: SortDirection;
  onFiltersChange?: (next: AttributeFilterState) => void;
  onVisibleOrchestratorIdsChange?: (ids: string[]) => void;
  onSortChange?: (attributeId: string, direction: SortDirection) => void;
};

function StatefulMatrix(props: HarnessProps) {
  const {
    initialFilters = {},
    initialVisibleIds = allIds,
    initialSortAttributeId,
    initialSortDirection = "asc",
    onFiltersChange,
    onVisibleOrchestratorIdsChange,
    onSortChange,
    ...rest
  } = props;
  const [filters, setFilters] = useState<AttributeFilterState>(initialFilters);
  const [visibleIds, setVisibleIds] = useState(initialVisibleIds);
  const [sortAttributeId, setSortAttributeId] = useState(
    initialSortAttributeId,
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);

  return (
    <OrchestratorFeatureMatrix
      ariaLabel="Orchestrator fixture matrix"
      attributeDefs={attributeDefs}
      filters={filters}
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
      onVisibleOrchestratorIdsChange={(ids) => {
        setVisibleIds(ids);
        onVisibleOrchestratorIdsChange?.(ids);
      }}
      orchestrators={fixtureOrchestrators}
      sortAttributeId={sortAttributeId}
      sortDirection={sortDirection}
      visibleOrchestratorIds={visibleIds}
      {...rest}
    />
  );
}

function matrixTable() {
  return screen.getByRole("table", { name: "Orchestrator fixture matrix" });
}

function headerLabels(): string[] {
  const headerRow = within(matrixTable()).getAllByRole("row")[0];
  if (!headerRow) {
    return [];
  }
  return within(headerRow)
    .getAllByRole("columnheader")
    .map((cell) => cell.textContent ?? "");
}

function attributeRowLabels(): string[] {
  const bodyRows = within(matrixTable()).getAllByRole("row").slice(1);
  return bodyRows.map((row) => {
    const cells = within(row).getAllByRole("cell");
    return cells[0]?.textContent ?? "";
  });
}

describe("OrchestratorFeatureMatrix", () => {
  test("renders transposed layout: M attribute rows × N visible entity columns", () => {
    render(<StatefulMatrix />);

    expect(headerLabels()).toEqual(["Attribute", "Alpha", "Beta", "Gamma"]);
    expect(attributeRowLabels()).toEqual([
      "Open source",
      "License",
      "Capabilities",
    ]);

    const bodyRows = within(matrixTable()).getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(3);

    // Open source row cells for Alpha / Beta / Gamma
    const openSourceCells = within(bodyRows[0] as HTMLElement).getAllByRole(
      "cell",
    );
    expect(openSourceCells.map((cell) => cell.textContent)).toEqual([
      "Open source",
      "true",
      "false",
      "true",
    ]);
  });

  test("column picker show/hide updates visible entity columns", async () => {
    const user = userEvent.setup();
    const onVisible = mock((_ids: string[]) => {});
    render(<StatefulMatrix onVisibleOrchestratorIdsChange={onVisible} />);

    expect(headerLabels()).toContain("Beta");

    const betaCheckbox = screen.getByRole("checkbox", { name: "Beta" });
    await user.click(betaCheckbox);

    expect(onVisible).toHaveBeenCalled();
    expect(headerLabels()).toEqual(["Attribute", "Alpha", "Gamma"]);
    expect(headerLabels()).not.toContain("Beta");

    await user.click(screen.getByRole("checkbox", { name: "Beta" }));
    expect(headerLabels()).toContain("Beta");
  });

  test("AND multi-tag filter removes non-matching entity columns", async () => {
    const user = userEvent.setup();
    render(<StatefulMatrix />);

    await user.click(screen.getByRole("checkbox", { name: "loop" }));
    await user.click(screen.getByRole("checkbox", { name: "worktree" }));

    // Alpha lacks worktree → excluded; Beta + Gamma remain.
    expect(headerLabels()).toEqual(["Attribute", "Beta", "Gamma"]);
    expect(headerLabels()).not.toContain("Alpha");
  });

  test("focusColumnId accents matching column headers/cells and mutes siblings", () => {
    render(<StatefulMatrix focusColumnId="orch-beta" />);

    const headerRow = within(matrixTable()).getAllByRole("row")[0];
    const headers = within(headerRow as HTMLElement).getAllByRole(
      "columnheader",
    );
    const alphaHeader = headers.find((h) => h.textContent === "Alpha");
    const betaHeader = headers.find((h) => h.textContent === "Beta");
    const gammaHeader = headers.find((h) => h.textContent === "Gamma");

    expect(betaHeader?.className).toContain("teaching-ui-focus-accent");
    expect(alphaHeader?.className).toContain("teaching-ui-focus-muted");
    expect(gammaHeader?.className).toContain("teaching-ui-focus-muted");

    const bodyRows = within(matrixTable()).getAllByRole("row").slice(1);
    const firstDataCells = within(bodyRows[0] as HTMLElement).getAllByRole(
      "cell",
    );
    // cells: [Attribute label, Alpha, Beta, Gamma]
    expect(firstDataCells[2]?.className).toContain("teaching-ui-focus-accent");
    expect(firstDataCells[1]?.className).toContain("teaching-ui-focus-muted");
    expect(firstDataCells[3]?.className).toContain("teaching-ui-focus-muted");
  });

  test("focusRowId accents matching attribute row and mutes siblings", () => {
    render(<StatefulMatrix focusRowId="attr.license" />);

    const bodyRows = within(matrixTable()).getAllByRole("row").slice(1);
    const openSource = bodyRows.find((row) =>
      row.textContent?.includes("Open source"),
    );
    const license = bodyRows.find((row) =>
      row.textContent?.includes("License"),
    );
    const capabilities = bodyRows.find((row) =>
      row.textContent?.includes("Capabilities"),
    );

    expect(license?.className).toContain("teaching-ui-focus-accent");
    expect(openSource?.className).toContain("teaching-ui-focus-muted");
    expect(capabilities?.className).toContain("teaching-ui-focus-muted");
  });

  test("column picker checkboxes are keyboard-focusable and labeled", async () => {
    const user = userEvent.setup();
    render(<StatefulMatrix />);

    const alpha = screen.getByRole("checkbox", { name: "Alpha" });
    const beta = screen.getByRole("checkbox", { name: "Beta" });

    expect(alpha).toBeTruthy();
    expect(beta).toBeTruthy();

    alpha.focus();
    expect(document.activeElement).toBe(alpha);

    await user.keyboard(" ");
    expect(headerLabels()).not.toContain("Alpha");

    await user.tab();
    expect(document.activeElement).toBe(beta);
  });

  test("empty filters + column selection show accessible empty status", async () => {
    const user = userEvent.setup();
    render(<StatefulMatrix />);

    await user.click(screen.getByRole("checkbox", { name: "Alpha" }));
    await user.click(screen.getByRole("checkbox", { name: "Beta" }));
    await user.click(screen.getByRole("checkbox", { name: "Gamma" }));

    const status = screen.getByRole("status");
    expect(status.textContent).toContain(
      "No orchestrators match the current filters and column selection.",
    );
  });
});
