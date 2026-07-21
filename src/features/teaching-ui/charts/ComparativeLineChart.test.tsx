import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ComparativeLineChart } from "./ComparativeLineChart";
import { COMPARATIVE_CHART_FOCUS_COLORS } from "./focus-colors";

afterEach(() => {
  cleanup();
});

const fixturePoints = [
  { tokens: 1_000, "model-a": 12, "model-b": 9 },
  { tokens: 2_000, "model-a": 18, "model-b": 14 },
  { tokens: 3_000, "model-a": 22, "model-b": 19 },
];

const fixtureSeries = [
  { id: "model-a", label: "Model A" },
  { id: "model-b", label: "Model B" },
];

const CHART_TITLE = "Comparative model cost vs tokens";

describe("ComparativeLineChart", () => {
  test("exposes the required title as the chart accessible name", () => {
    render(
      <ComparativeLineChart
        points={fixturePoints}
        series={fixtureSeries}
        title={CHART_TITLE}
        xKey="tokens"
        xLabel="Tokens"
        yLabel="Cost"
      />,
    );

    expect(screen.getByRole("img", { name: CHART_TITLE })).toBeTruthy();
    expect(screen.getByText(CHART_TITLE)).toBeTruthy();
    expect(screen.getByText("Model A")).toBeTruthy();
    expect(screen.getByText("Model B")).toBeTruthy();
    expect(screen.getByText("X axis: Tokens. Y axis: Cost.")).toBeTruthy();
  });

  test("applies accent and muted series colors when focusSeriesId is set", () => {
    render(
      <ComparativeLineChart
        focusSeriesId="model-a"
        points={fixturePoints}
        series={fixtureSeries}
        title={CHART_TITLE}
        xKey="tokens"
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

  test("uses default accent presentation when focusSeriesId is omitted", () => {
    render(
      <ComparativeLineChart
        points={fixturePoints}
        series={fixtureSeries}
        title={CHART_TITLE}
        xKey="tokens"
      />,
    );

    const chart = screen.getByRole("img", { name: CHART_TITLE });
    expect(chart.style.getPropertyValue("--color-model-a")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(chart.style.getPropertyValue("--color-model-b")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
  });

  test("renders ChartStatePanel for non-success states", () => {
    const { rerender } = render(
      <ComparativeLineChart
        points={fixturePoints}
        series={fixtureSeries}
        state="loading"
        title={CHART_TITLE}
        xKey="tokens"
      />,
    );

    expect(screen.getByRole("status").getAttribute("data-chart-state")).toBe(
      "loading",
    );
    expect(screen.queryByRole("img", { name: CHART_TITLE })).toBeNull();

    rerender(
      <ComparativeLineChart
        points={fixturePoints}
        series={fixtureSeries}
        state="empty"
        title={CHART_TITLE}
        xKey="tokens"
      />,
    );
    expect(screen.getByRole("status").getAttribute("data-chart-state")).toBe(
      "empty",
    );

    rerender(
      <ComparativeLineChart
        points={fixturePoints}
        series={fixtureSeries}
        state="error"
        title={CHART_TITLE}
        xKey="tokens"
      />,
    );
    expect(screen.getByRole("alert").getAttribute("data-chart-state")).toBe(
      "error",
    );
  });
});
