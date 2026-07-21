import type { ModelPricingRecord } from "@/lib/content/model-pricing";

/**
 * Host-owned UI copy for ModelCostPlayground.
 * Parents (technique page or harness) resolve message keys and pass strings.
 */
export type ModelCostPlaygroundMessages = {
  primaryLabel: string;
  secondaryLabel: string;
  totalLabel: string;
  /**
   * Fallback recommendation body (and contract field). Prefer
   * `recommendationPreferPrimaryOnly` / `recommendationPreferSplit` when set —
   * those update with the live winning plan.
   */
  recommendation: string;
  /** Accessible name for the recommendation region. */
  recommendationLabel: string;
  /** Body when primary-only is the cheaper recommended plan. */
  recommendationPreferPrimaryOnly: string;
  /** Body when planner/executor split is the cheaper recommended plan. */
  recommendationPreferSplit: string;
  plannerInputLabel: string;
  plannerOutputLabel: string;
  executorInputLabel: string;
  executorOutputLabel: string;
  primaryOnlyLabel: string;
  splitTotalLabel: string;
  plannerCostLabel: string;
  executorCostLabel: string;
  emptyModelsMessage: string;
  missingModelMessage: string;
  invalidTokensMessage: string;
  modelsLegend: string;
  tokensLegend: string;
  breakdownLegend: string;
  /** Comparative bar chart title (host-resolved). */
  chartTitle: string;
  /** Single bar category label (e.g. "Total cost"). */
  chartCategoryLabel: string;
  /** Optional X-axis label for the comparative bar chart. */
  chartXLabel: string;
  /** Y-axis label for the comparative bar chart (e.g. "USD"). */
  chartYLabel: string;
};

export type ModelCostPlaygroundProps = {
  models: readonly ModelPricingRecord[];
  defaultPrimaryModelId: string;
  defaultSecondaryModelId: string;
  messages: ModelCostPlaygroundMessages;
  className?: string;
};

/** Raw token field strings owned by the playground controls. */
export type ModelCostTokenFields = {
  plannerInputTokens: string;
  plannerOutputTokens: string;
  executorInputTokens: string;
  executorOutputTokens: string;
};
