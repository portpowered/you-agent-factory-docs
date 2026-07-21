import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { calculateSplitPlanCost } from "@/lib/content/model-cost";
import type { ModelPricingRecord } from "@/lib/content/model-pricing";
import {
  DEFAULT_TOKEN_FIELDS,
  derivePlaygroundCostState,
  formatUsd,
  ModelCostPlayground,
  parseTokenField,
} from "./index";
import type { ModelCostPlaygroundMessages } from "./types";

afterEach(() => {
  cleanup();
});

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

const fixtureModels = [gpt4oPricing, claudePricing];

const messages: ModelCostPlaygroundMessages = {
  primaryLabel: "Primary model",
  secondaryLabel: "Secondary model",
  totalLabel: "Live total R",
  recommendation: "Prefer the cheaper plan for this token mix.",
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
};

describe("parseTokenField / derivePlaygroundCostState", () => {
  test("rejects empty, negative, and non-numeric token fields", () => {
    expect(parseTokenField("")).toBeNull();
    expect(parseTokenField("  ")).toBeNull();
    expect(parseTokenField("-1")).toBeNull();
    expect(parseTokenField("abc")).toBeNull();
    expect(parseTokenField("200000")).toBe(200_000);
  });

  test("matches calculateSplitPlanCost for default fixture tokens", () => {
    const derived = derivePlaygroundCostState({
      models: fixtureModels,
      primaryModelId: gpt4oPricing.id,
      secondaryModelId: claudePricing.id,
      tokens: DEFAULT_TOKEN_FIELDS,
    });

    expect(derived.status).toBe("success");
    if (derived.status !== "success") {
      return;
    }

    const expected = calculateSplitPlanCost({
      primary: gpt4oPricing,
      secondary: claudePricing,
      plannerUsage: {
        inputTokens: 200_000,
        outputTokens: 50_000,
      },
      executorUsage: {
        inputTokens: 1_000_000,
        outputTokens: 200_000,
      },
    });

    expect(derived.result).toEqual(expected);
    expect(derived.result.primaryOnly.totalUsd).toBe(5.5);
    expect(derived.result.split.totalUsd).toBe(7);
  });

  test("returns empty when models list is empty", () => {
    expect(
      derivePlaygroundCostState({
        models: [],
        primaryModelId: gpt4oPricing.id,
        secondaryModelId: claudePricing.id,
        tokens: DEFAULT_TOKEN_FIELDS,
      }).status,
    ).toBe("empty");
  });
});

describe("ModelCostPlayground", () => {
  test("displays totals that match calculateSplitPlanCost for fixture models", () => {
    render(
      <ModelCostPlayground
        defaultPrimaryModelId={gpt4oPricing.id}
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={fixtureModels}
      />,
    );

    const expected = calculateSplitPlanCost({
      primary: gpt4oPricing,
      secondary: claudePricing,
      plannerUsage: {
        inputTokens: 200_000,
        outputTokens: 50_000,
      },
      executorUsage: {
        inputTokens: 1_000_000,
        outputTokens: 200_000,
      },
    });

    const root = screen.getByRole("region", { name: messages.totalLabel });
    expect(root.getAttribute("data-state")).toBe("success");

    expect(screen.getByLabelText(messages.primaryLabel)).toBeTruthy();
    expect(screen.getByLabelText(messages.secondaryLabel)).toBeTruthy();

    // Prefer data attributes for exact USD wiring assertions.
    expect(root.querySelector("[data-primary-only-total]")?.textContent).toBe(
      formatUsd(expected.primaryOnly.totalUsd),
    );
    expect(root.querySelector("[data-split-total]")?.textContent).toBe(
      formatUsd(expected.split.totalUsd),
    );
    expect(root.querySelector("[data-total-r-value]")?.textContent).toBe(
      formatUsd(
        Math.min(expected.primaryOnly.totalUsd, expected.split.totalUsd),
      ),
    );

    expect(screen.getByText(messages.primaryOnlyLabel)).toBeTruthy();
    expect(screen.getByText(messages.plannerInputLabel)).toBeTruthy();
  });

  test("updating a token field recomputes displayed totals from the calculator", async () => {
    const user = userEvent.setup();
    render(
      <ModelCostPlayground
        defaultPrimaryModelId={gpt4oPricing.id}
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={fixtureModels}
      />,
    );

    const plannerInput = screen.getByLabelText(messages.plannerInputLabel);
    await user.clear(plannerInput);
    await user.type(plannerInput, "0");

    const expected = calculateSplitPlanCost({
      primary: gpt4oPricing,
      secondary: claudePricing,
      plannerUsage: { inputTokens: 0, outputTokens: 50_000 },
      executorUsage: {
        inputTokens: 1_000_000,
        outputTokens: 200_000,
      },
    });

    const root = screen.getByRole("region", { name: messages.totalLabel });
    expect(root.querySelector("[data-primary-only-total]")?.textContent).toBe(
      formatUsd(expected.primaryOnly.totalUsd),
    );
    expect(root.querySelector("[data-split-total]")?.textContent).toBe(
      formatUsd(expected.split.totalUsd),
    );
  });

  test("empty models shows the empty message and disables controls", () => {
    render(
      <ModelCostPlayground
        defaultPrimaryModelId={gpt4oPricing.id}
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={[]}
      />,
    );

    const root = screen.getByRole("region", { name: messages.totalLabel });
    expect(root.getAttribute("data-state")).toBe("empty");
    expect(screen.getByText(messages.emptyModelsMessage)).toBeTruthy();
    expect(root.querySelector("[data-total-r-value]")).toBeNull();
    expect(
      (screen.getByLabelText(messages.primaryLabel) as HTMLSelectElement)
        .disabled,
    ).toBe(true);
  });

  test("missing default model ids show an explicit error path", () => {
    render(
      <ModelCostPlayground
        defaultPrimaryModelId="model.missing.primary"
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={fixtureModels}
      />,
    );

    const root = screen.getByRole("region", { name: messages.totalLabel });
    expect(root.getAttribute("data-state")).toBe("error");
    expect(root.querySelector("[data-playground-status]")?.textContent).toBe(
      messages.missingModelMessage,
    );
    expect(root.querySelector("[data-total-r-value]")).toBeNull();
  });

  test("invalid token input shows error and hides success totals", () => {
    render(
      <ModelCostPlayground
        defaultPrimaryModelId={gpt4oPricing.id}
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={fixtureModels}
      />,
    );

    const plannerInput = screen.getByLabelText(messages.plannerInputLabel);
    fireEvent.change(plannerInput, { target: { value: "-5" } });

    const root = screen.getByRole("region", { name: messages.totalLabel });
    expect(root.getAttribute("data-state")).toBe("error");
    expect(screen.getByText(messages.invalidTokensMessage)).toBeTruthy();
    expect(root.querySelector("[data-total-r-value]")).toBeNull();
  });
});
