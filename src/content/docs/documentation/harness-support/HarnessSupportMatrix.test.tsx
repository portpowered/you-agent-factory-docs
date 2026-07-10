/**
 * Render proof for the page-local harness support DataTable matrix.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { HarnessSupportMatrix } from "./HarnessSupportMatrix";

afterEach(() => {
  cleanup();
});

describe("HarnessSupportMatrix", () => {
  test("renders all six harness columns and six feature rows", () => {
    render(<HarnessSupportMatrix />);

    const table = screen.getByRole("table", {
      name: "Harness support matrix",
    });
    expect(table).toBeTruthy();
    expect(screen.getByTestId("harness-support-matrix")).toBeTruthy();

    const queries = within(table);
    for (const harness of [
      "claude",
      "codex",
      "opencode",
      "pi",
      "cursor",
      "agy",
    ]) {
      expect(queries.getByRole("columnheader", { name: harness })).toBeTruthy();
    }

    for (const feature of [
      "MCP",
      "Worktrees",
      "Loop",
      "Thinking controls",
      "Open source",
      "External model support",
    ]) {
      expect(queries.getByRole("cell", { name: feature })).toBeTruthy();
    }

    expect(queries.getByRole("columnheader", { name: "Feature" })).toBeTruthy();
    expect(queries.getAllByRole("row")).toHaveLength(7);
  });
});
