/**
 * Production gate for `(dev)/model-cost-playground-harness`, matching
 * component-examples / teaching-ui-charts-harness: allow outside production,
 * or when the enable flag is set.
 */
export function isModelCostPlaygroundHarnessEnabled(env: {
  NODE_ENV?: string;
  ENABLE_COMPONENT_EXAMPLES?: string;
}): boolean {
  return env.NODE_ENV !== "production" || env.ENABLE_COMPONENT_EXAMPLES === "1";
}
