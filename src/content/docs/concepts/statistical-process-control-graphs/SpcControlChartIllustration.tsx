"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/features/factory-ui/charts";

/** Teaching fixture: mostly in-control completions, one special-cause spike. */
const CENTER_LINE = 10;
const UPPER_CONTROL_LIMIT = 14;
const LOWER_CONTROL_LIMIT = 6;

const controlChartData = [
  {
    interval: 0,
    completions: 10,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 1,
    completions: 11,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 2,
    completions: 9,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 3,
    completions: 10,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 4,
    completions: 12,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 5,
    completions: 8,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 6,
    completions: 11,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 7,
    completions: 10,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 8,
    completions: 9,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  // Special-cause excursion above the upper control limit.
  {
    interval: 9,
    completions: 18,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 10,
    completions: 10,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
  {
    interval: 11,
    completions: 11,
    centerLine: CENTER_LINE,
    upperControlLimit: UPPER_CONTROL_LIMIT,
    lowerControlLimit: LOWER_CONTROL_LIMIT,
  },
];

const chartConfig = {
  completions: {
    label: "Completions",
    color: "#0B6E4F",
  },
  centerLine: {
    label: "Center line",
    color: "#1B4F72",
  },
  upperControlLimit: {
    label: "Upper control limit",
    color: "#9A3412",
  },
  lowerControlLimit: {
    label: "Lower control limit",
    color: "#9A3412",
  },
} satisfies ChartConfig;

const CHART_TITLE = "Control chart: goal completions per ten-minute interval";

/**
 * Page-local SPC teaching illustration for the simple-example section.
 * Uses factory-ui chart wrappers + Recharts; fixture data stays page-owned.
 */
function ControlChartSeriesKey() {
  return (
    <ul
      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant"
      data-spc-control-chart-legend=""
    >
      {(
        [
          "completions",
          "centerLine",
          "upperControlLimit",
          "lowerControlLimit",
        ] as const
      ).map((key) => (
        <li className="inline-flex items-center gap-2" key={key}>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: chartConfig[key].color }}
          />
          <span>{chartConfig[key].label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SpcControlChartIllustration() {
  return (
    <figure
      className="my-6"
      data-spc-control-chart-illustration=""
      data-testid="spc-control-chart-illustration"
    >
      <p className="mb-2 text-sm font-medium text-on-surface">{CHART_TITLE}</p>
      <p className="mb-2 text-xs text-on-surface-variant">
        X axis: Interval (ten-minute ticks). Y axis: Completions.
      </p>
      <ChartContainer
        config={chartConfig}
        footer={<ControlChartSeriesKey />}
        title={CHART_TITLE}
      >
        <LineChart
          data={controlChartData}
          margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="interval"
            domain={[0, "dataMax"]}
            label={{
              value: "Interval (ten-minute ticks)",
              position: "insideBottom",
              offset: -4,
            }}
            tickLine={false}
            type="number"
          />
          <YAxis
            domain={[0, 20]}
            label={{
              value: "Completions",
              angle: -90,
              position: "insideLeft",
            }}
            tickLine={false}
            width={56}
          />
          <ChartTooltip content={ChartTooltipContent} />
          <ChartLegend content={ChartLegendContent} />
          <Line
            dataKey="centerLine"
            dot={false}
            isAnimationActive={false}
            name="centerLine"
            stroke="var(--color-centerLine)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="upperControlLimit"
            dot={false}
            isAnimationActive={false}
            name="upperControlLimit"
            stroke="var(--color-upperControlLimit)"
            strokeDasharray="6 4"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="lowerControlLimit"
            dot={false}
            isAnimationActive={false}
            name="lowerControlLimit"
            stroke="var(--color-lowerControlLimit)"
            strokeDasharray="6 4"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="completions"
            dot={{ r: 3 }}
            isAnimationActive={false}
            name="completions"
            stroke="var(--color-completions)"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>
      <figcaption className="mt-2 text-sm text-fd-muted-foreground">
        Most intervals stay between the control limits. Interval 9 spikes above
        the upper control limit — a special-cause signal against earlier
        common-cause noise.
      </figcaption>
    </figure>
  );
}
