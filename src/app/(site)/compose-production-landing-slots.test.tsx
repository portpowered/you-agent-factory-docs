import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
} from "@/features/landing-page/whale-bubbles.fixtures";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
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

function mockPrefersReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const originalMatchMedia = window.matchMedia;

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
    expect(html).toContain(">YOU</a>");
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

    expect(lines).toHaveLength(fixtureLandingPageData.carousel.slides.length);
    expect(lines).toContain(
      'you run -a @u/loop --every "1h" --to "check the website, fix bugs"',
    );
    expect(lines).toContain(
      'you run -a "deep-research" --to "research the best approach"',
    );
    expect(mapFixtureCommandsToTerminalProps()?.variant).toBe("install");
  });

  test("renders HeroSection with sphere and terminal fills", () => {
    const html = renderToStaticMarkup(
      composeProductionHeroSlot() as ReactElement,
    );

    expect(html).toContain('data-hero-section=""');
    expect(html).toContain("YOU");
    expect(html).toContain("AGENT");
    expect(html).toContain("FACTORY CLI");
    expect(html).not.toContain(fixtureLandingPageData.hero.subtitle);
    expect(html).toContain('data-particle-sphere=""');
    expect(html).toContain("https://youagentfactory.com/install.sh");
    expect(html).toContain("OPEN SOURCE");
    expect(html).toContain("MIT LICENSE");
    expect(html).toContain("Windows");
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
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

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
      if (slide.command.length > 0) {
        expect(html).toContain(slide.command.replaceAll('"', "&quot;"));
      }
      expect(html).toContain(`data-factory-slide="${slide.id}"`);
    }
  });

  test("prefers-reduced-motion: reduce reports static carousel motion on production fill", async () => {
    mockPrefersReducedMotion(true);
    const { container } = render(
      composeProductionCarouselSlot() as ReactElement,
    );

    await waitFor(() => {
      expect(
        container
          .querySelector("[data-factory-carousel]")
          ?.getAttribute("data-carousel-motion"),
      ).toBe("static");
    });

    const activeTitle = fixtureLandingPageData.carousel.slides[1]?.title ?? "";
    expect(container.querySelectorAll("[data-carousel-slide]").length).toBe(
      fixtureLandingPageData.carousel.slides.length,
    );
    expect(container.textContent).toContain(activeTitle);
    expect(
      container.querySelectorAll("[data-carousel-depth='neighbor']").length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelector<HTMLElement>("[data-active='true']")?.style
        .transitionDuration,
    ).toBe("0ms");
  });

  test("no reduced-motion preference keeps depth carousel motion on production fill", async () => {
    mockPrefersReducedMotion(false);
    const { container } = render(
      composeProductionCarouselSlot() as ReactElement,
    );

    await waitFor(() => {
      expect(
        container
          .querySelector("[data-factory-carousel]")
          ?.getAttribute("data-carousel-motion"),
      ).toBe("depth");
    });

    expect(
      container.querySelectorAll("[data-carousel-slide]").length,
    ).toBeGreaterThan(1);
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
    expect(html).toContain('data-landing-faq-surface="parchment"');
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
    expect(html).toContain('data-landing-cta-surface="overlay"');
    expect(html).not.toContain('data-landing-placeholder="cta"');
    expect(html).toContain(fixtureLandingPageData.cta.headline);
    expect(html).not.toContain('data-landing-cta-supporting=""');
    expect(html).not.toContain('data-landing-cta-command=""');
    expect(html).not.toContain('data-landing-cta-action=""');
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
    expect(html).not.toContain('data-whale-bubbles-plate-slot=""');
    expect(html).toContain("Many feature, such wow");
    expect(html).toContain("Dynamic Workflow");
    expect(html).toContain("Event stream based resumption");
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
    expect(html).toContain("References");
    expect(html).toContain("Support");
    expect(html).toContain("July 19th, 2026");
    expect(html).toContain("ANDREAS ABDI");
    expect(html).toContain("MIT LICENSE");
    expect(html).toContain("factory configuration");
    expect(html).toContain('data-landing-footer-art=""');
    expect(html).not.toContain('data-landing-placeholder="footer"');
  });
});

