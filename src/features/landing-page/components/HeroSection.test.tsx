import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  HERO_SECTION_DEFAULT_SUBTITLE,
  HERO_SECTION_DEFAULT_TITLE,
  HERO_SECTION_SPHERE_HOLE_MIN_HEIGHT,
  HERO_SECTION_TERMINAL_HOLE_MIN_HEIGHT,
  HeroSection,
} from "./HeroSection";

describe("HeroSection", () => {
  test("composes the default portrait and labeled sphere/terminal holes", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain('data-hero-section=""');
    expect(html).toContain('data-hero-section-portrait=""');
    expect(html).toContain('data-hero-portrait=""');
    expect(html).toContain(`src="${landingHomeAssets.womanHead}"`);
    expect(html).toContain('data-hero-section-sphere=""');
    expect(html).toContain('data-hero-section-terminal=""');
    expect(html).toContain('data-landing-placeholder="sphere"');
    expect(html).toContain('data-landing-placeholder="terminal"');
    expect(html).toContain(
      `min-height:${HERO_SECTION_SPHERE_HOLE_MIN_HEIGHT}px`,
    );
    expect(html).toContain(
      `min-height:${HERO_SECTION_TERMINAL_HOLE_MIN_HEIGHT}px`,
    );
    expect(html).toContain("YOU");
    expect(html).toContain("AGENT");
    expect(html).toContain("FACTORY CLI");
    expect(html).toContain(HERO_SECTION_DEFAULT_SUBTITLE);
    expect(HERO_SECTION_DEFAULT_TITLE).toBe(fixtureLandingPageData.hero.title);
  });

  test("renders provided sphere and terminal hole nodes", () => {
    const html = renderToStaticMarkup(
      <HeroSection
        sphere={<div data-sphere-stub="">sphere-stub</div>}
        terminal={<div data-terminal-stub="">terminal-stub</div>}
      />,
    );

    expect(html).toContain('data-sphere-stub=""');
    expect(html).toContain("sphere-stub");
    expect(html).toContain('data-terminal-stub=""');
    expect(html).toContain("terminal-stub");
    expect(html).not.toContain('data-landing-placeholder="sphere"');
    expect(html).not.toContain('data-landing-placeholder="terminal"');
  });

  test("accepts a portrait slot override and className", () => {
    const html = renderToStaticMarkup(
      <HeroSection
        className="hero-section-host"
        portrait={<div data-portrait-stub="">custom-portrait</div>}
        title=""
        subtitle=""
      />,
    );

    expect(html).toContain("hero-section-host");
    expect(html).toContain('data-portrait-stub=""');
    expect(html).toContain("custom-portrait");
    expect(html).not.toContain("data-hero-portrait");
    expect(html).not.toContain('data-hero-section-title=""');
    expect(html).not.toContain('data-hero-section-subtitle=""');
  });

  test("does not embed ParticleSphere canvas or Terminal chrome markup", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).not.toContain("data-particle-sphere");
    expect(html).not.toContain("data-terminal=");
    expect(html).not.toContain("data-terminal-chrome");
  });
});
