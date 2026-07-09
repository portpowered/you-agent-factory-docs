import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartStatePanel,
  FACTORY_UI_CHARTS_CATEGORY,
} from "@/features/factory-ui/charts";

afterEach(() => {
  cleanup();
});

const fixtureConfig: ChartConfig = {
  alpha: { color: "#3366cc", label: "Alpha series" },
  beta: { color: "#cc6633", label: "Beta series" },
};

const fixtureData = [
  { alpha: 4, beta: 2, tick: 1 },
  { alpha: 6, beta: 3, tick: 2 },
  { alpha: 5, beta: 4, tick: 3 },
];

describe("factory-ui charts wrappers", () => {
  test("re-exports the package charts category identifier", () => {
    expect(FACTORY_UI_CHARTS_CATEGORY).toBe("charts");
  });

  test("renders ChartContainer with fixture config and data", () => {
    render(
      <ChartContainer
        config={fixtureConfig}
        title="Factory chart container fixture"
      >
        <LineChart data={fixtureData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="tick" />
          <YAxis />
          <Line dataKey="alpha" stroke="var(--color-alpha)" type="monotone" />
          <Line dataKey="beta" stroke="var(--color-beta)" type="monotone" />
        </LineChart>
      </ChartContainer>,
    );

    const chart = screen.getByRole("img", {
      name: "Factory chart container fixture",
    });
    expect(chart.getAttribute("data-chart-container")).toBe("");
    expect(chart.getAttribute("data-chart-presentation")).toBe("standalone");
  });

  test("renders ChartStatePanel empty state with accessible status", () => {
    render(
      <ChartStatePanel
        description="No series rows are available for this fixture."
        status="empty"
        title="Empty chart fixture"
      />,
    );

    const panel = screen.getByRole("status");
    expect(panel.getAttribute("data-chart-state")).toBe("empty");
    expect(screen.getByText("Empty chart fixture")).toBeTruthy();
    expect(
      screen.getByText("No series rows are available for this fixture."),
    ).toBeTruthy();
  });

  test("renders ChartStatePanel error state with accessible alert", () => {
    render(
      <ChartStatePanel
        description="Fixture chart metrics failed to load."
        status="error"
        title="Error chart fixture"
      />,
    );

    const panel = screen.getByRole("alert");
    expect(panel.getAttribute("data-chart-state")).toBe("error");
    expect(screen.getByText("Error chart fixture")).toBeTruthy();
    expect(
      screen.getByText("Fixture chart metrics failed to load."),
    ).toBeTruthy();
  });
});
