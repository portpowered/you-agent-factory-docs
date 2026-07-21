import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  formatUsd,
  PLAYGROUND_SERIES_PRIMARY_ONLY,
} from "@/features/teaching-pages/ModelCostPlayground";
import { calculateSplitPlanCost } from "@/lib/content/model-cost";
import type { ModelPricingRecord } from "@/lib/content/model-pricing";
import { ModelCostPlaygroundHarness } from "./ModelCostPlaygroundHarness";

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

describe("ModelCostPlaygroundHarness", () => {
  test("mounts fixture selects, live R, chart focus, and recommendation", () => {
    render(<ModelCostPlaygroundHarness />);

    const root = screen.getByTestId("model-cost-playground-harness");
    expect(root).toBeTruthy();

    expect(screen.getByLabelText("Primary model")).toBeTruthy();
    expect(screen.getByLabelText("Secondary model")).toBeTruthy();
    expect(screen.getByLabelText("Planner input tokens")).toBeTruthy();

    const playground = root.querySelector("[data-model-cost-playground]");
    expect(playground?.getAttribute("data-state")).toBe("success");
    expect(
      root.querySelector("[data-total-r-value]")?.textContent,
    ).toBeTruthy();

    const chartWrap = root.querySelector("[data-cost-comparison-chart]");
    expect(chartWrap?.getAttribute("data-focus-series-id")).toBe(
      PLAYGROUND_SERIES_PRIMARY_ONLY,
    );
    expect(root.querySelector("[data-comparative-bar-chart]")).toBeTruthy();

    const recommendation = screen.getByRole("region", {
      name: "Recommendation",
    });
    expect(recommendation.getAttribute("data-recommended-plan")).toBe(
      PLAYGROUND_SERIES_PRIMARY_ONLY,
    );
    expect(
      recommendation.querySelector("[data-recommendation-copy]")?.textContent,
    ).toBe(
      "Prefer running planner and executor on the primary model for this token mix.",
    );

    expect(screen.getAllByText("GPT-4o").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Claude Sonnet").length).toBeGreaterThan(0);
  });

  test("token edits update live R to match calculateSplitPlanCost", () => {
    render(<ModelCostPlaygroundHarness />);

    fireEvent.change(screen.getByLabelText("Planner input tokens"), {
      target: { value: "100000" },
    });

    const expected = calculateSplitPlanCost({
      primary: gpt4oPricing,
      secondary: claudePricing,
      plannerUsage: {
        inputTokens: 100_000,
        outputTokens: 50_000,
      },
      executorUsage: {
        inputTokens: 1_000_000,
        outputTokens: 200_000,
      },
    });

    const totalR = document.querySelector("[data-total-r-value]")?.textContent;
    expect(totalR).toBe(
      formatUsd(
        Math.min(expected.primaryOnly.totalUsd, expected.split.totalUsd),
      ),
    );
  });
});