describe("composeProductionLandingSlots", () => {
  test("WIRED_PRODUCTION_LANDING_SLOTS includes Wave A keys plus Wave B carousel/faq/cta", () => {
    expect([...WIRED_PRODUCTION_LANDING_SLOTS]).toEqual([
      "header",
      "hero",
      "capability",
      "youi",
      "carousel",
      "faq",
      "cta",
      "whaleBubbles",
      "footer",
    ]);
  });

  test("returns wired slots plus the shared mid-scene art", () => {
    const slots = composeProductionLandingSlots();
    const keys = Object.keys(slots).sort();

    expect(keys).toEqual(
      [
        ...WIRED_PRODUCTION_LANDING_SLOTS,
        "midSceneBackgroundSrc",
        "midSceneTransitionSrc",
      ].sort(),
    );
    expect(slots).toHaveProperty("header");
    expect(slots).toHaveProperty("hero");
    expect(slots).toHaveProperty("capability");
    expect(slots).toHaveProperty("youi");
    expect(slots).toHaveProperty("carousel");
    expect(slots).toHaveProperty("faq");
    expect(slots).toHaveProperty("cta");
    expect(slots).toHaveProperty("whaleBubbles");
    expect(slots).toHaveProperty("footer");
    expect(slots).toHaveProperty("midSceneBackgroundSrc");
    expect(slots).toHaveProperty("midSceneTransitionSrc");
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
    expect(html).toContain('data-landing-mid-scene-whale=""');
    expect(html).toContain('data-landing-mid-scene-transition=""');
    expect(html).not.toContain('data-whale-bubbles-plate-slot=""');
    expect(html).not.toContain("down-transition.png");
    expect(html).toContain('data-testid="site-footer"');
    expect(html).not.toContain('data-landing-placeholder="carousel"');
    expect(html).not.toContain('data-landing-placeholder="faq"');
    expect(html).not.toContain('data-landing-placeholder="cta"');
    expect(html).not.toContain('data-landing-placeholder="header"');
    expect(html).not.toContain('data-landing-placeholder="hero"');
    expect(html).not.toContain('data-landing-placeholder="footer"');
    expect(html).not.toContain('data-landing-placeholder="capability"');
    expect(html).not.toContain('data-landing-placeholder="youi"');
    expect(html).not.toContain('data-landing-placeholder="whaleBubbles"');

    for (const slide of fixtureLandingPageData.carousel.slides) {
      expect(html).toContain(slide.title);
      expect(html).toContain(slide.blurb);
      if (slide.command.length > 0) {
        expect(html).toContain(slide.command.replaceAll('"', "&quot;"));
      }
    }

    for (const item of fixtureLandingPageData.faq.items) {
      expect(html).toContain(item.question);
      expect(html).toContain(item.answer);
    }

    expect(html).toContain(fixtureLandingPageData.cta.headline);
    expect(html).not.toContain('data-landing-cta-supporting=""');
    expect(html).not.toContain('data-landing-cta-command=""');
    expect(html).not.toContain('data-landing-cta-action=""');
  });

  test("project-site production markup prefixes homepage image URLs", () => {
    const basePath = BUILT_APP_GITHUB_PAGES_BASE_PATH;
    const html = renderToStaticMarkup(
      <LandingPage
        {...composeProductionLandingSlots(fixtureLandingPageData, {
          NEXT_STATIC_EXPORT: "1",
          GITHUB_PAGES_BASE_PATH: basePath,
        })}
      />,
    );

    for (const assetPath of [
      landingHomeAssets.womanHead,
      landingHomeAssets.monkey,
      landingHomeAssets.factoryGraphUi,
      landingHomeAssets.midEndWhale,
      landingHomeAssets.seadragonCrop,
      landingHomeAssets.ctaFog,
      landingHomeAssets.octopus,
      landingHomeAssets.youYouYouBackground,
    ]) {
      expect(html).toContain(`${basePath}${assetPath}`);
      expect(html).not.toContain(`src="${assetPath}"`);
      expect(html).not.toContain(`url(${assetPath})`);
    }
    expect(html).not.toContain(landingHomeAssets.downTransition);
  });
});
