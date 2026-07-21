import { notFound } from "next/navigation";
import { TeachingUiChartsHarness } from "@/features/teaching-ui/charts/TeachingUiChartsHarness";

/**
 * Non-production harness for teaching-ui comparative bar + line charts
 * (graph-pages W-charts). Hidden in production unless
 * ENABLE_COMPONENT_EXAMPLES=1. Does not own lists, tables, registries, or
 * production pages.
 */
export default function TeachingUiChartsHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return <TeachingUiChartsHarness />;
}
