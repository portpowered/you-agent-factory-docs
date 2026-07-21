import { listModelPricing } from "@/lib/content/model-pricing";
import { buildTeachingCompareChartTotals } from "./build-teaching-compare-chart-data";
import { CompareCostChartView } from "./CompareCostChartView";

/**
 * Soft-wires public ComparativeBarChart for the CompareChart slot.
 *
 * Loads commit-only pricing via `listModelPricing()` (read-only), computes
 * single-model vs split totals with `calculateSplitPlanCost`, and passes
 * numbers to the client chart view. Visible strings stay in page messages.
 */
export function CompareChartSlot() {
  const totals = buildTeachingCompareChartTotals(listModelPricing());
  return <CompareCostChartView totals={totals} />;
}
