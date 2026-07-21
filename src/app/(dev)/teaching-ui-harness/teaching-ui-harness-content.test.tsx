import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { focusFill, mutedFill } from "@/features/teaching-ui";
import { TeachingUiHarnessContent } from "./teaching-ui-harness-content";

afterEach(() => {
  cleanup();
});

describe("TeachingUiHarnessContent", () => {
  test("renders Chart/List placeholders and filled Table section", () => {
    const { container } = render(<TeachingUiHarnessContent />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Teaching UI harness" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Chart" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "List" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Table" }),
    ).toBeTruthy();

    expect(
      screen.getByTestId("teaching-ui-harness-chart-placeholder"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teaching-ui-harness-list-placeholder"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("teaching-ui-harness-table-placeholder"),
    ).toBeNull();

    const tableSection = container.querySelector(
      '[data-teaching-ui-harness-section="table"]',
    );
    expect(tableSection).toBeTruthy();
    expect(
      tableSection?.querySelector("[data-filterable-sortable-table]"),
    ).toBeTruthy();
    expect(
      tableSection?.querySelector("[data-orchestrator-feature-matrix]"),
    ).toBeTruthy();
    expect(
      tableSection?.querySelector("[data-matrix-column-picker]"),
    ).toBeTruthy();
  });

  test("focus demo shows accent and muted swatches via public helpers", () => {
    render(<TeachingUiHarnessContent />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Focus demo" }),
    ).toBeTruthy();

    const accent = screen.getByTestId(
      "teaching-ui-harness-focus-swatch-primary-series",
    );
    const muted = screen.getByTestId(
      "teaching-ui-harness-focus-swatch-secondary-series",
    );

    const accentSwatch = accent.querySelector("[data-focus-state='accent']");
    const mutedSwatch = muted.querySelector("[data-focus-state='muted']");

    expect(accentSwatch).toBeTruthy();
    expect(mutedSwatch).toBeTruthy();
    expect((accentSwatch as HTMLElement).style.backgroundColor).toBe(focusFill);
    expect((mutedSwatch as HTMLElement).style.backgroundColor).toBe(mutedFill);
    expect(accent.textContent).toContain("(accent)");
    expect(muted.textContent).toContain("(muted)");
  });

  test("column picker hides an orchestrator column in the matrix", async () => {
    const user = userEvent.setup();
    const { container } = render(<TeachingUiHarnessContent />);
    const matrixDemo = container.querySelector(
      '[data-teaching-ui-harness-demo="feature-matrix"]',
    );
    expect(matrixDemo).toBeTruthy();

    const matrixTable = within(matrixDemo as HTMLElement).getByRole("table", {
      name: "Fixture orchestrator feature matrix",
    });
    expect(within(matrixTable).getByText("Beta")).toBeTruthy();

    const betaCheckbox = within(matrixDemo as HTMLElement).getByRole(
      "checkbox",
      { name: "Beta" },
    );
    await user.click(betaCheckbox);

    expect(within(matrixTable).queryByText("Beta")).toBeNull();
    expect(within(matrixTable).getByText("Alpha")).toBeTruthy();
    expect(within(matrixTable).getByText("Gamma")).toBeTruthy();
  });

  test("entity-table multi-tag AND filter narrows visible rows", async () => {
    const user = userEvent.setup();
    const { container } = render(<TeachingUiHarnessContent />);
    const entityDemo = container.querySelector(
      '[data-teaching-ui-harness-demo="entity-table"]',
    );
    expect(entityDemo).toBeTruthy();

    const entityTable = within(entityDemo as HTMLElement).getByRole("table", {
      name: "Fixture orchestrator entity table",
    });
    expect(within(entityTable).getByText("Alpha")).toBeTruthy();
    expect(within(entityTable).getByText("Beta")).toBeTruthy();

    const worktree = within(entityDemo as HTMLElement).getByRole("checkbox", {
      name: "worktree",
    });
    const harness = within(entityDemo as HTMLElement).getByRole("checkbox", {
      name: "harness",
    });
    await user.click(worktree);
    await user.click(harness);

    expect(within(entityTable).getByText("Gamma")).toBeTruthy();
    expect(within(entityTable).queryByText("Alpha")).toBeNull();
    expect(within(entityTable).queryByText("Beta")).toBeNull();
  });
});
