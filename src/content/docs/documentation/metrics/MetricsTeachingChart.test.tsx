/**
 * Render proof for the page-local metrics teaching chart.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MetricsTeachingChart } from "./MetricsTeachingChart";

afterEach(() => {
  cleanup();
});

describe("MetricsTeachingChart", () => {
  test("renders a titled time-series chart with axes and series labels", () => {
    render(<MetricsTeachingChart />);

    const chart = screen.getByRole("img", {
      name: "Work-token lifecycle buckets over successive status ticks",
    });
    expect(chart.getAttribute("data-chart-container")).toBe("");
    expect(screen.getByTestId("metrics-teaching-chart")).toBeTruthy();
    expect(
      screen.getByText(
        "Work-token lifecycle buckets over successive status ticks",
      ),
    ).toBeTruthy();
    expect(screen.getByText(/X axis: Status tick/i)).toBeTruthy();
    expect(screen.getByText(/Y axis: Token count/i)).toBeTruthy();

    const legend = chart.querySelector("[data-metrics-teaching-chart-legend]");
    expect(legend).toBeTruthy();
    const legendQueries = within(legend as HTMLElement);
    expect(legendQueries.getByText("Processing")).toBeTruthy();
    expect(legendQueries.getByText("Terminal")).toBeTruthy();
    expect(legendQueries.getByText("Failed")).toBeTruthy();
    expect(
      screen.getByText(/processing drains while terminal grows/i),
    ).toBeTruthy();
  });
});
