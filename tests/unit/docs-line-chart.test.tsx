import { beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { DocsChartConfig } from "../../src/lib/docs-charts";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";

const lineChartCalls: Array<Record<string, unknown>> = [];
const lineCalls: Array<Record<string, unknown>> = [];

mock.module("recharts", () => ({
  ResponsiveContainer: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="responsive-container">{children}</div>,
}));

mock.module("recharts/es6/chart/LineChart", () => ({
  LineChart: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    lineChartCalls.push(props);
    return (
      <svg aria-hidden="true" data-testid="line-chart">
        {children}
      </svg>
    );
  },
}));

mock.module("recharts/es6/cartesian/CartesianGrid", () => ({
  CartesianGrid: (props: Record<string, unknown>) => (
    <div data-testid="chart-grid" data-props={JSON.stringify(props)} />
  ),
}));

mock.module("recharts/es6/cartesian/XAxis", () => ({
  XAxis: (props: Record<string, unknown>) => (
    <div data-testid="chart-x-axis" data-props={JSON.stringify(props)} />
  ),
}));

mock.module("recharts/es6/cartesian/YAxis", () => ({
  YAxis: (props: Record<string, unknown>) => (
    <div data-testid="chart-y-axis" data-props={JSON.stringify(props)} />
  ),
}));

mock.module("recharts/es6/cartesian/Line", () => ({
  Line: (props: Record<string, unknown>) => {
    lineCalls.push(props);
    return <div data-testid={`line-${String(props.dataKey)}`} />;
  },
}));

type ThroughputDatum = {
  hour: string;
  completedReviews: number;
  reviewReadyFindings: number;
};

const data: ThroughputDatum[] = [
  { hour: "09:00", completedReviews: 42, reviewReadyFindings: 30 },
  { hour: "10:00", completedReviews: 58, reviewReadyFindings: 44 },
  { hour: "11:00", completedReviews: 76, reviewReadyFindings: 59 },
];

const config: DocsChartConfig<ThroughputDatum> = {
  title: "Review throughput by hour",
  description: "Completed reviews and review-ready findings.",
  categoryKey: "hour",
  categoryLabel: "Hour",
  summary:
    "From 09:00 to 11:00 UTC, completed reviews rise from 42 to 76 while review-ready findings rise from 30 to 59.",
  series: [
    {
      key: "completedReviews",
      label: "Completed reviews",
      color: "#0f766e",
    },
    {
      key: "reviewReadyFindings",
      label: "Review-ready findings",
      color: "#c2410c",
    },
  ],
};

describe("DocsLineChart", () => {
  beforeEach(() => {
    lineChartCalls.length = 0;
    lineCalls.length = 0;
  });

  test("renders a reusable line chart from authored data, config, and responsive overflow settings", async () => {
    const { DocsLineChart } = await import(
      "../../src/components/docs/primitives/docs-line-chart"
    );

    render(
      <DocsLineChart
        config={config}
        data={data}
        surfaceMinWidthPx={640}
        valueFormatter={(value) => `${value} items`}
      />,
    );

    expect(screen.getByRole("figure", { name: config.title })).toBeTruthy();
    expect(screen.getByText(config.summary as string)).toBeTruthy();
    expect(
      screen.getByRole("list", { name: `${config.title} series` }),
    ).toBeTruthy();
    expect(screen.getByText("Completed reviews")).toBeTruthy();
    expect(screen.getByText("Review-ready findings")).toBeTruthy();
    expect(screen.getByTestId("responsive-container")).toBeTruthy();
    expect(screen.getByTestId("line-chart")).toBeTruthy();
    expect(
      screen.getByTestId("line-chart").parentElement?.parentElement?.style
        .minWidth,
    ).toBe("640px");
    expect(lineChartCalls).toEqual([
      {
        accessibilityLayer: true,
        data,
        margin: { top: 16, right: 24, bottom: 8, left: 0 },
      },
    ]);
    expect(
      lineCalls.map((call) => ({
        dataKey: call.dataKey,
        isAnimationActive: call.isAnimationActive,
        name: call.name,
        stroke: call.stroke,
      })),
    ).toEqual([
      {
        dataKey: "completedReviews",
        isAnimationActive: true,
        name: "Completed reviews",
        stroke: "#0f766e",
      },
      {
        dataKey: "reviewReadyFindings",
        isAnimationActive: true,
        name: "Review-ready findings",
        stroke: "#c2410c",
      },
    ]);
  });

  test("disables tooltip and line animation when shared reduced motion is enabled", async () => {
    const { DocsLineChart } = await import(
      "../../src/components/docs/primitives/docs-line-chart"
    );

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1,
      prefersReducedMotion: true,
    });

    render(<DocsLineChart config={config} data={data} />);

    expect(lineCalls.every((call) => call.isAnimationActive === false)).toBe(
      true,
    );
  });
});
