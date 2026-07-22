"use client";

import { FactoryCarousel } from "@/features/landing-page/components/FactoryCarousel";
import type { FactorySlideData } from "@/features/landing-page/components/FactorySlide";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";

/**
 * Fixture slides for the carousel-only harness (current landing fixtures).
 * Local constants / existing data only — no CMS or schema invention.
 */
export const FACTORY_CAROUSEL_HARNESS_SLIDES: FactorySlideData[] = [
  ...fixtureLandingPageData.carousel.slides,
];

/**
 * Carousel-only harness shell: neutral background, no landing chrome.
 * Used by `(dev)/factory-carousel-harness` so Wave B can review W-carousel alone.
 */
export function FactoryCarouselHarnessView() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 py-10 text-neutral-900"
      data-factory-carousel-harness=""
    >
      <div className="w-full max-w-3xl" data-factory-carousel-harness-stage="">
        <FactoryCarousel
          eyebrow="pre-installed factories"
          featureArtSrc="/home/octopus.png"
          initialIndex={Math.min(
            1,
            Math.max(0, FACTORY_CAROUSEL_HARNESS_SLIDES.length - 1),
          )}
          slides={FACTORY_CAROUSEL_HARNESS_SLIDES}
        />
      </div>
    </main>
  );
}
