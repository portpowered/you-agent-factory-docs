import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
} from "@/features/landing-page/whale-bubbles.fixtures";
import {
  composeProductionCapabilitySlot,
  composeProductionCarouselSlot,
  composeProductionCtaSlot,
  composeProductionFaqSlot,
  composeProductionFooterSlot,
  composeProductionHeaderSlot,
  composeProductionHeroSlot,
  composeProductionLandingSlots,
  composeProductionWhaleBubblesSlot,
  composeProductionYouiSlot,
  mapFixtureCarouselToFactoryCarouselProps,
  mapFixtureCommandsToTerminalLines,
  mapFixtureCommandsToTerminalProps,
  mapFixtureCtaToCtaBandProps,
  mapFixtureFaqToFaqPanelProps,
  mapFixtureFooterToSiteFooterProps,
  mapFixtureHeaderToLandingHeaderProps,
  mapFixtureWhaleBubblesToSectionProps,
  WIRED_PRODUCTION_LANDING_SLOTS,
} from "./compose-production-landing-slots";

describe("composeProductionHeaderSlot", () => {
  test("maps fixture brand and nav onto LandingHeader props", () => {
    const props = mapFixtureHeaderToLandingHeaderProps(
      fixtureLandingPageData.header,
    );

    expect(props.brand).toBe(fixtureLandingPageData.header.brand);
    expect(props.items).toEqual(
      fixtureLandingPageData.header.nav.map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
      })),
    );
  });

  test("renders LandingHeader markers from fixture", () => {
    const html = renderToStaticMarkup(
      composeProductionHeaderSlot() as ReactElement,
    );

    expect(html).toContain('data-landing-header=""');
    expect(html).toContain("you-agent-factory");
    expect(html).toContain("Docs");
    expect(html).toContain('href="/docs"');
    expect(html).not.toContain('data-landing-placeholder="header"');
  });
});

describe("composeProductionHeroSlot", () => {
  test("maps fixture commands onto Terminal lines without inventing props", () => {
    const lines = mapFixtureCommandsToTerminalLines({
      cta: fixtureLandingPageData.cta,
      carousel: fixtureLandingPageData.carousel,
    });

    expect(lines[0]).toBe(fixtureLandingPageData.cta.installCommand);
    expect(lines).toContain("you run --named @goal/example");
    expect(lines).toContain("you run --named @loop/write-review");
    expect(mapFixtureCommandsToTerminalProps()?.variant).toBe("install");
  });

  test("renders HeroSection with sphere and terminal fills", () => {
    const html = renderToStaticMarkup(
      composeProductionHeroSlot() as ReactElement,
    );

    expect(html).toContain('data-hero-section=""');
    expect(html).toContain(fixtureLandingPageData.hero.title);
    expect(html).toContain(fixtureLandingPageData.hero.subtitle);
    expect(html).toContain('data-particle-sphere=""');
    expect(html).toContain(fixtureLandingPageData.cta.installCommand);
    expect(html).not.toContain('data-landing-placeholder="sphere"');
    expect(html).not.toContain('data-landing-placeholder="terminal"');
  });
});

describe("composeProductionCapabilitySlot", () => {
  test("renders CapabilityStrip labels from fixture", () => {
    const html = renderToStaticMarkup(
      composeProductionCapabilitySlot() as ReactElement,
    );

    expect(html).toContain('data-capability-strip=""');
    expect(html).toContain("FLOWS");
    expect(html).toContain("AGENTS");
    expect(html).toContain("ENTRY");
    expect(html).toContain("OS");
  });
});

describe("composeProductionYouiSlot", () => {
  test("renders YouiShowcase from fixture title and imageSrc", () => {
    const html = renderToStaticMarkup(
      composeProductionYouiSlot() as ReactElement,
    );

    expect(html).toContain('data-youi-showcase=""');
    expect(html).toContain(fixtureLandingPageData.youi.title);
    expect(html).toContain(`src="${fixtureLandingPageData.youi.imageSrc}"`);
  });
});

