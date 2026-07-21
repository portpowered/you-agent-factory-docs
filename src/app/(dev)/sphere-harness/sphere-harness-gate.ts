/**
 * Production gate for `(dev)/sphere-harness`, matching component-examples /
 * reference-chrome-harness: allow outside production, or when the enable flag is set.
 */
export function isSphereHarnessEnabled(env: {
  NODE_ENV?: string;
  ENABLE_COMPONENT_EXAMPLES?: string;
}): boolean {
  return env.NODE_ENV !== "production" || env.ENABLE_COMPONENT_EXAMPLES === "1";
}
