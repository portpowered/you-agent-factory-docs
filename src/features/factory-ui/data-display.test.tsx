import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  CodePanel,
  DataTable,
  type DataTableColumn,
  FACTORY_UI_DATA_DISPLAY_CATEGORY,
} from "@/features/factory-ui/data-display";

afterEach(() => {
  cleanup();
});

type FixtureRow = {
  id: string;
  name: string;
  score: number;
};

const fixtureColumns: DataTableColumn<FixtureRow>[] = [
  {
    cell: (row) => row.name,
    header: "Name",
    id: "name",
  },
  {
    cell: (row) => String(row.score),
    header: "Score",
    id: "score",
  },
];

const fixtureRows: FixtureRow[] = [
  { id: "row-a", name: "Alpha", score: 4 },
  { id: "row-b", name: "Beta", score: 7 },
];

describe("factory-ui data-display wrappers", () => {
  test("re-exports the package data-display category identifier", () => {
    expect(FACTORY_UI_DATA_DISPLAY_CATEGORY).toBe("data-display");
  });

  test("renders DataTable with fixture columns and rows", () => {
    render(
      <DataTable
        ariaLabel="Factory data table fixture"
        columns={fixtureColumns}
        data={fixtureRows}
        getRowKey={(row) => row.id}
      />,
    );

    expect(
      screen.getByRole("table", { name: "Factory data table fixture" }),
    ).toBeTruthy();
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Score")).toBeTruthy();
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  test("renders DataTable empty state with accessible status", () => {
    render(
      <DataTable
        ariaLabel="Empty data table fixture"
        columns={fixtureColumns}
        data={[]}
        emptyMessage="No harness matrix rows are available for this fixture."
        getRowKey={(row) => row.id}
        state="empty"
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toBeTruthy();
    expect(
      screen.getByText(
        "No harness matrix rows are available for this fixture.",
      ),
    ).toBeTruthy();
  });

  test("renders DataTable error state with accessible alert", () => {
    render(
      <DataTable
        ariaLabel="Error data table fixture"
        columns={fixtureColumns}
        data={[]}
        errorMessage="Fixture harness matrix failed to load."
        getRowKey={(row) => row.id}
        state="error"
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
    expect(
      screen.getByText("Fixture harness matrix failed to load."),
    ).toBeTruthy();
  });

  test("renders CodePanel with fixture code content", () => {
    render(
      <CodePanel data-testid="factory-code-panel">
        {`you docs agents\nbun run typecheck`}
      </CodePanel>,
    );

    const panel = screen.getByTestId("factory-code-panel");
    expect(panel.tagName).toBe("PRE");
    expect(panel.textContent).toContain("you docs agents");
    expect(panel.textContent).toContain("bun run typecheck");
  });
});
