/**
 * Render proof for the post-local agent-factories comparison DataTable.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  AGENT_FACTORIES_COMPARISON_TABLE_LABEL,
  AgentFactoriesComparisonTable,
  agentFactoryComparisonRows,
} from "./AgentFactoriesComparisonTable";

afterEach(() => {
  cleanup();
});

describe("AgentFactoriesComparisonTable", () => {
  test("renders accessible DataTable with system rows and dimension columns", () => {
    render(<AgentFactoriesComparisonTable />);

    const table = screen.getByRole("table", {
      name: AGENT_FACTORIES_COMPARISON_TABLE_LABEL,
    });
    expect(table).toBeTruthy();
    expect(screen.getByTestId("agent-factories-comparison-table")).toBeTruthy();

    const queries = within(table);
    expect(queries.getByText("System")).toBeTruthy();
    expect(queries.getByText("Recursion, fan-in, stateful")).toBeTruthy();
    expect(queries.getByText("Custom workflows")).toBeTruthy();
    expect(queries.getByText("Agent harness support")).toBeTruthy();
    expect(queries.getByText("File-first / check-in files")).toBeTruthy();
    expect(queries.getByText("Durable workflows")).toBeTruthy();
    expect(queries.getByText("Relatively stable")).toBeTruthy();

    for (const row of agentFactoryComparisonRows) {
      expect(queries.getByText(row.system)).toBeTruthy();
    }
  });
});
