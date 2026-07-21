/**
 * Landing-page public surface.
 *
 * Whale / bubbles (W-whale-bubbles): mount `<WhaleBubblesSection />` or compose
 * `<WhalePlate />` + `<FeatureBubbles armed … />` in a slot.
 *
 * Hero art (W-hero-art): export portrait, capability strip, Youi showcase,
 * TornEdge, and optional HeroSection chrome (sphere/terminal as ReactNode holes).
 * Integrate wires slots; do not flip production `/` from this barrel.
 */

export {
  CAPABILITY_STRIP_DEFAULT_ITEMS,
  CapabilityStrip,
  type CapabilityStripItem,
  type CapabilityStripProps,
} from "./components/CapabilityStrip";
export {
  DEFAULT_BUBBLE_CLASSES,
  type FeatureBubbleItem,
  FeatureBubbles,
  type FeatureBubblesProps,
  PRIMARY_BUBBLE_CLASSES,
} from "./components/FeatureBubbles";
export {
  HERO_PORTRAIT_DEFAULT_ALT,
  HERO_PORTRAIT_DEFAULT_SRC,
  HERO_PORTRAIT_INTRINSIC_HEIGHT,
  HERO_PORTRAIT_INTRINSIC_WIDTH,
  HERO_PORTRAIT_SIZES,
  HeroPortrait,
  type HeroPortraitProps,
} from "./components/HeroPortrait";
export {
  HERO_SECTION_DEFAULT_SUBTITLE,
  HERO_SECTION_DEFAULT_TITLE,
  HERO_SECTION_SPHERE_HOLE_MIN_HEIGHT,
  HERO_SECTION_TERMINAL_HOLE_MIN_HEIGHT,
  HeroSection,
  type HeroSectionProps,
} from "./components/HeroSection";
export {
  TORN_EDGE_DEFAULT_SRC,
  TornEdge,
  type TornEdgePlacement,
  type TornEdgeProps,
} from "./components/TornEdge";
export {
  WHALE_BUBBLES_FAQ_SPACER_MIN_HEIGHT,
  WHALE_BUBBLES_HARNESS_PRESETS,
  WhaleBubblesHarness,
  type WhaleBubblesHarnessPresetId,
} from "./components/WhaleBubblesHarness";
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
  YOUI_SHOWCASE_BACKGROUND_SIZES,
  YOUI_SHOWCASE_DEFAULT_BACKGROUND_SRC,
  YOUI_SHOWCASE_DEFAULT_GRAPH_ALT,
  YOUI_SHOWCASE_DEFAULT_GRAPH_SRC,
  YOUI_SHOWCASE_DEFAULT_TITLE,
  YOUI_SHOWCASE_GRAPH_INTRINSIC_HEIGHT,
  YOUI_SHOWCASE_GRAPH_INTRINSIC_WIDTH,
  YOUI_SHOWCASE_GRAPH_SIZES,
  YOUI_SHOWCASE_MONKEY_INTRINSIC_HEIGHT,
  YOUI_SHOWCASE_MONKEY_INTRINSIC_WIDTH,
  YouiShowcase,
  type YouiShowcaseProps,
} from "./components/YouiShowcase";
export {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
  WHALE_BUBBLES_HARNESS_SRC,
} from "./whale-bubbles.fixtures";