describe("composeProductionCarouselSlot", () => {
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

  test("composeProductionCarouselSlot renders FactoryCarousel markers from fixture", () => {
    const html = renderToStaticMarkup(
      composeProductionCarouselSlot() as ReactElement,
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

describe("composeProductionFaqSlot", () => {
  test("maps fixture FAQ items onto FaqPanel public item contract", () => {
    const props = mapFixtureFaqToFaqPanelProps(fixtureLandingPageData.faq);

    expect(props.heading).toBe("FAQ");
    expect(props.items).toHaveLength(fixtureLandingPageData.faq.items.length);
    for (const [index, item] of props.items.entries()) {
      const fixture = fixtureLandingPageData.faq.items[index];
      expect(item.id).toBe(fixture?.id);
      expect(item.question).toBe(fixture?.question);
      expect(item.answer).toBe(fixture?.answer);
    }
  });

  test("composeProductionFaqSlot renders FaqPanel markers from fixture", () => {
    const html = renderToStaticMarkup(
      composeProductionFaqSlot() as ReactElement,
    );

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

describe("composeProductionCtaSlot", () => {
  test("maps fixture CTA fields onto CtaBand public contract with compose defaults", () => {
    const props = mapFixtureCtaToCtaBandProps(fixtureLandingPageData.cta);

    expect(props.headline).toBe(fixtureLandingPageData.cta.headline);
    expect(props.supporting).toBe(fixtureLandingPageData.cta.supporting);
    expect(props.installCommand).toBe(
      fixtureLandingPageData.cta.installCommand,
    );
    expect(props.ctaLabel).toBe("Install the CLI");
    expect(props.ctaHref).toBe("/docs/guides");
  });

  test("composeProductionCtaSlot renders CtaBand markers from fixture", () => {
    const html = renderToStaticMarkup(
      composeProductionCtaSlot() as ReactElement,
    );

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

describe("composeProductionWhaleBubblesSlot", () => {
  test("maps fixture whaleSrc and bubbles onto WhaleBubblesSection props", () => {
    const props = mapFixtureWhaleBubblesToSectionProps(
      fixtureLandingPageData.whaleBubbles,
    );

    expect(props.whaleSrc).toBe(fixtureLandingPageData.whaleBubbles.whaleSrc);
    expect(props.items).toEqual(fixtureLandingPageData.whaleBubbles.bubbles);
  });

  test("falls back to WHALE_BUBBLES_FIXTURE_* when fixture fields are empty", () => {
    const props = mapFixtureWhaleBubblesToSectionProps({ bubbles: [] });

    expect(props.whaleSrc).toBe(WHALE_BUBBLES_FIXTURE_SRC);
    expect(props.items).toEqual(WHALE_BUBBLES_FIXTURE_ITEMS);
  });

  test("renders whale section markers from fixture", () => {
    const html = renderToStaticMarkup(
      composeProductionWhaleBubblesSlot() as ReactElement,
    );

    expect(html).toContain('data-whale-bubbles-section=""');
    expect(html).toContain("Harness");
    expect(html).toContain("Loop");
  });
});

describe("composeProductionFooterSlot", () => {
  test("maps fixture columns and copyright onto SiteFooter without tagline", () => {
    const props = mapFixtureFooterToSiteFooterProps(
      fixtureLandingPageData.footer,
    );

    expect(props.columns).toEqual(fixtureLandingPageData.footer.columns);
    expect(props.meta.copyright).toBe(
      fixtureLandingPageData.footer.meta.copyright,
    );
    expect(props.meta).not.toHaveProperty("tagline");
  });

  test("maps artSrc to LandingFooterArt when present", () => {
    const props = mapFixtureFooterToSiteFooterProps(
      fixtureLandingPageData.footer,
    );
    expect(props.art).toBeDefined();

    const html = renderToStaticMarkup(props.art as ReactElement);
    expect(html).toContain('data-landing-footer-art=""');
    expect(html).toContain(`src="${fixtureLandingPageData.footer.artSrc}"`);
  });

  test("composeProductionFooterSlot renders SiteFooter markers", () => {
    const html = renderToStaticMarkup(
      composeProductionFooterSlot() as ReactElement,
    );

    expect(html).toContain('data-testid="site-footer"');
    expect(html).toContain("Product");
    expect(html).toContain("Community");
    expect(html).toContain("© you-agent-factory");
    expect(html).toContain('data-landing-footer-art=""');
    expect(html).not.toContain('data-landing-placeholder="footer"');
  });
});

describe("composeProductionLandingSlots", () => {
  test("returns only wired production slot keys", () => {
    const slots = composeProductionLandingSlots();
    const keys = Object.keys(slots).sort();

    expect(keys).toEqual([...WIRED_PRODUCTION_LANDING_SLOTS].sort());
    expect(slots).toHaveProperty("carousel");
    expect(slots).toHaveProperty("faq");
    expect(slots).toHaveProperty("cta");
  });

  test("LandingPage mounts wired fills including carousel, faq, and cta", () => {
    const html = renderToStaticMarkup(
      <LandingPage {...composeProductionLandingSlots()} />,
    );

    expect(html).toContain('data-landing-page=""');
    expect(html).toContain('data-landing-header=""');
    expect(html).toContain('data-hero-section=""');
    expect(html).toContain('data-particle-sphere=""');
    expect(html).toContain('data-capability-strip=""');
    expect(html).toContain('data-youi-showcase=""');
    expect(html).toContain('data-factory-carousel=""');
    expect(html).toContain('data-landing-faq-panel=""');
    expect(html).toContain('data-landing-cta-band=""');
    expect(html).toContain('data-whale-bubbles-section=""');
    expect(html).toContain('data-testid="site-footer"');
    expect(html).not.toContain('data-landing-placeholder="carousel"');
    expect(html).not.toContain('data-landing-placeholder="faq"');
    expect(html).not.toContain('data-landing-placeholder="cta"');
    expect(html).not.toContain('data-landing-placeholder="header"');
    expect(html).not.toContain('data-landing-placeholder="hero"');
    expect(html).not.toContain('data-landing-placeholder="footer"');

    for (const slide of fixtureLandingPageData.carousel.slides) {
      expect(html).toContain(slide.title);
      expect(html).toContain(slide.blurb);
      expect(html).toContain(slide.command);
    }

    for (const item of fixtureLandingPageData.faq.items) {
      expect(html).toContain(item.question);
      expect(html).toContain(item.answer);
    }

    expect(html).toContain(fixtureLandingPageData.cta.headline);
    expect(html).toContain(fixtureLandingPageData.cta.supporting);
    expect(html).toContain(fixtureLandingPageData.cta.installCommand);
    expect(html).toContain("Install the CLI");
    expect(html).toContain('href="/docs/guides"');
  });
});
