/**
 * Render proof for the page-local CLI command index DataTable.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { CliCommandIndex } from "./CliCommandIndex";

afterEach(() => {
  cleanup();
});

describe("CliCommandIndex", () => {
  test("renders structured command rows with purpose and running-factory columns", () => {
    render(<CliCommandIndex />);

    const table = screen.getByRole("table", {
      name: "CLI command reference index",
    });
    expect(table).toBeTruthy();
    expect(screen.getByTestId("cli-command-index")).toBeTruthy();

    const queries = within(table);
    expect(queries.getByRole("columnheader", { name: "Command" })).toBeTruthy();
    expect(queries.getByRole("columnheader", { name: "Purpose" })).toBeTruthy();
    expect(
      queries.getByRole("columnheader", {
        name: "Factory must already be running?",
      }),
    ).toBeTruthy();

    for (const command of [
      "you",
      "you run --dir <factory>",
      "you submit",
      "you submit batch",
      "you session list",
      "you work list / you work show",
      "you docs / you docs <topic>",
    ]) {
      expect(queries.getByRole("cell", { name: command })).toBeTruthy();
    }

    expect(
      queries.getAllByRole("cell", { name: "Yes" }).length,
    ).toBeGreaterThan(0);
    expect(
      queries.getByRole("cell", {
        name: "Start the default local factory and dashboard from the current project.",
      }),
    ).toBeTruthy();
    expect(
      queries.getAllByRole("cell", {
        name: "No — this starts the runtime.",
      }).length,
    ).toBeGreaterThan(0);
    expect(queries.getAllByRole("row").length).toBe(12);
  });
});
