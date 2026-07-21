import {
  type CostInput,
  calculateSplitPlanCost,
} from "@/lib/content/model-cost";
import type { ModelPricingRecord } from "@/lib/content/model-pricing";

/**
 * Teaching token scenario for the CompareChart slot: a larger (more expensive)
 * planner model handles a smaller planning budget; a cheaper executor handles
 * the heavier implementation budget. Split should beat single-model totals.
 */
export const TEACHING_PLANNER_USAGE: CostInput = {
  inputTokens: 200_000,
  outputTokens: 50_000,
};

export const TEACHING_EXECUTOR_USAGE: CostInput = {
  inputTokens: 1_000_000,
  outputTokens: 200_000,
};

/** Prefer Claude Sonnet as the larger planner / single-model primary. */
export const TEACHING_PRIMARY_MODEL_ID = "model.anthropic.claude-sonnet";

/** Prefer GPT-4o as the smaller executor secondary. */
export const TEACHING_SECONDARY_MODEL_ID = "model.openai.gpt-4o";

export type TeachingCompareChartTotals = {
  primaryOnlyUsd: number;
  splitUsd: number;
  primaryDisplayName: string;
  secondaryDisplayName: string;
};

/**
 * Pure builder: map commit-only pricing records into comparative totals.
 * Callers supply records from `listModelPricing()` (read-only); this module
 * does not touch the filesystem.
 */
export function buildTeachingCompareChartTotals(
  pricingRecords: readonly ModelPricingRecord[],
): TeachingCompareChartTotals | null {
  const primary = pricingRecords.find(
    (record) => record.id === TEACHING_PRIMARY_MODEL_ID,
  );
  const secondary = pricingRecords.find(
    (record) => record.id === TEACHING_SECONDARY_MODEL_ID,
  );
  if (!primary || !secondary) {
    return null;
  }

  const result = calculateSplitPlanCost({
    primary,
    secondary,
    plannerUsage: TEACHING_PLANNER_USAGE,
    executorUsage: TEACHING_EXECUTOR_USAGE,
  });

  return {
    primaryOnlyUsd: result.primaryOnly.totalUsd,
    splitUsd: result.split.totalUsd,
    primaryDisplayName: primary.displayName,
    secondaryDisplayName: secondary.displayName,
  };
}
