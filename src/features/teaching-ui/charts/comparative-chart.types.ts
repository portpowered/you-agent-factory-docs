export type ComparativeChartState = "loading" | "empty" | "error" | "success";

export type ComparativeBarSeries = {
  id: string;
  label: string;
  values: number[];
};

export type ComparativeBarChartProps = {
  title: string;
  categories: string[];
  series: ComparativeBarSeries[];
  xLabel?: string;
  yLabel?: string;
  focusSeriesId?: string;
  focusCategoryId?: string;
  state?: ComparativeChartState;
  className?: string;
};
