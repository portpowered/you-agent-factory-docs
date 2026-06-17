import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  CHART_EXAMPLE_INTRO,
  CHART_EXAMPLE_TITLE,
  LINE_CHART_SECTION_HEADING,
} from "../../src/lib/docs-charts";

mock.module("recharts", () => ({
  ResponsiveContainer: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="responsive-container">{children}</div>,
}));

mock.module("recharts/es6/chart/LineChart", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <svg aria-hidden="true" data-testid="line-chart">
      {children}
    </svg>
  ),
}));

mock.module("recharts/es6/cartesian/CartesianGrid", () => ({
  CartesianGrid: () => null,
}));

mock.module("recharts/es6/cartesian/XAxis", () => ({
  XAxis: () => null,
}));

mock.module("recharts/es6/cartesian/YAxis", () => ({
  YAxis: () => null,
}));

mock.module("recharts/es6/cartesian/Line", () => ({
  Line: () => null,
}));

describe("chart example surface", () => {
  test("renders the reviewer-visible line chart example with identifiable framing", async () => {
    const { ChartExample } = await import(
      "../../src/components/docs/chart-example"
    );

    render(<ChartExample />);

    expect(
      screen.getByRole("heading", { level: 1, name: CHART_EXAMPLE_TITLE }),
    ).toBeTruthy();
    expect(screen.getByText(CHART_EXAMPLE_INTRO)).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: LINE_CHART_SECTION_HEADING,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("figure", { name: "Review throughput by hour" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "From 09:00 to 14:00 UTC, completed review passes rise from 42 to 121 while review-ready findings rise from 30 to 102.",
      ),
    ).toBeTruthy();
  });
});
