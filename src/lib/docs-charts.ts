export type DocsChartDatum = Record<string, number | string | null>;

export type DocsChartSeriesConfig<TData extends DocsChartDatum> = {
  key: keyof TData & string;
  label: string;
  color: string;
};

export type DocsChartConfig<TData extends DocsChartDatum> = {
  title: string;
  description?: string;
  categoryKey: keyof TData & string;
  categoryLabel: string;
  series: readonly DocsChartSeriesConfig<TData>[];
  summary?: string;
};

function formatPointCount(count: number): string {
  return `${count} data point${count === 1 ? "" : "s"}`;
}

/** Builds a reviewer-visible summary from authored chart inputs when none is supplied. */
export function formatDocsChartSummary<TData extends DocsChartDatum>(
  config: DocsChartConfig<TData>,
  data: readonly TData[],
): string {
  if (config.summary) {
    return config.summary;
  }

  const seriesLabels = config.series.map((series) => series.label).join(", ");

  return `${formatPointCount(data.length)} across ${config.categoryLabel}. Series: ${seriesLabels}.`;
}
