import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AttributeFacetBar,
  FilterableSortableTable,
  OrchestratorFeatureMatrix,
} from "@/features/teaching-ui";
import { TeachingUiHarnessView } from "./teaching-ui-harness-view";

afterEach(() => {
  cleanup();
});

describe("teaching-ui public barrel", () => {
  test("re-exports FilterableSortableTable, AttributeFacetBar, and OrchestratorFeatureMatrix", () => {
    expect(typeof FilterableSortableTable).toBe("function");
    expect(typeof AttributeFacetBar).toBe("function");
    expect(typeof OrchestratorFeatureMatrix).toBe("function");
  });
});

describe("TeachingUiHarnessView", () => {
  test("renders table section with entity table, matrix, facets, and column picker", () => {
    const { container } = render(<TeachingUiHarnessView />);

    expect(container.querySelector("[data-teaching-ui-harness]")).toBeTruthy();
    expect(
      container.querySelector('[data-teaching-ui-harness-section="tables"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-teaching-ui-harness-section="charts"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-teaching-ui-harness-section="lists"]'),
    ).toBeTruthy();

    const entityDemo = container.querySelector(
      '[data-teaching-ui-harness-demo="entity-table"]',
    );
    const matrixDemo = container.querySelector(
      '[data-teaching-ui-harness-demo="feature-matrix"]',
    );
    expect(entityDemo).toBeTruthy();
    expect(matrixDemo).toBeTruthy();
    expect(
      entityDemo?.querySelector("[data-filterable-sortable-table]"),
    ).toBeTruthy();
    expect(
      matrixDemo?.querySelector("[data-orchestrator-feature-matrix]"),
    ).toBeTruthy();
    expect(
      entityDemo?.querySelector("[data-attribute-facet-bar]"),
    ).toBeTruthy();
    expect(
      matrixDemo?.querySelector("[data-matrix-column-picker]"),
    ).toBeTruthy();

    expect(
      screen.getByRole("table", { name: "Fixture orchestrator entity table" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("table", {
        name: "Fixture orchestrator feature matrix",
      }),
    ).toBeTruthy();
  });

  test("column picker hides an orchestrator column in the matrix", async () => {
    const user = userEvent.setup();
    const { container } = render(<TeachingUiHarnessView />);
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
    const { container } = render(<TeachingUiHarnessView />);
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
