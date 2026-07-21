import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  composeWaveBCarouselSlot,
  composeWaveBLandingHarnessSlots,
  mapFixtureCarouselToFactoryCarouselProps,
  WIRED_WAVE_B_SLOTS,
} from "./compose-wave-b-slots";

describe("composeWaveBCarouselSlot", () => {
  test("maps fixture slides onto FactoryCarousel public slide contract", () => {
    const props = mapFixtureCarouselToFactoryCarouselProps(
      fixtureLandingPageData.carousel,
    );

    expect(props.slides).toHaveLength(
      fixtureLandingPageData.carousel.slides.length,
    );
    for (const [index, slide] of props.slides.entries()) {
      const fixture = fixtureLandingPageData.carousel.slides[index];
      expect(slide.id).toBe(fixture?.id);
      expect(slide.title).toBe(fixture?.title);
      expect(slide.blurb).toBe(fixture?.blurb);
      expect(slide.command).toBe(fixture?.command);
      expect(slide).not.toHaveProperty("art");
    }
  });

  test("preserves caller-owned art ReactNode when fixture supplies one", () => {
    const art = <span data-testid="fixture-slide-art">art</span>;
    const props = mapFixtureCarouselToFactoryCarouselProps({
      slides: [
        {
          id: "with-art",
          title: "With art",
          blurb: "Has art node",
          command: "you --help",
          art,
        },
      ],
    });

    expect(props.slides[0]?.art).toBe(art);
  });

  test("composeWaveBCarouselSlot renders FactoryCarousel markers from fixture", () => {
    const html = renderToStaticMarkup(
      composeWaveBCarouselSlot() as ReactElement,
    );

    expect(html).toContain('data-factory-carousel=""');
    expect(html).not.toContain('data-landing-placeholder="carousel"');

    for (const slide of fixtureLandingPageData.carousel.slides) {
      expect(html).toContain(slide.title);
      expect(html).toContain(slide.blurb);
      expect(html).toContain(slide.command);
      expect(html).toContain(`data-factory-slide="${slide.id}"`);
    }
  });
});

describe("composeWaveBLandingHarnessSlots", () => {
  test("returns only currently wired Wave B slot keys", () => {
    const slots = composeWaveBLandingHarnessSlots();
    const keys = Object.keys(slots).sort();

    expect(keys).toEqual([...WIRED_WAVE_B_SLOTS].sort());
    expect(slots).toHaveProperty("carousel");
    expect(slots).not.toHaveProperty("faq");
    expect(slots).not.toHaveProperty("cta");
    expect(slots).not.toHaveProperty("header");
  });

  test("wired carousel renders FactoryCarousel; aggregate does not invent faq/cta trees", () => {
    const slots = composeWaveBLandingHarnessSlots();
    const carouselHtml = renderToStaticMarkup(slots.carousel as ReactElement);

    expect(carouselHtml).toContain('data-factory-carousel=""');
    expect(carouselHtml).toContain(
      fixtureLandingPageData.carousel.slides[0]?.title ?? "",
    );
    expect(carouselHtml).not.toContain(
      fixtureLandingPageData.faq.items[0]?.question ?? "",
    );
    expect(carouselHtml).not.toContain(fixtureLandingPageData.cta.headline);
  });
});
