"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/features/factory-ui/charts";

/**
 * Teaching fixture: stage capacities with one saturated harness stage.
 * End-to-end throughput matches the scarce stage, not the average of the rest.
 */
const stageThroughputData = [
  {
    stage: "Queue",
    stageCapacity: 40,
    endToEnd: 12,
  },
  {
    stage: "Workers",
    stageCapacity: 36,
    endToEnd: 12,
  },
  {
    stage: "Harness",
    stageCapacity: 12,
    endToEnd: 12,
  },
  {
    stage: "Shared I/O",
    stageCapacity: 32,
    endToEnd: 12,
  },
  {
    stage: "Context",
    stageCapacity: 28,
    endToEnd: 12,
  },
];

const chartConfig = {
  stageCapacity: {
    label: "Stage capacity",
    color: "#1B4F72",
  },
  endToEnd: {
    label: "End-to-end throughput",
    color: "#9A3412",
  },
} satisfies ChartConfig;

const CHART_TITLE =
  "Stage capacity vs end-to-end throughput (items per interval)";

function StageThroughputLegend() {
  return (
    <ul
      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant"
      data-bottlenecks-stage-throughput-legend=""
    >
      {(["stageCapacity", "endToEnd"] as const).map((key) => (
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
 * Post-local factory-ui teaching chart for the bottlenecks listicle.
 * Fixture data stays blog-owned; do not register this in shared MDX maps.
 */
export function BottlenecksStageThroughputChart() {
  return (
    <figure
      className="my-6"
      data-bottlenecks-stage-throughput-chart=""
      data-testid="bottlenecks-stage-throughput-chart"
    >
      <p className="mb-2 text-sm font-medium text-on-surface">{CHART_TITLE}</p>
      <p className="mb-2 text-xs text-on-surface-variant">
        X axis: Factory stage. Y axis: Items per interval.
      </p>
      <ChartContainer
        config={chartConfig}
        footer={<StageThroughputLegend />}
        title={CHART_TITLE}
      >
        <BarChart
          data={stageThroughputData}
          margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="stage"
            label={{
              value: "Factory stage",
              position: "insideBottom",
              offset: -4,
            }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 48]}
            label={{
              value: "Items per interval",
              angle: -90,
              position: "insideLeft",
            }}
            tickLine={false}
            width={64}
          />
          <ChartTooltip content={ChartTooltipContent} />
          <ChartLegend content={ChartLegendContent} />
          <Bar
            dataKey="stageCapacity"
            fill="var(--color-stageCapacity)"
            isAnimationActive={false}
            name="stageCapacity"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="endToEnd"
            fill="var(--color-endToEnd)"
            isAnimationActive={false}
            name="endToEnd"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <figcaption className="mt-2 text-sm text-fd-muted-foreground">
        Harness capacity is the scarce stage. End-to-end throughput stays at
        that limit even though queue, workers, shared I/O, and context still
        have spare capacity.
      </figcaption>
    </figure>
  );
}
