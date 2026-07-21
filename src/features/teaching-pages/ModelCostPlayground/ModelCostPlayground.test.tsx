import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COMPARATIVE_CHART_FOCUS_COLORS } from "@/features/teaching-ui/charts/focus-colors";
import { calculateSplitPlanCost } from "@/lib/content/model-cost";
import type { ModelPricingRecord } from "@/lib/content/model-pricing";
import {
  DEFAULT_TOKEN_FIELDS,
  derivePlaygroundBarChartProps,
  derivePlaygroundCostState,
  formatUsd,
  ModelCostPlayground,
  PLAYGROUND_SERIES_PRIMARY_ONLY,
  PLAYGROUND_SERIES_SPLIT,
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
  chartTitle: "Single-model vs split cost",
  chartCategoryLabel: "Total cost",
  chartXLabel: "Plan",
  chartYLabel: "USD",
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

    expect(
      screen.getAllByText(messages.primaryOnlyLabel).length,
    ).toBeGreaterThan(0);
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

describe("derivePlaygroundBarChartProps", () => {
  test("pins focusSeriesId to recommendedPlan and mirrors calc totals", () => {
    const costState = derivePlaygroundCostState({
      models: fixtureModels,
      primaryModelId: gpt4oPricing.id,
      secondaryModelId: claudePricing.id,
      tokens: DEFAULT_TOKEN_FIELDS,
    });

    expect(costState.status).toBe("success");
    if (costState.status !== "success") {
      return;
    }

    const chartProps = derivePlaygroundBarChartProps({ costState, messages });

    expect(chartProps.state).toBe("success");
    expect(chartProps.focusSeriesId).toBe(PLAYGROUND_SERIES_PRIMARY_ONLY);
    expect(chartProps.focusSeriesId).toBe(costState.recommendedPlan);
    expect(chartProps.title).toBe(messages.chartTitle);
    expect(chartProps.categories).toEqual([messages.chartCategoryLabel]);
    expect(chartProps.series.map((entry) => entry.id)).toEqual([
      PLAYGROUND_SERIES_PRIMARY_ONLY,
      PLAYGROUND_SERIES_SPLIT,
    ]);
    expect(chartProps.series[0]?.values[0]).toBe(
      costState.result.primaryOnly.totalUsd,
    );
    expect(chartProps.series[1]?.values[0]).toBe(
      costState.result.split.totalUsd,
    );
  });

  test("maps empty and error cost states to chart empty/error panels", () => {
    expect(
      derivePlaygroundBarChartProps({
        costState: { status: "empty" },
        messages,
      }).state,
    ).toBe("empty");

    expect(
      derivePlaygroundBarChartProps({
        costState: { status: "error", reason: "invalid-tokens" },
        messages,
      }).state,
    ).toBe("error");
  });
});

describe("ModelCostPlayground comparative chart", () => {
  test("composes ComparativeBarChart with recommended focusSeriesId", () => {
    render(
      <ModelCostPlayground
        defaultPrimaryModelId={gpt4oPricing.id}
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={fixtureModels}
      />,
    );

    const root = screen.getByRole("region", { name: messages.totalLabel });
    const chartWrap = root.querySelector("[data-cost-comparison-chart]");
    expect(chartWrap?.getAttribute("data-focus-series-id")).toBe(
      PLAYGROUND_SERIES_PRIMARY_ONLY,
    );
    expect(chartWrap?.getAttribute("data-recommended-plan")).toBe(
      PLAYGROUND_SERIES_PRIMARY_ONLY,
    );

    const chart = screen.getByRole("img", { name: messages.chartTitle });
    expect(chart).toBeTruthy();
    expect(chart.style.getPropertyValue("--color-primary-only")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(chart.style.getPropertyValue("--color-split")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );
  });

  test("changing models that flip the winner moves chart focus to split", () => {
    render(
      <ModelCostPlayground
        defaultPrimaryModelId={gpt4oPricing.id}
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={fixtureModels}
      />,
    );

    const root = screen.getByRole("region", { name: messages.totalLabel });
    expect(
      root
        .querySelector("[data-cost-comparison-chart]")
        ?.getAttribute("data-focus-series-id"),
    ).toBe(PLAYGROUND_SERIES_PRIMARY_ONLY);

    // Claude primary + GPT-4o secondary makes planner/executor split cheaper.
    fireEvent.change(screen.getByLabelText(messages.primaryLabel), {
      target: { value: claudePricing.id },
    });
    fireEvent.change(screen.getByLabelText(messages.secondaryLabel), {
      target: { value: gpt4oPricing.id },
    });

    const costState = derivePlaygroundCostState({
      models: fixtureModels,
      primaryModelId: claudePricing.id,
      secondaryModelId: gpt4oPricing.id,
      tokens: DEFAULT_TOKEN_FIELDS,
    });
    expect(costState.status).toBe("success");
    if (costState.status !== "success") {
      return;
    }
    expect(costState.recommendedPlan).toBe(PLAYGROUND_SERIES_SPLIT);

    const chartWrap = root.querySelector("[data-cost-comparison-chart]");
    expect(chartWrap?.getAttribute("data-focus-series-id")).toBe(
      PLAYGROUND_SERIES_SPLIT,
    );

    const chart = screen.getByRole("img", { name: messages.chartTitle });
    expect(chart.style.getPropertyValue("--color-split")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(chart.style.getPropertyValue("--color-primary-only")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );
  });

  test("empty models shows chart empty state instead of success bars", () => {
    render(
      <ModelCostPlayground
        defaultPrimaryModelId={gpt4oPricing.id}
        defaultSecondaryModelId={claudePricing.id}
        messages={messages}
        models={[]}
      />,
    );

    expect(screen.queryByRole("img", { name: messages.chartTitle })).toBeNull();
    const chartState = document.querySelector("[data-chart-state='empty']");
    expect(chartState).toBeTruthy();
  });
});
