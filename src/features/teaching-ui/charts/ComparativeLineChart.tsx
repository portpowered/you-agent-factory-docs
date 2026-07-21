"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartStatePanel,
  ChartTooltip,
  ChartTooltipContent,
} from "@/features/factory-ui/charts";
import type {
  ComparativeLineChartProps,
  ComparativeLineSeries,
} from "./comparative-chart.types";
import { resolveFocusColor } from "./focus-colors";

const STATE_DESCRIPTIONS = {
  loading: "Waiting for comparative line chart data.",
  empty: "No comparative line chart data is available.",
  error: "The comparative line chart failed to load.",
} as const;

function buildChartConfig(
  series: ComparativeLineSeries[],
  focusSeriesId: string | undefined,
): ChartConfig {
  const config: ChartConfig = {};
  for (const entry of series) {
    config[entry.id] = {
      label: entry.label,
      color: resolveFocusColor(entry.id, focusSeriesId),
    };
  }
  return config;
}

function ComparativeLineSeriesKey({
  chartConfig,
  series,
}: {
  chartConfig: ChartConfig;
  series: ComparativeLineSeries[];
}) {
  return (
    <ul
      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant"
      data-comparative-line-chart-legend=""
    >
      {series.map((entry) => (
        <li className="inline-flex items-center gap-2" key={entry.id}>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: chartConfig[entry.id]?.color }}
          />
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Multi-series comparative line chart for teaching / cost-playground composers.
 * Composes factory-ui ChartContainer + Recharts; focus mutes non-primary series.
 */
export function ComparativeLineChart({
  title,
  points,
  xKey,
  series,
  xLabel,
  yLabel,
  focusSeriesId,
  state = "success",
  className,
}: ComparativeLineChartProps) {
  if (state === "loading" || state === "empty" || state === "error") {
    return (
      <ChartStatePanel
        className={className}
        description={STATE_DESCRIPTIONS[state]}
        status={state}
        title={title}
      />
    );
  }

  const chartConfig = buildChartConfig(series, focusSeriesId);

  return (
    <figure
      className={className}
      data-comparative-line-chart=""
      data-testid="comparative-line-chart"
    >
      <p className="mb-2 text-sm font-medium text-on-surface">{title}</p>
      {xLabel || yLabel ? (
        <p className="mb-2 text-xs text-on-surface-variant">
          {xLabel ? `X axis: ${xLabel}.` : null}
          {xLabel && yLabel ? " " : null}
          {yLabel ? `Y axis: ${yLabel}.` : null}
        </p>
      ) : null}
      <ChartContainer
        config={chartConfig}
        footer={
          <ComparativeLineSeriesKey chartConfig={chartConfig} series={series} />
        }
        title={title}
      >
        <LineChart
          data={points}
          margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            label={
              xLabel
                ? {
                    value: xLabel,
                    position: "insideBottom",
                    offset: -4,
                  }
                : undefined
            }
            tickLine={false}
          />
          <YAxis
            label={
              yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: "insideLeft",
                  }
                : undefined
            }
            tickLine={false}
            width={56}
          />
          <ChartTooltip content={ChartTooltipContent} />
          {series.map((entry) => (
            <Line
              dataKey={entry.id}
              dot={{ r: 3 }}
              isAnimationActive={false}
              key={entry.id}
              name={entry.id}
              stroke={`var(--color-${entry.id})`}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </LineChart>
      </ChartContainer>
    </figure>
  );
}

export type { ComparativeLineChartProps };
