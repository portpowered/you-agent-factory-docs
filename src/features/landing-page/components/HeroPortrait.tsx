"use client";

import { type CSSProperties, useRef } from "react";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { useGsapMotion } from "@/features/landing-page/motion/use-gsap-motion";
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
export const HERO_PORTRAIT_SIZES = "(max-width: 768px) 78vw, 480px";

/** Default descriptive alt for the fixture portrait subject. */
export const HERO_PORTRAIT_DEFAULT_ALT = "Portrait";

/**
 * How far the portrait sinks, as a percentage of its own height, by the time
 * the hero has left the viewport. Far enough to carry the head fully under the
 * middle-scene transition art — a shorter travel leaves it half-submerged with
 * the top of the head still showing above the painted edge.
 */
export const HERO_PORTRAIT_SINK_PERCENT = 92;

/**
 * Hero woman-head portrait with layout-appropriate responsive sizes.
 *
 * Uses the project’s established landing-art image host (`<img>`) with an
 * explicit `sizes` attribute so responsive loading matches the constrained
 * portrait width rather than a bare missing/100vw default.
 *
 * Scroll behaviour: the portrait sinks as the hero leaves the viewport, so it
 * passes under the painted transition at the top of the middle scene and fades
 * out rather than sitting on top of it. Motion is scrubbed against scroll
 * position — the reader drives it — and is skipped entirely under reduced
 * motion, where the portrait stays at rest and fully opaque.
 */
export function HeroPortrait({
  src = HERO_PORTRAIT_DEFAULT_SRC,
  alt = HERO_PORTRAIT_DEFAULT_ALT,
  className,
  style,
}: HeroPortraitProps) {
  const hasSrc = typeof src === "string" && src.length > 0;
  const isDecorative = alt === "";
  const ref = useRef<HTMLDivElement>(null);

  const { reduced } = useGsapMotion(ref, (element, { gsap }) => {
    // Anchor to the hero so the sink is timed to that section leaving the
    // viewport, not to the portrait's own much shorter box.
    const trigger = element.closest("[data-hero-section]") ?? element;

    // Travel only — no fade. The portrait has to still be fully painted when
    // it reaches the transition art, otherwise it reads as vanishing into flat
    // navy before anything covers it.
    gsap.fromTo(
      element,
      { yPercent: 0 },
      {
        yPercent: HERO_PORTRAIT_SINK_PERCENT,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "bottom 95%",
          end: "bottom 15%",
          scrub: 0.5,
        },
      },
    );
  });

  return (
    <div
      aria-hidden={isDecorative ? true : undefined}
      className={cn(
        "relative block w-full max-w-[min(100%,30rem)] select-none drop-shadow-[0_20px_24px_rgba(0,0,0,0.3)]",
        className,
      )}
      data-hero-portrait=""
      data-hero-portrait-motion={reduced ? "static" : "sink"}
      ref={ref}
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
