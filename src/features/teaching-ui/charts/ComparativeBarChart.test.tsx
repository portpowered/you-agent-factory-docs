import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ComparativeBarChart } from "./ComparativeBarChart";
import { COMPARATIVE_CHART_FOCUS_COLORS } from "./focus-colors";

afterEach(() => {
  cleanup();
});

const fixtureCategories = ["Input", "Output"];
const fixtureSeries = [
  { id: "model-a", label: "Model A", values: [12, 8] },
  { id: "model-b", label: "Model B", values: [9, 11] },
];

const CHART_TITLE = "Comparative model token cost";

describe("ComparativeBarChart", () => {
  test("exposes the required title as the chart accessible name", () => {
    render(
      <ComparativeBarChart
        categories={fixtureCategories}
        series={fixtureSeries}
        title={CHART_TITLE}
        xLabel="Token bucket"
        yLabel="Cost"
      />,
    );

    expect(screen.getByRole("img", { name: CHART_TITLE })).toBeTruthy();
    expect(screen.getByText(CHART_TITLE)).toBeTruthy();
    expect(screen.getByText("Model A")).toBeTruthy();
    expect(screen.getByText("Model B")).toBeTruthy();
    expect(
      screen.getByText("X axis: Token bucket. Y axis: Cost."),
    ).toBeTruthy();
  });

  test("applies accent and muted series colors when focusSeriesId is set", () => {
    render(
      <ComparativeBarChart
        categories={fixtureCategories}
        focusSeriesId="model-a"
        series={fixtureSeries}
        title={CHART_TITLE}
      />,
    );

    const chart = screen.getByRole("img", { name: CHART_TITLE });
    expect(chart.style.getPropertyValue("--color-model-a")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(chart.style.getPropertyValue("--color-model-b")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );
  });

  test("renders ChartStatePanel for non-success states", () => {
    const { rerender } = render(
      <ComparativeBarChart
        categories={fixtureCategories}
        series={fixtureSeries}
        state="loading"
        title={CHART_TITLE}
      />,
    );

    expect(screen.getByRole("status").getAttribute("data-chart-state")).toBe(
      "loading",
    );
    expect(screen.queryByRole("img", { name: CHART_TITLE })).toBeNull();

    rerender(
      <ComparativeBarChart
        categories={fixtureCategories}
        series={fixtureSeries}
        state="empty"
        title={CHART_TITLE}
      />,
    );
    expect(screen.getByRole("status").getAttribute("data-chart-state")).toBe(
      "empty",
    );

    rerender(
      <ComparativeBarChart
        categories={fixtureCategories}
        series={fixtureSeries}
        state="error"
        title={CHART_TITLE}
      />,
    );
    expect(screen.getByRole("alert").getAttribute("data-chart-state")).toBe(
      "error",
    );
  });
});
