/**
 * Landing-page public surface.
 *
 * W-faq-cta chrome (header / FAQ / CTA / footer art) and W-whale-bubbles
 * (whale plate + feature bubbles). Skeleton / integrate consumers mount these
 * via LandingPage slots — do not flip production `/` from this package alone.
 */

export {
  CtaBand,
  type CtaBandProps,
} from "./components/CtaBand";
export {
  FaqPanel,
  type FaqPanelItem,
  type FaqPanelProps,
} from "./components/FaqPanel";
export {
  DEFAULT_BUBBLE_CLASSES,
  type FeatureBubbleItem,
  FeatureBubbles,
  type FeatureBubblesProps,
  PRIMARY_BUBBLE_CLASSES,
} from "./components/FeatureBubbles";
export {
  LandingFooterArt,
  type LandingFooterArtProps,
} from "./components/LandingFooterArt";
export {
  LandingHeader,
  type LandingHeaderNavItem,
  type LandingHeaderProps,
} from "./components/LandingHeader";
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
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
  WHALE_BUBBLES_HARNESS_SRC,
} from "./whale-bubbles.fixtures";
