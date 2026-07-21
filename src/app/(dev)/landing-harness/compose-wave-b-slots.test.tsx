import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  composeWaveBCarouselSlot,
  composeWaveBCtaSlot,
  composeWaveBFaqSlot,
  composeWaveBLandingHarnessSlots,
  mapFixtureCarouselToFactoryCarouselProps,
  mapFixtureCtaToCtaBandProps,
  mapFixtureFaqToFaqPanelProps,
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

describe("composeWaveBFaqSlot", () => {
  test("maps fixture FAQ items onto FaqPanel public item contract", () => {
    const props = mapFixtureFaqToFaqPanelProps(fixtureLandingPageData.faq);

    expect(props.items).toHaveLength(fixtureLandingPageData.faq.items.length);
    expect(props.heading).toBe("FAQ");
    for (const [index, item] of props.items.entries()) {
      const fixture = fixtureLandingPageData.faq.items[index];
      expect(item.id).toBe(fixture?.id);
      expect(item.question).toBe(fixture?.question);
      expect(item.answer).toBe(fixture?.answer);
    }
  });

  test("composeWaveBFaqSlot renders FaqPanel markers from fixture", () => {
    const html = renderToStaticMarkup(composeWaveBFaqSlot() as ReactElement);

    expect(html).toContain('data-landing-faq-panel=""');
    expect(html).toContain('data-landing-faq-parchment=""');
    expect(html).not.toContain('data-landing-placeholder="faq"');

    for (const item of fixtureLandingPageData.faq.items) {
      expect(html).toContain(item.question);
      expect(html).toContain(item.answer);
      expect(html).toContain(`data-landing-faq-item-id="${item.id}"`);
    }
  });
});

describe("composeWaveBCtaSlot", () => {
  test("maps fixture CTA fields onto CtaBand public contract with harness defaults", () => {
    const props = mapFixtureCtaToCtaBandProps(fixtureLandingPageData.cta);

    expect(props.headline).toBe(fixtureLandingPageData.cta.headline);
    expect(props.supporting).toBe(fixtureLandingPageData.cta.supporting);
    expect(props.installCommand).toBe(
      fixtureLandingPageData.cta.installCommand,
    );
    expect(props.ctaLabel).toBe("Install the CLI");
    expect(props.ctaHref).toBe("/docs/guides");
  });

  test("composeWaveBCtaSlot renders CtaBand markers from fixture", () => {
    const html = renderToStaticMarkup(composeWaveBCtaSlot() as ReactElement);

    expect(html).toContain('data-landing-cta-band=""');
    expect(html).toContain('data-landing-cta-fog=""');
    expect(html).not.toContain('data-landing-placeholder="cta"');
    expect(html).toContain(fixtureLandingPageData.cta.headline);
    expect(html).toContain(fixtureLandingPageData.cta.supporting);
    expect(html).toContain(fixtureLandingPageData.cta.installCommand);
    expect(html).toContain("Install the CLI");
    expect(html).toContain('href="/docs/guides"');
  });
});

describe("composeWaveBLandingHarnessSlots", () => {
  test("returns only currently wired Wave B slot keys", () => {
    const slots = composeWaveBLandingHarnessSlots();
    const keys = Object.keys(slots).sort();

    expect(keys).toEqual([...WIRED_WAVE_B_SLOTS].sort());
    expect(slots).toHaveProperty("carousel");
    expect(slots).toHaveProperty("faq");
    expect(slots).toHaveProperty("cta");
    expect(slots).not.toHaveProperty("header");
  });

  test("wired carousel, faq, and cta render public markers from fixture", () => {
    const slots = composeWaveBLandingHarnessSlots();
    const carouselHtml = renderToStaticMarkup(slots.carousel as ReactElement);
    const faqHtml = renderToStaticMarkup(slots.faq as ReactElement);
    const ctaHtml = renderToStaticMarkup(slots.cta as ReactElement);

    expect(carouselHtml).toContain('data-factory-carousel=""');
    expect(carouselHtml).toContain(
      fixtureLandingPageData.carousel.slides[0]?.title ?? "",
    );
    expect(faqHtml).toContain('data-landing-faq-panel=""');
    expect(faqHtml).toContain(
      fixtureLandingPageData.faq.items[0]?.question ?? "",
    );
    expect(ctaHtml).toContain('data-landing-cta-band=""');
    expect(ctaHtml).toContain(fixtureLandingPageData.cta.headline);
    expect(ctaHtml).toContain(fixtureLandingPageData.cta.supporting);
  });
});
