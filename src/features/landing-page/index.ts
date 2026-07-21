/**
 * Landing-page public surface (W-whale-bubbles).
 *
 * Skeleton / integrate consumers can mount either:
 * - `<WhaleBubblesSection />` (owned settle → delay orchestration), or
 * - `<WhalePlate />` + `<FeatureBubbles armed … />` composed in a slot.
 */

export {
  DEFAULT_BUBBLE_CLASSES,
  type FeatureBubbleItem,
  FeatureBubbles,
  type FeatureBubblesProps,
  PRIMARY_BUBBLE_CLASSES,
} from "./components/FeatureBubbles";
export {
  WhaleBubblesSection,
  type WhaleBubblesSectionProps,
} from "./components/WhaleBubblesSection";
export {
  DEFAULT_WHALE_PLATE_THEME,
  WHALE_PLATE_DEFAULT_SRC,
  WhalePlate,
  type WhalePlateProps,
} from "./components/WhalePlate";
export {
  resolveWhalePlateTheme,
  type WhaleCubicBezier,
  type WhalePlateThemeKnobs,
  whaleEaseToCss,
} from "./components/whale-plate.theme";
export {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
  WHALE_BUBBLES_HARNESS_SRC,
} from "./whale-bubbles.fixtures";
