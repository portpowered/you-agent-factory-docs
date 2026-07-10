/**
 * Render proof for the post-local bottlenecks stage-throughput chart.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { BottlenecksStageThroughputChart } from "./BottlenecksStageThroughputChart";

afterEach(() => {
  cleanup();
});

describe("BottlenecksStageThroughputChart", () => {
  test("renders a titled stage-throughput chart with axes and legend", () => {
    render(<BottlenecksStageThroughputChart />);

    const chart = screen.getByRole("img", {
      name: "Stage capacity vs end-to-end throughput (items per interval)",
    });
    expect(chart.getAttribute("data-chart-container")).toBe("");
    expect(
      screen.getByTestId("bottlenecks-stage-throughput-chart"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Stage capacity vs end-to-end throughput (items per interval)",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/X axis: Factory stage\. Y axis: Items per interval/i),
    ).toBeTruthy();

    const legend = chart.querySelector(
      "[data-bottlenecks-stage-throughput-legend]",
    );
    expect(legend).toBeTruthy();
    const legendQueries = within(legend as HTMLElement);
    expect(legendQueries.getByText("Stage capacity")).toBeTruthy();
    expect(legendQueries.getByText("End-to-end throughput")).toBeTruthy();
    expect(
      screen.getByText(/Harness capacity is the scarce stage/i),
    ).toBeTruthy();
  });
});
