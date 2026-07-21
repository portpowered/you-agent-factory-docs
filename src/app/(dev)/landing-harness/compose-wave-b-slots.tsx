import type { ReactNode } from "react";
import {
  FactoryCarousel,
  type FactoryCarouselProps,
  type FactorySlideData,
  FaqPanel,
  type FaqPanelItem,
  type FaqPanelProps,
} from "@/features/landing-page";
import type { LandingPageSlots } from "@/features/landing-page/LandingPage";
import {
  fixtureLandingPageData,
  type LandingCarouselData,
  type LandingFaqData,
} from "@/features/landing-page/landing-page.data";

/**
 * Wave B slots filled on landing-harness. Unwired keys are omitted so
 * LandingPage keeps labeled placeholders — no fake content trees.
 * Incremental: carousel + faq; cta follows in a later story.
 */
export const WIRED_WAVE_B_SLOTS = [
  "carousel",
  "faq",
] as const satisfies ReadonlyArray<keyof LandingPageSlots>;

export type WiredWaveBSlot = (typeof WIRED_WAVE_B_SLOTS)[number];

export type WaveBLandingHarnessSlots = Pick<LandingPageSlots, WiredWaveBSlot>;

/** Harness-local FAQ heading — same default as (dev)/faq-cta-harness. */
const FAQ_PANEL_HEADING = "FAQ";

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

/**
 * Map landing fixture FAQ items onto the public FaqPanel / FaqPanelItem
 * contract (id / question / answer). No invented FAQ schemas.
 */
export function mapFixtureFaqToFaqPanelProps(
  faq: LandingFaqData = fixtureLandingPageData.faq,
): Pick<FaqPanelProps, "items" | "heading"> {
  const items: FaqPanelItem[] = faq.items.map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
  }));

  return { items, heading: FAQ_PANEL_HEADING };
}

/** Real Wave B carousel slot fill for landing-harness (W-integrate). */
export function composeWaveBCarouselSlot(
  carousel: LandingCarouselData = fixtureLandingPageData.carousel,
): ReactNode {
  return (
    <FactoryCarousel {...mapFixtureCarouselToFactoryCarouselProps(carousel)} />
  );
}

/** Real Wave B faq slot fill for landing-harness (W-integrate). */
export function composeWaveBFaqSlot(
  faq: LandingFaqData = fixtureLandingPageData.faq,
): ReactNode {
  return <FaqPanel {...mapFixtureFaqToFaqPanelProps(faq)} />;
}

/**
 * Aggregate Wave B landing-harness slot props. Returns only wired keys so
 * remaining Wave B slots (cta until a later story) stay on LandingPage
 * placeholder defaults.
 */
export function composeWaveBLandingHarnessSlots(): WaveBLandingHarnessSlots {
  return {
    carousel: composeWaveBCarouselSlot(),
    faq: composeWaveBFaqSlot(),
  };
}
