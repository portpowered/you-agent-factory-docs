import type { ModelPricingRecord } from "./model-pricing";

/** Token usage for one model call (or aggregated primary-only usage). */
export type CostInput = {
  inputTokens: number;
  outputTokens: number;
};

/** USD cost breakdown for one pricing record + usage. */
export type ModelCostBreakdown = {
  modelId: string;
  inputCostUsd: number;
  outputCostUsd: number;
  totalUsd: number;
};

const TOKENS_PER_MILLION = 1_000_000;

/**
 * Pure USD cost from commit-only pricing + token usage.
 *
 * Math (USD per 1M tokens):
 * - inputCostUsd = (inputTokens / 1_000_000) * inputPricePerMTok
 * - outputCostUsd = (outputTokens / 1_000_000) * outputPricePerMTok
 * - totalUsd = inputCostUsd + outputCostUsd
 *
 * No filesystem or network I/O.
 */
export function calculateModelCost(
  pricing: ModelPricingRecord,
  usage: CostInput,
): ModelCostBreakdown {
  const inputCostUsd =
    (usage.inputTokens / TOKENS_PER_MILLION) * pricing.inputPricePerMTok;
  const outputCostUsd =
    (usage.outputTokens / TOKENS_PER_MILLION) * pricing.outputPricePerMTok;

  return {
    modelId: pricing.id,
    inputCostUsd,
    outputCostUsd,
    totalUsd: inputCostUsd + outputCostUsd,
  };
}

export type SplitPlanCostArgs = {
  primary: ModelPricingRecord;
  secondary: ModelPricingRecord;
  plannerUsage: CostInput;
  executorUsage: CostInput;
};

export type SplitPlanCostResult = {
  /** All planner+executor tokens priced on the primary model. */
  primaryOnly: ModelCostBreakdown;
  /** Planner on primary, executor on secondary. */
  split: {
    planner: ModelCostBreakdown;
    executor: ModelCostBreakdown;
    totalUsd: number;
  };
};

/**
 * Compare primary-only vs planner/executor split totals.
 *
 * - `primaryOnly`: combined planner+executor usage on `primary`
 * - `split.planner`: `plannerUsage` on `primary`
 * - `split.executor`: `executorUsage` on `secondary`
 *
 * No filesystem or network I/O.
 */
export function calculateSplitPlanCost(
  args: SplitPlanCostArgs,
): SplitPlanCostResult {
  const combinedUsage: CostInput = {
    inputTokens: args.plannerUsage.inputTokens + args.executorUsage.inputTokens,
    outputTokens:
      args.plannerUsage.outputTokens + args.executorUsage.outputTokens,
  };

  const primaryOnly = calculateModelCost(args.primary, combinedUsage);
  const planner = calculateModelCost(args.primary, args.plannerUsage);
  const executor = calculateModelCost(args.secondary, args.executorUsage);

  return {
    primaryOnly,
    split: {
      planner,
      executor,
      totalUsd: planner.totalUsd + executor.totalUsd,
    },
  };
}
