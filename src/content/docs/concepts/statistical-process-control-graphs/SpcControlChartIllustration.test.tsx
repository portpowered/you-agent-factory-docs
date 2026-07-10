/**
 * Render proof for the page-local SPC control-chart illustration.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { SpcControlChartIllustration } from "./SpcControlChartIllustration";

afterEach(() => {
  cleanup();
});

describe("SpcControlChartIllustration", () => {
  test("renders a titled control chart with axis and limit cues", () => {
    render(<SpcControlChartIllustration />);

    const chart = screen.getByRole("img", {
      name: "Control chart: goal completions per ten-minute interval",
    });
    expect(chart.getAttribute("data-chart-container")).toBe("");
    expect(screen.getByTestId("spc-control-chart-illustration")).toBeTruthy();
    expect(
      screen.getByText(
        "Control chart: goal completions per ten-minute interval",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/X axis: Interval \(ten-minute ticks\)/i),
    ).toBeTruthy();

    const legend = chart.querySelector("[data-spc-control-chart-legend]");
    expect(legend).toBeTruthy();
    const legendQueries = within(legend as HTMLElement);
    expect(legendQueries.getByText("Completions")).toBeTruthy();
    expect(legendQueries.getByText("Center line")).toBeTruthy();
    expect(legendQueries.getByText("Upper control limit")).toBeTruthy();
    expect(legendQueries.getByText("Lower control limit")).toBeTruthy();
    expect(
      screen.getByText(/special-cause signal against earlier common-cause/i),
    ).toBeTruthy();
  });
});
