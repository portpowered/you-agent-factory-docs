/**
 * Production gate for `(dev)/teaching-ui-harness`, matching component-examples /
 * sphere-harness: allow outside production, or when the enable flag is set.
 */
export function isTeachingUiHarnessEnabled(env: {
  NODE_ENV?: string;
  ENABLE_COMPONENT_EXAMPLES?: string;
}): boolean {
  return env.NODE_ENV !== "production" || env.ENABLE_COMPONENT_EXAMPLES === "1";
}
