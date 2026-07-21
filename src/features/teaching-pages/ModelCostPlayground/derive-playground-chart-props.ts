import type { ComparativeBarChartProps } from "@/features/teaching-ui/charts";
import type { PlaygroundCostState } from "./derive-playground-cost-state";
import type { ModelCostPlaygroundMessages } from "./types";

/** Stable series ids — match `recommendedPlan` on success. */
export const PLAYGROUND_SERIES_PRIMARY_ONLY = "primary-only" as const;
export const PLAYGROUND_SERIES_SPLIT = "split" as const;

export type PlaygroundChartSeriesId =
  | typeof PLAYGROUND_SERIES_PRIMARY_ONLY
  | typeof PLAYGROUND_SERIES_SPLIT;

/**
 * Pure mapping from playground cost state + host messages → ComparativeBarChart
 * props. Chart values stay aligned with `calculateSplitPlanCost` totals.
 */
export function derivePlaygroundBarChartProps(args: {
  costState: PlaygroundCostState;
  messages: Pick<
    ModelCostPlaygroundMessages,
    | "chartTitle"
    | "chartCategoryLabel"
    | "chartXLabel"
    | "chartYLabel"
    | "primaryOnlyLabel"
    | "splitTotalLabel"
  >;
}): ComparativeBarChartProps {
  const { costState, messages } = args;
  const base = {
    title: messages.chartTitle,
    categories: [messages.chartCategoryLabel],
    xLabel: messages.chartXLabel,
    yLabel: messages.chartYLabel,
    series: [
      {
        id: PLAYGROUND_SERIES_PRIMARY_ONLY,
        label: messages.primaryOnlyLabel,
        values: [0],
      },
      {
        id: PLAYGROUND_SERIES_SPLIT,
        label: messages.splitTotalLabel,
        values: [0],
      },
    ],
  } satisfies Omit<ComparativeBarChartProps, "state" | "focusSeriesId">;

  if (costState.status === "empty") {
    return { ...base, state: "empty" };
  }

  if (costState.status === "error") {
    return { ...base, state: "error" };
  }

  return {
    ...base,
    state: "success",
    focusSeriesId: costState.recommendedPlan,
    series: [
      {
        id: PLAYGROUND_SERIES_PRIMARY_ONLY,
        label: messages.primaryOnlyLabel,
        values: [costState.result.primaryOnly.totalUsd],
      },
      {
        id: PLAYGROUND_SERIES_SPLIT,
        label: messages.splitTotalLabel,
        values: [costState.result.split.totalUsd],
      },
    ],
  };
}
