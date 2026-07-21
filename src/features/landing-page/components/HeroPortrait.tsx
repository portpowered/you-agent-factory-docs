import type { CSSProperties } from "react";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { cn } from "@/lib/utils";

export type HeroPortraitProps = {
  /**
   * Portrait image URL.
   * Defaults to staged `landingHomeAssets.womanHead` (`/home/woman-head.png`).
   * Pass a harness-safe fixture src when the staged asset is absent.
   * Empty string keeps a stable empty host (no crash).
   */
  src?: string;
  /**
   * Accessible name for the portrait.
   * Default is a short descriptive alt for the fixture subject.
   * Pass `""` when the portrait is intentionally decorative.
   */
  alt?: string;
  /** Root className for layout / positioning in hero chrome. */
  className?: string;
  /** Optional inline styles for absolute anchoring in hero composition. */
  style?: CSSProperties;
};

export const HERO_PORTRAIT_DEFAULT_SRC = landingHomeAssets.womanHead;

/** Intrinsic pixel size of staged `woman-head.png`. */
export const HERO_PORTRAIT_INTRINSIC_WIDTH = 733;
export const HERO_PORTRAIT_INTRINSIC_HEIGHT = 801;

/**
 * Responsive `sizes` for constrained hero portrait art.
 * Matches layout intent: majority of a narrow viewport, ~320px on desktop —
 * not an unconstrained full-viewport / 100vw default.
 */
export const HERO_PORTRAIT_SIZES = "(max-width: 768px) 60vw, 320px";

/** Default descriptive alt for the fixture portrait subject. */
export const HERO_PORTRAIT_DEFAULT_ALT = "Portrait";

/**
 * Hero woman-head portrait with layout-appropriate responsive sizes.
 *
 * Uses the project’s established landing-art image host (`<img>`) with an
 * explicit `sizes` attribute so responsive loading matches the constrained
 * portrait width rather than a bare missing/100vw default.
 */
export function HeroPortrait({
  src = HERO_PORTRAIT_DEFAULT_SRC,
  alt = HERO_PORTRAIT_DEFAULT_ALT,
  className,
  style,
}: HeroPortraitProps) {
  const hasSrc = typeof src === "string" && src.length > 0;
  const isDecorative = alt === "";

  return (
    <div
      aria-hidden={isDecorative ? true : undefined}
      className={cn(
        "relative block max-w-[min(100%,20rem)] select-none",
        className,
      )}
      data-hero-portrait=""
      style={style}
    >
      {hasSrc ? (
        <img
          alt={alt}
          className="block h-auto w-full max-w-full"
          data-hero-portrait-image=""
          decoding="async"
          draggable={false}
          height={HERO_PORTRAIT_INTRINSIC_HEIGHT}
          sizes={HERO_PORTRAIT_SIZES}
          src={src}
          width={HERO_PORTRAIT_INTRINSIC_WIDTH}
        />
      ) : null}
    </div>
  );
}
