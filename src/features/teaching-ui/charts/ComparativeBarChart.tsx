"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartStatePanel,
  ChartTooltip,
  ChartTooltipContent,
} from "@/features/factory-ui/charts";
import type {
  ComparativeBarChartProps,
  ComparativeBarSeries,
} from "./comparative-chart.types";
import {
  COMPARATIVE_CHART_FOCUS_COLORS,
  resolveBarFill,
  resolveFocusColor,
} from "./focus-colors";

const CATEGORY_DATA_KEY = "category";

const STATE_DESCRIPTIONS = {
  loading: "Waiting for comparative bar chart data.",
  empty: "No comparative bar chart data is available.",
  error: "The comparative bar chart failed to load.",
} as const;

function buildBarRows(
  categories: string[],
  series: ComparativeBarSeries[],
): Array<Record<string, string | number>> {
  return categories.map((category, categoryIndex) => {
    const row: Record<string, string | number> = {
      [CATEGORY_DATA_KEY]: category,
    };
    for (const entry of series) {
      row[entry.id] = entry.values[categoryIndex] ?? 0;
    }
    return row;
  });
}

function buildChartConfig(
  series: ComparativeBarSeries[],
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

function ComparativeBarSeriesKey({
  chartConfig,
  series,
}: {
  chartConfig: ChartConfig;
  series: ComparativeBarSeries[];
}) {
  return (
    <ul
      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant"
      data-comparative-bar-chart-legend=""
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
 * Grouped comparative bar chart for teaching / cost-playground composers.
 * Composes factory-ui ChartContainer + Recharts; focus mutes non-primary series.
 */
export function ComparativeBarChart({
  title,
  categories,
  series,
  xLabel,
  yLabel,
  focusSeriesId,
  focusCategoryId,
  state = "success",
  className,
}: ComparativeBarChartProps) {
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
  const data = buildBarRows(categories, series);

  return (
    <figure
      className={className}
      data-comparative-bar-chart=""
      data-testid="comparative-bar-chart"
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
          <ComparativeBarSeriesKey chartConfig={chartConfig} series={series} />
        }
        title={title}
      >
        <BarChart
          data={data}
          margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={CATEGORY_DATA_KEY}
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
            domain={[0, "auto"]}
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
            <Bar
              dataKey={entry.id}
              fill={`var(--color-${entry.id})`}
              isAnimationActive={false}
              key={entry.id}
              name={entry.id}
              radius={[4, 4, 0, 0]}
            >
              {categories.map((category) => {
                const fill = resolveBarFill({
                  seriesId: entry.id,
                  categoryId: category,
                  focusSeriesId,
                  focusCategoryId,
                });
                return (
                  <Cell
                    data-category-id={category}
                    data-focus-fill={
                      fill === COMPARATIVE_CHART_FOCUS_COLORS.accent
                        ? "accent"
                        : "muted"
                    }
                    data-series-id={entry.id}
                    fill={fill}
                    key={`${entry.id}-${category}`}
                  />
                );
              })}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
    </figure>
  );
}

export type { ComparativeBarChartProps };
