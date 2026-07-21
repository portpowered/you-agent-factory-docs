import { notFound } from "next/navigation";
import { ModelCostPlaygroundHarness } from "./ModelCostPlaygroundHarness";
import { isModelCostPlaygroundHarnessEnabled } from "./model-cost-playground-harness-gate";

/**
 * Non-production harness for ModelCostPlayground (graph-pages W-cost-playground).
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1. Does not own
 * technique/blog MDX, orchestrator matrix, or inventory integrate.
 */
export default function ModelCostPlaygroundHarnessPage() {
  if (!isModelCostPlaygroundHarnessEnabled(process.env)) {
    notFound();
  }

  return <ModelCostPlaygroundHarness />;
}
