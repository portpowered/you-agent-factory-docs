import type { ReactNode } from "react";
import {
  FactoryCarousel,
  type FactoryCarouselProps,
  type FactorySlideData,
} from "@/features/landing-page";
import type { LandingPageSlots } from "@/features/landing-page/LandingPage";
import {
  fixtureLandingPageData,
  type LandingCarouselData,
} from "@/features/landing-page/landing-page.data";

/**
 * Wave B slots filled on landing-harness. Unwired keys are omitted so
 * LandingPage keeps labeled placeholders — no fake content trees.
 * Incremental: carousel first; faq / cta follow in later stories.
 */
export const WIRED_WAVE_B_SLOTS = ["carousel"] as const satisfies ReadonlyArray<
  keyof LandingPageSlots
>;

export type WiredWaveBSlot = (typeof WIRED_WAVE_B_SLOTS)[number];

export type WaveBLandingHarnessSlots = Pick<LandingPageSlots, WiredWaveBSlot>;

/**
 * Map landing fixture carousel slides onto the public FactoryCarousel /
 * FactorySlideData contract. Keeps id / title / blurb / command only; omits
 * `art` unless the fixture already supplies a caller-owned ReactNode (no path
 * → ReactNode invention from strings).
 */
export function mapFixtureCarouselToFactoryCarouselProps(
  carousel: LandingCarouselData = fixtureLandingPageData.carousel,
): Pick<FactoryCarouselProps, "slides"> {
  const slides: FactorySlideData[] = carousel.slides.map((slide) => {
    const mapped: FactorySlideData = {
      id: slide.id,
      title: slide.title,
      blurb: slide.blurb,
      command: slide.command,
    };
    if (slide.art != null) {
      mapped.art = slide.art;
    }
    return mapped;
  });

  return { slides };
}

/** Real Wave B carousel slot fill for landing-harness (W-integrate). */
export function composeWaveBCarouselSlot(
  carousel: LandingCarouselData = fixtureLandingPageData.carousel,
): ReactNode {
  return (
    <FactoryCarousel {...mapFixtureCarouselToFactoryCarouselProps(carousel)} />
  );
}

/**
 * Aggregate Wave B landing-harness slot props. Returns only wired keys so
 * remaining Wave B slots (faq / cta until later stories) stay on LandingPage
 * placeholder defaults.
 */
export function composeWaveBLandingHarnessSlots(): WaveBLandingHarnessSlots {
  return {
    carousel: composeWaveBCarouselSlot(),
  };
}
