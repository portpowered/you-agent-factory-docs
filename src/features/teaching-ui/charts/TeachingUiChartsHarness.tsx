"use client";

import { useState } from "react";
import { ComparativeBarChart } from "./ComparativeBarChart";
import { ComparativeLineChart } from "./ComparativeLineChart";

const BAR_TITLE = "Comparative model token cost";
const LINE_TITLE = "Comparative model cost vs tokens";

const BAR_CATEGORIES = ["Input", "Output"];

const BAR_SERIES = [
  { id: "model-a", label: "Model A", values: [12, 8] },
  { id: "model-b", label: "Model B", values: [9, 11] },
];

const LINE_POINTS = [
  { tokens: 1_000, "model-a": 12, "model-b": 9 },
  { tokens: 2_000, "model-a": 18, "model-b": 14 },
  { tokens: 3_000, "model-a": 22, "model-b": 19 },
];

const LINE_SERIES = [
  { id: "model-a", label: "Model A" },
  { id: "model-b", label: "Model B" },
];

const FOCUS_OPTIONS = [
  { id: "model-a", label: "Model A" },
  { id: "model-b", label: "Model B" },
] as const;

const CATEGORY_FOCUS_OPTIONS = [
  { id: undefined, label: "All categories" },
  { id: "Input", label: "Input" },
  { id: "Output", label: "Output" },
] as const;

/**
 * Dev-only dual-chart focus harness for comparative bar + line recipes.
 * Fixture data only — not linked from production navigation.
 */
export function TeachingUiChartsHarness() {
  const [focusSeriesId, setFocusSeriesId] = useState<string>("model-a");
  const [focusCategoryId, setFocusCategoryId] = useState<string | undefined>(
    "Input",
  );

  return (
    <main
      className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 bg-background px-6 py-10 text-foreground"
      data-testid="teaching-ui-charts-harness"
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Teaching-ui comparative charts harness
        </h1>
        <p className="text-sm text-muted-foreground">
          Fixture surface for ComparativeBarChart and ComparativeLineChart with
          a toggleable focus id. Not linked from production navigation.
        </p>
      </header>

      <section
        aria-labelledby="charts-focus-controls-heading"
        className="space-y-3"
        data-testid="teaching-ui-charts-harness-focus-controls"
      >
        <h2 className="text-lg font-medium" id="charts-focus-controls-heading">
          Focus controls
        </h2>
        <div className="flex flex-wrap gap-6">
          <label className="flex flex-col gap-1 text-sm">
            <span>Focus series</span>
            <select
              className="rounded-md border border-border bg-background px-3 py-2"
              data-testid="teaching-ui-charts-harness-focus-series"
              onChange={(event) => setFocusSeriesId(event.target.value)}
              value={focusSeriesId}
            >
              {FOCUS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Focus category (bar only)</span>
            <select
              className="rounded-md border border-border bg-background px-3 py-2"
              data-testid="teaching-ui-charts-harness-focus-category"
              onChange={(event) => {
                const next = event.target.value;
                setFocusCategoryId(next === "" ? undefined : next);
              }}
              value={focusCategoryId ?? ""}
            >
              {CATEGORY_FOCUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.id ?? ""}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        aria-labelledby="charts-bar-heading"
        className="space-y-3"
        data-testid="teaching-ui-charts-harness-bar"
      >
        <h2 className="text-lg font-medium" id="charts-bar-heading">
          ComparativeBarChart
        </h2>
        <ComparativeBarChart
          categories={BAR_CATEGORIES}
          focusCategoryId={focusCategoryId}
          focusSeriesId={focusSeriesId}
          series={BAR_SERIES}
          title={BAR_TITLE}
          xLabel="Token bucket"
          yLabel="Cost"
        />
      </section>

      <section
        aria-labelledby="charts-line-heading"
        className="space-y-3"
        data-testid="teaching-ui-charts-harness-line"
      >
        <h2 className="text-lg font-medium" id="charts-line-heading">
          ComparativeLineChart
        </h2>
        <ComparativeLineChart
          focusSeriesId={focusSeriesId}
          points={LINE_POINTS}
          series={LINE_SERIES}
          title={LINE_TITLE}
          xKey="tokens"
          xLabel="Tokens"
          yLabel="Cost"
        />
      </section>
    </main>
  );
}

export const TEACHING_UI_CHARTS_HARNESS_TITLES = {
  bar: BAR_TITLE,
  line: LINE_TITLE,
} as const;
