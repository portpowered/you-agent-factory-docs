import { beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { DocsChartConfig } from "../../src/lib/docs-charts";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";

const responsiveContainerCalls: Array<{ height: string; width: string }> = [];

mock.module("recharts", () => ({
  ResponsiveContainer: ({
    children,
    height,
    width,
  }: {
    children: React.ReactNode;
    height: string;
    width: string;
  }) => {
    responsiveContainerCalls.push({ height, width });
    return <div data-testid="responsive-container">{children}</div>;
  },
}));

type ThroughputDatum = {
  hour: string;
  throughput: number;
  errors: number;
};

const data: ThroughputDatum[] = [
  { hour: "09:00", throughput: 120, errors: 4 },
  { hour: "10:00", throughput: 148, errors: 3 },
  { hour: "11:00", throughput: 164, errors: 2 },
];

const config: DocsChartConfig<ThroughputDatum> = {
  title: "Throughput by hour",
  description: "Authored throughput and error-rate series for review.",
  categoryKey: "hour",
  categoryLabel: "Hour",
  series: [
    { key: "throughput", label: "Throughput", color: "#0f766e" },
    { key: "errors", label: "Errors", color: "#c2410c" },
  ],
};

describe("DocsChartFrame", () => {
  beforeEach(() => {
    responsiveContainerCalls.length = 0;
  });

  test("keeps authored data and config as the render-path source of truth", async () => {
    const { DocsChartFrame } = await import(
      "../../src/components/docs/primitives/docs-chart-frame"
    );

    let capturedContext:
      | {
          data: readonly ThroughputDatum[];
          config: DocsChartConfig<ThroughputDatum>;
          isAnimationActive: boolean;
        }
      | undefined;

    render(
      <DocsChartFrame config={config} data={data}>
        {(context) => {
          capturedContext = context;
          return <svg data-testid="chart-markup" />;
        }}
      </DocsChartFrame>,
    );

    expect(
      screen.getByRole("figure", { name: "Throughput by hour" }),
    ).toBeTruthy();
    expect(screen.getByText(config.description as string)).toBeTruthy();
    expect(
      screen.getByText(
        "3 data points across Hour. Series: Throughput, Errors.",
      ),
    ).toBeTruthy();
    expect(screen.getByTestId("chart-markup")).toBeTruthy();
    expect(capturedContext?.data).toBe(data);
    expect(capturedContext?.config).toBe(config);
    expect(capturedContext?.isAnimationActive).toBe(true);
    expect(responsiveContainerCalls).toEqual([
      { height: "100%", width: "100%" },
    ]);
  });

  test("disables animation when the shared reduced-motion preference is enabled", async () => {
    const { DocsChartFrame } = await import(
      "../../src/components/docs/primitives/docs-chart-frame"
    );

    let capturedAnimationState = true;

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1,
      prefersReducedMotion: true,
    });

    render(
      <DocsChartFrame config={config} data={data}>
        {(context) => {
          capturedAnimationState = context.isAnimationActive;
          return <svg data-testid="chart-markup" />;
        }}
      </DocsChartFrame>,
    );

    expect(capturedAnimationState).toBe(false);
  });

  test("renders an explicit empty state instead of an empty chart surface", async () => {
    const { DocsChartFrame } = await import(
      "../../src/components/docs/primitives/docs-chart-frame"
    );

    render(
      <DocsChartFrame config={config} data={[]}>
        {() => <svg data-testid="chart-markup" />}
      </DocsChartFrame>,
    );

    expect(screen.getByRole("status").textContent).toBe(
      "No chart data is available yet.",
    );
    expect(screen.queryByTestId("responsive-container")).toBeNull();
    expect(screen.queryByTestId("chart-markup")).toBeNull();
  });
});
