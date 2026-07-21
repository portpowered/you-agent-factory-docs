"use client";

import { MissingMessageKey } from "@/features/docs/components/MissingMessageKey";
import { usePageMessages } from "@/features/docs/components/page-messages-context";
import { ComparativeBarChart } from "@/features/teaching-ui/charts";
import { lookupMessage } from "@/lib/content/messages";
import type { TeachingCompareChartTotals } from "./build-teaching-compare-chart-data";

const SINGLE_SERIES_ID = "single-model";
const SPLIT_SERIES_ID = "split";

type CompareCostChartViewProps = {
  totals: TeachingCompareChartTotals | null;
};

/**
 * Client view for CompareChartSlot: messages drive visible strings; numeric
 * totals come from the server soft-wire (listModelPricing + cost math).
 */
export function CompareCostChartView({ totals }: CompareCostChartViewProps) {
  const { messages, isDev } = usePageMessages();

  if (!totals) {
    return (
      <aside
        aria-label="Comparative cost chart"
        className="rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant"
        data-compare-chart-slot="placeholder"
        data-testid="comparative-cost-chart-placeholder"
      >
        Comparative cost chart
      </aside>
    );
  }

  const titleResult = lookupMessage(messages, "links.compareChartTitle");
  if (!titleResult.ok) {
    if (isDev) {
      return (
        <MissingMessageKey
          messageKey="links.compareChartTitle"
          reason={titleResult.reason}
        />
      );
    }
    return null;
  }

  const categoryResult = lookupMessage(
    messages,
    "links.compareChartCategoryTotal",
  );
  if (!categoryResult.ok) {
    if (isDev) {
      return (
        <MissingMessageKey
          messageKey="links.compareChartCategoryTotal"
          reason={categoryResult.reason}
        />
      );
    }
    return null;
  }

  const singleLabelResult = lookupMessage(
    messages,
    "links.compareChartSingleModelLabel",
  );
  if (!singleLabelResult.ok) {
    if (isDev) {
      return (
        <MissingMessageKey
          messageKey="links.compareChartSingleModelLabel"
          reason={singleLabelResult.reason}
        />
      );
    }
    return null;
  }

  const splitLabelResult = lookupMessage(
    messages,
    "links.compareChartSplitLabel",
  );
  if (!splitLabelResult.ok) {
    if (isDev) {
      return (
        <MissingMessageKey
          messageKey="links.compareChartSplitLabel"
          reason={splitLabelResult.reason}
        />
      );
    }
    return null;
  }

  const yLabelResult = lookupMessage(messages, "links.compareChartYLabel");
  if (!yLabelResult.ok) {
    if (isDev) {
      return (
        <MissingMessageKey
          messageKey="links.compareChartYLabel"
          reason={yLabelResult.reason}
        />
      );
    }
    return null;
  }

  return (
    <ComparativeBarChart
      categories={[categoryResult.value]}
      focusSeriesId={SPLIT_SERIES_ID}
      series={[
        {
          id: SINGLE_SERIES_ID,
          label: singleLabelResult.value,
          values: [totals.primaryOnlyUsd],
        },
        {
          id: SPLIT_SERIES_ID,
          label: splitLabelResult.value,
          values: [totals.splitUsd],
        },
      ]}
      title={titleResult.value}
      yLabel={yLabelResult.value}
    />
  );
}
