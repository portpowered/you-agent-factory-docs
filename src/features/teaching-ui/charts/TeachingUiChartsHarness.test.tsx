import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COMPARATIVE_CHART_FOCUS_COLORS } from "./focus-colors";
import {
  TEACHING_UI_CHARTS_HARNESS_TITLES,
  TeachingUiChartsHarness,
} from "./TeachingUiChartsHarness";

afterEach(() => {
  cleanup();
});

describe("TeachingUiChartsHarness", () => {
  test("renders both charts by accessible title and toggles series focus colors", async () => {
    const user = userEvent.setup();
    render(<TeachingUiChartsHarness />);

    expect(screen.getByTestId("teaching-ui-charts-harness")).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: TEACHING_UI_CHARTS_HARNESS_TITLES.bar,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: TEACHING_UI_CHARTS_HARNESS_TITLES.line,
      }),
    ).toBeTruthy();

    const barChart = screen.getByRole("img", {
      name: TEACHING_UI_CHARTS_HARNESS_TITLES.bar,
    });
    const lineChart = screen.getByRole("img", {
      name: TEACHING_UI_CHARTS_HARNESS_TITLES.line,
    });

    expect(barChart.style.getPropertyValue("--color-model-a")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(barChart.style.getPropertyValue("--color-model-b")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );
    expect(lineChart.style.getPropertyValue("--color-model-a")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(lineChart.style.getPropertyValue("--color-model-b")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );

    await user.selectOptions(
      screen.getByTestId("teaching-ui-charts-harness-focus-series"),
      "model-b",
    );

    expect(barChart.style.getPropertyValue("--color-model-a")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );
    expect(barChart.style.getPropertyValue("--color-model-b")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(lineChart.style.getPropertyValue("--color-model-a")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );
    expect(lineChart.style.getPropertyValue("--color-model-b")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
  });
});
