import { notFound } from "next/navigation";
import { ModelCostPlaygroundHarness } from "./ModelCostPlaygroundHarness";

/**
 * Non-production harness for ModelCostPlayground (graph-pages W-cost-playground).
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1. Does not own
 * technique/blog MDX, orchestrator matrix, or inventory integrate.
 */
export default function ModelCostPlaygroundHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return <ModelCostPlaygroundHarness />;
}
