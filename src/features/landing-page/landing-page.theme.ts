/**
 * Typed theme stub for the homepage landing chassis.
 *
 * Knob names for whale match homepage-2 motion-whale theme knobs.
 * Carousel and sphere defaults are stubs for later feature lanes.
 * Values are stable defaults only — not a product schema system.
 */

export type LandingCubicBezier = readonly [number, number, number, number];

export type LandingWhaleTheme = {
  initialScale: number;
  initialY: number;
  durationMs: number;
  ease: LandingCubicBezier;
  blurPx: number;
  viewAmount: number;
  bubbleDelayMs: number;
  parallaxFactor: number;
};

/** Depth-carousel motion knobs (neighbor scale/opacity/z). */
export type LandingCarouselTheme = {
  activeScale: number;
  neighborScale: number;
  neighborOpacity: number;
  farScale: number;
  farOpacity: number;
  transitionMs: number;
  dragThresholdPx: number;
};

/** Particle sphere canvas knobs. */
export type LandingSphereTheme = {
  particleCount: number;
  repulsion: number;
  radiusRatio: number;
};

export type LandingPageTheme = {
  whale: LandingWhaleTheme;
  carousel: LandingCarouselTheme;
  sphere: LandingSphereTheme;
};

export const landingPageTheme: LandingPageTheme = {
  whale: {
    initialScale: 0.78,
    initialY: 48,
    durationMs: 1600,
    ease: [0.16, 0.84, 0.22, 1],
    blurPx: 6,
    viewAmount: 0.3,
    bubbleDelayMs: 280,
    parallaxFactor: 0.4,
  },
  carousel: {
    activeScale: 1,
    neighborScale: 0.86,
    neighborOpacity: 0.55,
    farScale: 0.72,
    farOpacity: 0.28,
    transitionMs: 420,
    dragThresholdPx: 48,
  },
  sphere: {
    particleCount: 480,
    repulsion: 0.35,
    radiusRatio: 0.42,
  },
};

/** CSS custom-property map derived from the theme stub for root wrappers. */
export type LandingThemeCssVars = Record<`--landing-${string}`, string>;

export function landingThemeToCssVars(
  theme: LandingPageTheme = landingPageTheme,
): LandingThemeCssVars {
  const { whale, carousel, sphere } = theme;
  return {
    "--landing-whale-initial-scale": String(whale.initialScale),
    "--landing-whale-initial-y": `${whale.initialY}px`,
    "--landing-whale-duration-ms": `${whale.durationMs}ms`,
    "--landing-whale-blur-px": `${whale.blurPx}px`,
    "--landing-whale-view-amount": String(whale.viewAmount),
    "--landing-whale-bubble-delay-ms": `${whale.bubbleDelayMs}ms`,
    "--landing-whale-parallax-factor": String(whale.parallaxFactor),
    "--landing-carousel-active-scale": String(carousel.activeScale),
    "--landing-carousel-neighbor-scale": String(carousel.neighborScale),
    "--landing-carousel-neighbor-opacity": String(carousel.neighborOpacity),
    "--landing-carousel-far-scale": String(carousel.farScale),
    "--landing-carousel-far-opacity": String(carousel.farOpacity),
    "--landing-carousel-transition-ms": `${carousel.transitionMs}ms`,
    "--landing-carousel-drag-threshold-px": `${carousel.dragThresholdPx}px`,
    "--landing-sphere-particle-count": String(sphere.particleCount),
    "--landing-sphere-repulsion": String(sphere.repulsion),
    "--landing-sphere-radius-ratio": String(sphere.radiusRatio),
  };
}
