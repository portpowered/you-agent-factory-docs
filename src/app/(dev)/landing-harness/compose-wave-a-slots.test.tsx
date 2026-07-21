import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
} from "@/features/landing-page/whale-bubbles.fixtures";
import {
  composeWaveAFooterSlot,
  composeWaveAHeroSlot,
  composeWaveAWhaleBubblesSlot,
  mapFixtureCommandsToTerminalLines,
  mapFixtureCommandsToTerminalProps,
  mapFixtureFooterToSiteFooterProps,
  mapFixtureWhaleBubblesToSectionProps,
} from "./compose-wave-a-slots";

describe("composeWaveAFooterSlot", () => {
  test("maps fixture columns and copyright onto SiteFooter without tagline", () => {
    const props = mapFixtureFooterToSiteFooterProps(
      fixtureLandingPageData.footer,
    );

    expect(props.columns).toEqual(fixtureLandingPageData.footer.columns);
    expect(props.meta.copyright).toBe(
      fixtureLandingPageData.footer.meta.copyright,
    );
    expect(props.meta).not.toHaveProperty("tagline");
    expect(props.meta).not.toHaveProperty("links");
  });

  test("maps artSrc to an img art node when present", () => {
    const props = mapFixtureFooterToSiteFooterProps(
      fixtureLandingPageData.footer,
    );
    expect(props.art).toBeDefined();

    const html = renderToStaticMarkup(props.art as ReactElement);
    expect(html).toContain('data-testid="landing-harness-footer-art"');
    expect(html).toContain(`src="${fixtureLandingPageData.footer.artSrc}"`);
  });

  test("omits art when artSrc is absent", () => {
    const props = mapFixtureFooterToSiteFooterProps({
      columns: fixtureLandingPageData.footer.columns,
      meta: { copyright: "© test" },
    });
    expect(props.art).toBeUndefined();
  });

  test("composeWaveAFooterSlot renders SiteFooter markers from fixture", () => {
    const html = renderToStaticMarkup(composeWaveAFooterSlot() as ReactElement);

    expect(html).toContain('data-testid="site-footer"');
    expect(html).toContain("Product");
    expect(html).toContain("Community");
    expect(html).toContain("© you-agent-factory");
    expect(html).toContain('data-testid="site-footer-art"');
    expect(html).not.toContain('data-landing-placeholder="footer"');
  });
});

describe("composeWaveAWhaleBubblesSlot", () => {
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

  test("composeWaveAWhaleBubblesSlot renders section markers from fixture", () => {
    const html = renderToStaticMarkup(
      composeWaveAWhaleBubblesSlot() as ReactElement,
    );

    expect(html).toContain('data-whale-bubbles-section=""');
    expect(html).toContain('data-whale-plate=""');
    expect(html).toContain('data-whale-bubbles-item-count="3"');
    expect(html).toContain("Harness");
    expect(html).toContain("Loop");
    expect(html).toContain("Worktree");
    expect(html).not.toContain('data-landing-placeholder="whaleBubbles"');
  });
});

describe("composeWaveAHeroSlot", () => {
  test("maps fixture install + distinct carousel commands onto Terminal lines", () => {
    const lines = mapFixtureCommandsToTerminalLines({
      cta: fixtureLandingPageData.cta,
      carousel: fixtureLandingPageData.carousel,
    });

    expect(lines[0]).toBe(fixtureLandingPageData.cta.installCommand);
    expect(lines).toContain("you run --named @loop/write-review");
    expect(lines).toContain("you docs agents");
    expect(new Set(lines).size).toBe(lines.length);
  });

  test("falls back to carousel commands when installCommand is empty", () => {
    const lines = mapFixtureCommandsToTerminalLines({
      cta: { headline: "", supporting: "", installCommand: "" },
      carousel: fixtureLandingPageData.carousel,
    });

    expect(lines[0]).toBe(fixtureLandingPageData.carousel.slides[0]?.command);
    expect(lines.length).toBeGreaterThan(0);
  });

  test("returns null Terminal props when no command strings exist", () => {
    expect(
      mapFixtureCommandsToTerminalProps({
        cta: { headline: "", supporting: "", installCommand: "" },
        carousel: { slides: [] },
      }),
    ).toBeNull();
  });

  test("composeWaveAHeroSlot renders ParticleSphere + Terminal chrome", () => {
    const html = renderToStaticMarkup(composeWaveAHeroSlot() as ReactElement);

    expect(html).toContain('data-landing-harness-hero=""');
    expect(html).toContain('data-particle-sphere=""');
    expect(html).toContain('data-particle-sphere-canvas=""');
    expect(html).toContain('data-landing-harness-hero-terminal=""');
    expect(html).toContain('data-terminal=""');
    expect(html).toContain('data-terminal-variant="install"');
    expect(html).toContain(fixtureLandingPageData.cta.installCommand);
    expect(html).not.toContain('data-landing-placeholder="hero"');
  });

  test("composeWaveAHeroSlot omits Terminal when no fixture commands", () => {
    const html = renderToStaticMarkup(
      composeWaveAHeroSlot({
        cta: { headline: "", supporting: "", installCommand: "" },
        carousel: { slides: [] },
      }) as ReactElement,
    );

    expect(html).toContain('data-particle-sphere=""');
    expect(html).not.toContain('data-terminal=""');
    expect(html).not.toContain('data-landing-harness-hero-terminal=""');
  });
});
