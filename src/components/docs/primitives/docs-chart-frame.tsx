"use client";

import { useReducedMotion } from "@/hooks/media/useReducedMotion";
import {
  type DocsChartConfig,
  type DocsChartDatum,
  formatDocsChartSummary,
} from "@/lib/docs-charts";
import { type ReactNode, useId } from "react";
import { ResponsiveContainer } from "recharts";

export type DocsChartFrameRenderContext<TData extends DocsChartDatum> = {
  data: readonly TData[];
  config: DocsChartConfig<TData>;
  isAnimationActive: boolean;
};

type DocsChartFrameProps<TData extends DocsChartDatum> = {
  data: readonly TData[];
  config: DocsChartConfig<TData>;
  emptyMessage?: string;
  children: (context: DocsChartFrameRenderContext<TData>) => ReactNode;
};

export function DocsChartFrame<TData extends DocsChartDatum>({
  data,
  config,
  emptyMessage = "No chart data is available yet.",
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
      {data.length === 0 ? (
        <output className="docs-chart__empty">{emptyMessage}</output>
      ) : (
        <div aria-hidden="true" className="docs-chart__surface">
          <ResponsiveContainer height="100%" width="100%">
            {children({
              config,
              data,
              isAnimationActive: !prefersReducedMotion,
            })}
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
