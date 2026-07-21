import type { PlaygroundCostSuccess } from "./derive-playground-cost-state";
import type { ModelCostPlaygroundMessages } from "./types";

type RecommendationMessages = Pick<
  ModelCostPlaygroundMessages,
  | "recommendation"
  | "recommendationPreferPrimaryOnly"
  | "recommendationPreferSplit"
>;

/**
 * Resolve recommendation body from host message keys for the winning plan.
 * Prefer plan-specific keys; fall back to `messages.recommendation`.
 */
export function resolvePlaygroundRecommendationCopy(
  recommendedPlan: PlaygroundCostSuccess["recommendedPlan"],
  messages: RecommendationMessages,
): string {
  if (recommendedPlan === "split") {
    return messages.recommendationPreferSplit.trim() || messages.recommendation;
  }
  return (
    messages.recommendationPreferPrimaryOnly.trim() || messages.recommendation
  );
}
