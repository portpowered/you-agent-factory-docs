import {
  calculateSplitPlanCost,
  type SplitPlanCostResult,
} from "@/lib/content/model-cost";
import type { ModelPricingRecord } from "@/lib/content/model-pricing";
import type { ModelCostTokenFields } from "./types";

export type PlaygroundCostSuccess = {
  status: "success";
  primary: ModelPricingRecord;
  secondary: ModelPricingRecord;
  result: SplitPlanCostResult;
  /** Cheaper plan for later chart focus / recommendation stories. */
  recommendedPlan: "primary-only" | "split";
};

export type PlaygroundCostState =
  | { status: "empty" }
  | {
      status: "error";
      reason: "missing-models" | "invalid-tokens";
    }
  | PlaygroundCostSuccess;

/**
 * Parse a single token field. Accepts non-negative finite numbers only.
 * Empty / non-numeric / negative → null (explicit invalid).
 */
export function parseTokenField(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function resolveModel(
  models: readonly ModelPricingRecord[],
  id: string,
): ModelPricingRecord | undefined {
  return models.find((model) => model.id === id);
}

/**
 * Pure playground calc state from models + selected ids + token field strings.
 * No React or DOM — component tests can assert against the same helpers.
 */
export function derivePlaygroundCostState(args: {
  models: readonly ModelPricingRecord[];
  primaryModelId: string;
  secondaryModelId: string;
  tokens: ModelCostTokenFields;
}): PlaygroundCostState {
  if (args.models.length === 0) {
    return { status: "empty" };
  }

  const primary = resolveModel(args.models, args.primaryModelId);
  const secondary = resolveModel(args.models, args.secondaryModelId);
  if (!primary || !secondary) {
    return { status: "error", reason: "missing-models" };
  }

  const plannerInputTokens = parseTokenField(args.tokens.plannerInputTokens);
  const plannerOutputTokens = parseTokenField(args.tokens.plannerOutputTokens);
  const executorInputTokens = parseTokenField(args.tokens.executorInputTokens);
  const executorOutputTokens = parseTokenField(
    args.tokens.executorOutputTokens,
  );

  if (
    plannerInputTokens === null ||
    plannerOutputTokens === null ||
    executorInputTokens === null ||
    executorOutputTokens === null
  ) {
    return { status: "error", reason: "invalid-tokens" };
  }

  const result = calculateSplitPlanCost({
    primary,
    secondary,
    plannerUsage: {
      inputTokens: plannerInputTokens,
      outputTokens: plannerOutputTokens,
    },
    executorUsage: {
      inputTokens: executorInputTokens,
      outputTokens: executorOutputTokens,
    },
  });

  const recommendedPlan =
    result.split.totalUsd < result.primaryOnly.totalUsd
      ? "split"
      : "primary-only";

  return {
    status: "success",
    primary,
    secondary,
    result,
    recommendedPlan,
  };
}

/** Default token strings used when the playground mounts (exact IEEE-friendly). */
export const DEFAULT_TOKEN_FIELDS: ModelCostTokenFields = {
  plannerInputTokens: "200000",
  plannerOutputTokens: "50000",
  executorInputTokens: "1000000",
  executorOutputTokens: "200000",
};
