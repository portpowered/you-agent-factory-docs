/**
 * Production gate for `(dev)/factory-carousel-harness`, matching component-examples /
 * sphere-harness: allow outside production, or when the enable flag is set.
 */
export function isFactoryCarouselHarnessEnabled(env: {
  NODE_ENV?: string;
  ENABLE_COMPONENT_EXAMPLES?: string;
}): boolean {
  return env.NODE_ENV !== "production" || env.ENABLE_COMPONENT_EXAMPLES === "1";
}
