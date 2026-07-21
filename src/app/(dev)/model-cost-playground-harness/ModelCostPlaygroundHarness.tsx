"use client";

import { ModelCostPlayground } from "@/features/teaching-pages/ModelCostPlayground";
import type { ModelPricingRecord } from "@/lib/content/model-pricing";

const FIXTURE_MODELS = [
  {
    id: "model.openai.gpt-4o",
    kind: "model-pricing",
    providerId: "provider.openai",
    displayName: "GPT-4o",
    inputPricePerMTok: 2.5,
    outputPricePerMTok: 10,
    currency: "USD",
    asOf: "2026-07-01",
  },
  {
    id: "model.anthropic.claude-sonnet",
    kind: "model-pricing",
    providerId: "provider.anthropic",
    displayName: "Claude Sonnet",
    inputPricePerMTok: 3,
    outputPricePerMTok: 15,
    currency: "USD",
    asOf: "2026-07-01",
  },
] as const satisfies readonly ModelPricingRecord[];

const DEFAULT_PRIMARY_MODEL_ID = FIXTURE_MODELS[0].id;
const DEFAULT_SECONDARY_MODEL_ID = FIXTURE_MODELS[1].id;

const FIXTURE_MESSAGES = {
  primaryLabel: "Primary model",
  secondaryLabel: "Secondary model",
  totalLabel: "Live total R",
  recommendation: "Prefer the cheaper plan for this token mix.",
  recommendationLabel: "Recommendation",
  recommendationPreferPrimaryOnly:
    "Prefer running planner and executor on the primary model for this token mix.",
  recommendationPreferSplit:
    "Prefer splitting planner on the primary model and executor on the secondary model.",
  plannerInputLabel: "Planner input tokens",
  plannerOutputLabel: "Planner output tokens",
  executorInputLabel: "Executor input tokens",
  executorOutputLabel: "Executor output tokens",
  primaryOnlyLabel: "Primary-only total",
  splitTotalLabel: "Split total",
  plannerCostLabel: "Planner cost",
  executorCostLabel: "Executor cost",
  emptyModelsMessage: "No pricing models available.",
  missingModelMessage: "Select valid primary and secondary models.",
  invalidTokensMessage: "Enter non-negative token counts for all fields.",
  modelsLegend: "Models",
  tokensLegend: "Token usage",
  breakdownLegend: "Cost breakdown",
  chartTitle: "Single-model vs split cost",
  chartCategoryLabel: "Total cost",
  chartXLabel: "Plan",
  chartYLabel: "USD",
} as const;

/**
 * Dev fixture surface for ModelCostPlayground (graph-pages W-cost-playground).
 * Inline pricing subset only — no technique/blog MDX or registry loaders.
 * Story 004 owns full harness review AC (recommendation visibility, etc.).
 */
export function ModelCostPlaygroundHarness() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-background px-6 py-10 text-foreground"
      data-testid="model-cost-playground-harness"
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Model cost playground harness
        </h1>
        <p className="text-sm text-muted-foreground">
          Fixture surface for selects, tokens, live R, comparative chart focus,
          and recommendation copy. Not linked from production navigation.
        </p>
      </header>
      <ModelCostPlayground
        defaultPrimaryModelId={DEFAULT_PRIMARY_MODEL_ID}
        defaultSecondaryModelId={DEFAULT_SECONDARY_MODEL_ID}
        messages={FIXTURE_MESSAGES}
        models={FIXTURE_MODELS}
      />
    </main>
  );
}
