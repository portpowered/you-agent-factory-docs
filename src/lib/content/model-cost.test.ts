import { describe, expect, test } from "bun:test";
import {
  type CostInput,
  calculateModelCost,
  calculateSplitPlanCost,
} from "./model-cost";
import type { ModelPricingRecord } from "./model-pricing";

const gpt4oPricing: ModelPricingRecord = {
  id: "model.openai.gpt-4o",
  kind: "model-pricing",
  providerId: "provider.openai",
  displayName: "GPT-4o",
  inputPricePerMTok: 2.5,
  outputPricePerMTok: 10,
  currency: "USD",
  asOf: "2026-07-01",
};

const claudePricing: ModelPricingRecord = {
  id: "model.anthropic.claude-sonnet",
  kind: "model-pricing",
  providerId: "provider.anthropic",
  displayName: "Claude Sonnet",
  inputPricePerMTok: 3,
  outputPricePerMTok: 15,
  currency: "USD",
  asOf: "2026-07-01",
};

describe("calculateModelCost", () => {
  test("returns zero costs for zero-token usage", () => {
    const usage: CostInput = { inputTokens: 0, outputTokens: 0 };
    expect(calculateModelCost(gpt4oPricing, usage)).toEqual({
      modelId: "model.openai.gpt-4o",
      inputCostUsd: 0,
      outputCostUsd: 0,
      totalUsd: 0,
    });
  });

  test("computes input-only token cost", () => {
    // 1_000_000 input tokens @ $2.5 / MTok = $2.5
    const usage: CostInput = { inputTokens: 1_000_000, outputTokens: 0 };
    expect(calculateModelCost(gpt4oPricing, usage)).toEqual({
      modelId: "model.openai.gpt-4o",
      inputCostUsd: 2.5,
      outputCostUsd: 0,
      totalUsd: 2.5,
    });
  });

  test("computes output-only token cost", () => {
    // 500_000 output tokens @ $10 / MTok = $5
    const usage: CostInput = { inputTokens: 0, outputTokens: 500_000 };
    expect(calculateModelCost(gpt4oPricing, usage)).toEqual({
      modelId: "model.openai.gpt-4o",
      inputCostUsd: 0,
      outputCostUsd: 5,
      totalUsd: 5,
    });
  });

  test("computes combined input + output token costs", () => {
    // 100_000 in @ $2.5 = $0.25; 50_000 out @ $10 = $0.50; total $0.75
    const usage: CostInput = { inputTokens: 100_000, outputTokens: 50_000 };
    expect(calculateModelCost(gpt4oPricing, usage)).toEqual({
      modelId: "model.openai.gpt-4o",
      inputCostUsd: 0.25,
      outputCostUsd: 0.5,
      totalUsd: 0.75,
    });
  });

  test("uses the pricing record model id and rates", () => {
    // 1M in @ $3 + 1M out @ $15 = $18
    const usage: CostInput = {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    };
    expect(calculateModelCost(claudePricing, usage)).toEqual({
      modelId: "model.anthropic.claude-sonnet",
      inputCostUsd: 3,
      outputCostUsd: 15,
      totalUsd: 18,
    });
  });
});

describe("calculateSplitPlanCost", () => {
  test("compares primary-only vs planner/executor split totals", () => {
    // Token counts chosen so USD math is exact in IEEE-754 doubles.
    const plannerUsage: CostInput = {
      inputTokens: 200_000,
      outputTokens: 50_000,
    };
    const executorUsage: CostInput = {
      inputTokens: 1_000_000,
      outputTokens: 200_000,
    };

    const result = calculateSplitPlanCost({
      primary: gpt4oPricing,
      secondary: claudePricing,
      plannerUsage,
      executorUsage,
    });

    // primaryOnly: 1.2M in @ $2.5 = $3; 250k out @ $10 = $2.5; total $5.5
    expect(result.primaryOnly).toEqual({
      modelId: "model.openai.gpt-4o",
      inputCostUsd: 3,
      outputCostUsd: 2.5,
      totalUsd: 5.5,
    });

    // planner on primary: 200k in @ $2.5 = $0.5; 50k out @ $10 = $0.5
    expect(result.split.planner).toEqual({
      modelId: "model.openai.gpt-4o",
      inputCostUsd: 0.5,
      outputCostUsd: 0.5,
      totalUsd: 1,
    });

    // executor on secondary: 1M in @ $3 = $3; 200k out @ $15 = $3; total $6
    expect(result.split.executor).toEqual({
      modelId: "model.anthropic.claude-sonnet",
      inputCostUsd: 3,
      outputCostUsd: 3,
      totalUsd: 6,
    });

    expect(result.split.totalUsd).toBe(7);
  });

  test("yields zero split totals for zero-token usage", () => {
    const zero: CostInput = { inputTokens: 0, outputTokens: 0 };
    const result = calculateSplitPlanCost({
      primary: gpt4oPricing,
      secondary: claudePricing,
      plannerUsage: zero,
      executorUsage: zero,
    });

    expect(result.primaryOnly.totalUsd).toBe(0);
    expect(result.split.planner.totalUsd).toBe(0);
    expect(result.split.executor.totalUsd).toBe(0);
    expect(result.split.totalUsd).toBe(0);
  });
});
