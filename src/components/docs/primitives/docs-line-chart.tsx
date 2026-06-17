"use client";

import { DocsChartFrame } from "@/components/docs/primitives/docs-chart-frame";
import type { DocsChartConfig, DocsChartDatum } from "@/lib/docs-charts";
import type { DataKey } from "recharts";
import { CartesianGrid } from "recharts/es6/cartesian/CartesianGrid";
import { Line } from "recharts/es6/cartesian/Line";
import { XAxis } from "recharts/es6/cartesian/XAxis";
import { YAxis } from "recharts/es6/cartesian/YAxis";
import { LineChart } from "recharts/es6/chart/LineChart";

const DEFAULT_LINE_CHART_MIN_WIDTH_PX = 560;

type DocsLineChartProps<TData extends DocsChartDatum> = {
  data: readonly TData[];
  config: DocsChartConfig<TData>;
  emptyMessage?: string;
  surfaceMinWidthPx?: number;
  valueFormatter?: (value: number) => string;
};

function formatChartValue(
  value: number | string | null | undefined,
  valueFormatter?: (value: number) => string,
): string {
  if (typeof value === "number") {
    return valueFormatter ? valueFormatter(value) : value.toString();
  }

  return value == null ? "" : value.toString();
}

export function DocsLineChart<TData extends DocsChartDatum>({
  data,
  config,
  emptyMessage,
  surfaceMinWidthPx = DEFAULT_LINE_CHART_MIN_WIDTH_PX,
  valueFormatter,
}: DocsLineChartProps<TData>) {
  const categoryKey = config.categoryKey as DataKey<TData>;

  return (
    <DocsChartFrame
      config={config}
      data={data}
      emptyMessage={emptyMessage}
      surfaceMinWidthPx={surfaceMinWidthPx}
    >
      {({ data: chartData, config: chartConfig, isAnimationActive }) => (
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 16, right: 24, bottom: 8, left: 0 }}
        >
          <CartesianGrid
            stroke="var(--landing-border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey={categoryKey}
            minTickGap={24}
            stroke="var(--landing-muted)"
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            stroke="var(--landing-muted)"
            tickFormatter={(value: number | string) =>
              formatChartValue(value, valueFormatter)
            }
            tickLine={false}
            width={44}
          />
          {chartConfig.series.map((series) => (
            <Line
              activeDot={{ fill: series.color, r: 5, strokeWidth: 0 }}
              connectNulls
              dataKey={series.key as DataKey<TData>}
              dot={{ fill: series.color, r: 3, strokeWidth: 0 }}
              isAnimationActive={isAnimationActive}
              key={series.key}
              name={series.label}
              stroke={series.color}
              strokeWidth={2.5}
              type="monotone"
            />
          ))}
        </LineChart>
      )}
    </DocsChartFrame>
  );
}
