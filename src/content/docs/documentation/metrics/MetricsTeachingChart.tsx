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

/**
 * Teaching fixture: work-token lifecycle buckets over successive status ticks.
 * Shows time-ordered watching of processing, terminal, and failed totals —
 * not SPC control limits (those stay on the SPC concept page).
 */
const tokenBucketSeries = [
  { tick: 0, processing: 4, terminal: 0, failed: 0 },
  { tick: 1, processing: 8, terminal: 2, failed: 0 },
  { tick: 2, processing: 10, terminal: 5, failed: 1 },
  { tick: 3, processing: 9, terminal: 9, failed: 1 },
  { tick: 4, processing: 7, terminal: 14, failed: 2 },
  { tick: 5, processing: 5, terminal: 18, failed: 2 },
  { tick: 6, processing: 3, terminal: 22, failed: 3 },
  { tick: 7, processing: 2, terminal: 26, failed: 3 },
  { tick: 8, processing: 1, terminal: 29, failed: 4 },
  { tick: 9, processing: 0, terminal: 32, failed: 4 },
];

const chartConfig = {
  processing: {
    label: "Processing",
    color: "#1B4F72",
  },
  terminal: {
    label: "Terminal",
    color: "#0B6E4F",
  },
  failed: {
    label: "Failed",
    color: "#9A3412",
  },
} satisfies ChartConfig;

const CHART_TITLE = "Work-token lifecycle buckets over successive status ticks";

function TokenBucketSeriesKey() {
  return (
    <ul
      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant"
      data-metrics-teaching-chart-legend=""
    >
      {(["processing", "terminal", "failed"] as const).map((key) => (
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

/**
 * Page-local metrics teaching illustration for documentation/metrics.
 * Uses factory-ui chart wrappers + Recharts; fixture data stays page-owned.
 */
export function MetricsTeachingChart() {
  return (
    <figure
      className="my-6"
      data-metrics-teaching-chart=""
      data-testid="metrics-teaching-chart"
    >
      <p className="mb-2 text-sm font-medium text-on-surface">{CHART_TITLE}</p>
      <p className="mb-2 text-xs text-on-surface-variant">
        X axis: Status tick. Y axis: Token count.
      </p>
      <ChartContainer
        config={chartConfig}
        footer={<TokenBucketSeriesKey />}
        title={CHART_TITLE}
      >
        <LineChart
          data={tokenBucketSeries}
          margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="tick"
            domain={[0, "dataMax"]}
            label={{
              value: "Status tick",
              position: "insideBottom",
              offset: -4,
            }}
            tickLine={false}
            type="number"
          />
          <YAxis
            domain={[0, 36]}
            label={{
              value: "Token count",
              angle: -90,
              position: "insideLeft",
            }}
            tickLine={false}
            width={56}
          />
          <ChartTooltip content={ChartTooltipContent} />
          <ChartLegend content={ChartLegendContent} />
          <Line
            dataKey="processing"
            dot={{ r: 3 }}
            isAnimationActive={false}
            name="processing"
            stroke="var(--color-processing)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="terminal"
            dot={{ r: 3 }}
            isAnimationActive={false}
            name="terminal"
            stroke="var(--color-terminal)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="failed"
            dot={{ r: 3 }}
            isAnimationActive={false}
            name="failed"
            stroke="var(--color-failed)"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>
      <figcaption className="mt-2 text-sm text-fd-muted-foreground">
        Across successive status ticks, processing drains while terminal grows
        and a small failed bucket accumulates — the same categories totals an
        operator watches when reading session status over time.
      </figcaption>
    </figure>
  );
}
