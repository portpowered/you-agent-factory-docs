"use client";

import { useReducedMotion } from "@/hooks/media/useReducedMotion";
import {
  type DocsChartConfig,
  type DocsChartDatum,
  formatDocsChartSummary,
} from "@/lib/docs-charts";
import { type ReactNode, useId } from "react";
import { ResponsiveContainer } from "recharts";

const DEFAULT_CHART_INITIAL_WIDTH_PX = 640;
const DEFAULT_CHART_INITIAL_HEIGHT_PX = 320;

export type DocsChartFrameRenderContext<TData extends DocsChartDatum> = {
  data: readonly TData[];
  config: DocsChartConfig<TData>;
  isAnimationActive: boolean;
};

type DocsChartFrameProps<TData extends DocsChartDatum> = {
  data: readonly TData[];
  config: DocsChartConfig<TData>;
  emptyMessage?: string;
  surfaceMinWidthPx?: number;
  children: (context: DocsChartFrameRenderContext<TData>) => ReactNode;
};

export function DocsChartFrame<TData extends DocsChartDatum>({
  data,
  config,
  emptyMessage = "No chart data is available yet.",
  surfaceMinWidthPx,
  children,
}: DocsChartFrameProps<TData>) {
  const titleId = useId();
  const descriptionId = useId();
  const summaryId = useId();
  const prefersReducedMotion = useReducedMotion();
  const summary = formatDocsChartSummary(config, data);
  const accessibleDescription = config.description
    ? `${descriptionId} ${summaryId}`
    : summaryId;

  return (
    <figure
      aria-describedby={accessibleDescription}
      aria-labelledby={titleId}
      className="docs-chart"
    >
      <figcaption className="docs-chart__header">
        <span className="docs-chart__title" id={titleId}>
          {config.title}
        </span>
        {config.description ? (
          <span className="docs-chart__description" id={descriptionId}>
            {config.description}
          </span>
        ) : null}
      </figcaption>
      <p className="docs-chart__summary" id={summaryId}>
        {summary}
      </p>
      <ul aria-label={`${config.title} series`} className="docs-chart__legend">
        {config.series.map((series) => (
          <li className="docs-chart__legend-item" key={series.key}>
            <span
              aria-hidden="true"
              className="docs-chart__legend-swatch"
              style={{ backgroundColor: series.color }}
            />
            <span>{series.label}</span>
          </li>
        ))}
      </ul>
      {data.length === 0 ? (
        <output className="docs-chart__empty">{emptyMessage}</output>
      ) : (
        <div className="docs-chart__surface-shell">
          <div
            aria-hidden="true"
            className="docs-chart__surface"
            style={
              surfaceMinWidthPx
                ? { minWidth: `${surfaceMinWidthPx}px` }
                : undefined
            }
          >
            <ResponsiveContainer
              height="100%"
              initialDimension={{
                width: surfaceMinWidthPx ?? DEFAULT_CHART_INITIAL_WIDTH_PX,
                height: DEFAULT_CHART_INITIAL_HEIGHT_PX,
              }}
              minHeight={DEFAULT_CHART_INITIAL_HEIGHT_PX}
              width="100%"
            >
              {children({
                config,
                data,
                isAnimationActive: !prefersReducedMotion,
              })}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </figure>
  );
}
