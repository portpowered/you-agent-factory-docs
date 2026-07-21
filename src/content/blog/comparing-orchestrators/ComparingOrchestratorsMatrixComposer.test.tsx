/**
 * Interaction proof for the page-local comparing-orchestrators matrix composer.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type { AttributeDef, OrchestratorRecord } from "@/features/teaching-ui";
import { ComparingOrchestratorsMatrixComposer } from "./ComparingOrchestratorsMatrixComposer";

afterEach(() => {
  cleanup();
});

const attributeDefs: AttributeDef[] = [
  {
    id: "attr.open-source",
    labelKey: "attr.openSource",
    type: "boolean",
    filterable: true,
    sortable: true,
    order: 1,
  },
  {
    id: "attr.license",
    labelKey: "attr.license",
    type: "single-tag",
    tagEnum: ["mit", "apache-2.0", "proprietary"],
    filterable: true,
    sortable: true,
    order: 2,
  },
  {
    id: "attr.capabilities",
    labelKey: "attr.capabilities",
    type: "multi-tag",
    tagEnum: ["loops", "worktrees", "mcp", "persistence"],
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
      "attr.capabilities": ["loops", "mcp"],
    },
  },
  {
    id: "orch-beta",
    kind: "orchestrator",
    name: "Beta",
    attributes: {
      "attr.open-source": false,
      "attr.license": "apache-2.0",
      "attr.capabilities": ["loops", "worktrees"],
    },
  },
  {
    id: "orch-gamma",
    kind: "orchestrator",
    name: "Gamma",
    attributes: {
      "attr.open-source": true,
      "attr.license": "mit",
      "attr.capabilities": ["loops", "worktrees", "mcp"],
    },
  },
];

const ARIA_LABEL = "Comparing orchestrators fixture matrix";

function renderComposer(
  props: Partial<
    ComponentProps<typeof ComparingOrchestratorsMatrixComposer>
  > = {},
) {
  return render(
    <ComparingOrchestratorsMatrixComposer
      ariaLabel={ARIA_LABEL}
      attributeDefs={attributeDefs}
      labels={hostLabels}
      orchestrators={fixtureOrchestrators}
      {...props}
    />,
  );
}

function matrixTable() {
  return screen.getByRole("table", { name: ARIA_LABEL });
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

describe("ComparingOrchestratorsMatrixComposer", () => {
  test("renders transposed matrix with orchestrator columns and attribute rows", () => {
    renderComposer();

    expect(screen.getByTestId("comparing-orchestrators-matrix")).toBeTruthy();
    expect(
      document.querySelector("[data-orchestrator-feature-matrix]"),
    ).toBeTruthy();
    expect(document.querySelector("[data-matrix-column-picker]")).toBeTruthy();
    expect(
      screen.getByRole("group", { name: "Attribute filters" }),
    ).toBeTruthy();

    expect(headerLabels()).toEqual(["Attribute", "Alpha", "Beta", "Gamma"]);
    expect(attributeRowLabels()).toEqual([
      "Open source",
      "License",
      "Capabilities",
    ]);
  });

  test("column visibility change updates visible orchestrator columns", async () => {
    const user = userEvent.setup();
    renderComposer();

    expect(headerLabels()).toContain("Beta");
    await user.click(screen.getByRole("checkbox", { name: "Beta" }));
    expect(headerLabels()).toEqual(["Attribute", "Alpha", "Gamma"]);
    expect(headerLabels()).not.toContain("Beta");
  });

  test("AND multi-tag filter keeps only orchestrators that include every selected tag", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByRole("checkbox", { name: "loops" }));
    await user.click(screen.getByRole("checkbox", { name: "worktrees" }));

    // Alpha lacks worktrees → excluded; Beta + Gamma remain.
    expect(headerLabels()).toEqual(["Attribute", "Beta", "Gamma"]);
    expect(headerLabels()).not.toContain("Alpha");
  });

  test("sort change reorders orchestrator columns by the chosen attribute", async () => {
    const user = userEvent.setup();
    renderComposer({
      initialSortAttributeId: "attr.open-source",
      initialSortDirection: "asc",
    });

    // false (0) before true (1): Beta, then Alpha / Gamma in input order.
    expect(headerLabels()).toEqual(["Attribute", "Beta", "Alpha", "Gamma"]);

    await user.selectOptions(screen.getByLabelText("Direction"), "desc");
    expect(headerLabels()).toEqual(["Attribute", "Alpha", "Gamma", "Beta"]);
  });

  test("focus column accents the focused entity and mutes sibling columns", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.selectOptions(
      screen.getByLabelText("Focus column"),
      "orch-beta",
    );

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
  });

  test("focus row accents the focused attribute and mutes sibling rows", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.selectOptions(
      screen.getByLabelText("Focus row"),
      "attr.license",
    );

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

  test("empty column selection shows an accessible empty state", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByRole("checkbox", { name: "Alpha" }));
    await user.click(screen.getByRole("checkbox", { name: "Beta" }));
    await user.click(screen.getByRole("checkbox", { name: "Gamma" }));

    const status = screen.getByRole("status");
    expect(status.textContent).toContain(
      "No orchestrators match the current filters and column selection.",
    );
  });
});
