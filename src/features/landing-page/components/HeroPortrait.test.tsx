import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import {
  HERO_PORTRAIT_DEFAULT_ALT,
  HERO_PORTRAIT_DEFAULT_SRC,
  HERO_PORTRAIT_INTRINSIC_HEIGHT,
  HERO_PORTRAIT_INTRINSIC_WIDTH,
  HERO_PORTRAIT_SIZES,
  HeroPortrait,
} from "./HeroPortrait";

describe("HeroPortrait", () => {
  test("renders the staged woman-head portrait with explicit sizes", () => {
    const html = renderToStaticMarkup(<HeroPortrait />);

    expect(html).toContain('data-hero-portrait=""');
    expect(html).toContain('data-hero-portrait-image=""');
    expect(html).toContain(`src="${HERO_PORTRAIT_DEFAULT_SRC}"`);
    expect(HERO_PORTRAIT_DEFAULT_SRC).toBe(landingHomeAssets.womanHead);
    expect(HERO_PORTRAIT_DEFAULT_SRC).toBe("/home/woman-head.png");
    expect(html).toContain(`sizes="${HERO_PORTRAIT_SIZES}"`);
    expect(HERO_PORTRAIT_SIZES).toContain("480px");
    expect(HERO_PORTRAIT_SIZES).not.toBe("100vw");
    expect(html).toContain(`width="${HERO_PORTRAIT_INTRINSIC_WIDTH}"`);
    expect(html).toContain(`height="${HERO_PORTRAIT_INTRINSIC_HEIGHT}"`);
    expect(html).toContain(`alt="${HERO_PORTRAIT_DEFAULT_ALT}"`);
  });

  test("accepts className and alt overrides", () => {
    const html = renderToStaticMarkup(
      <HeroPortrait alt="Hero subject" className="hero-portrait-host" />,
    );

    expect(html).toContain("hero-portrait-host");
    expect(html).toContain('alt="Hero subject"');
    expect(html).not.toContain('aria-hidden="true"');
  });

  test("empty alt marks the host presentational", () => {
    const html = renderToStaticMarkup(<HeroPortrait alt="" />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('alt=""');
  });

  test("accepts a harness-safe fixture src override", () => {
    const html = renderToStaticMarkup(
      <HeroPortrait src="/fixtures/hero-portrait-harness.png" />,
    );

    expect(html).toContain('src="/fixtures/hero-portrait-harness.png"');
    expect(html).not.toContain(landingHomeAssets.womanHead);
  });

  test("empty src keeps a stable empty host without crashing", () => {
    const html = renderToStaticMarkup(<HeroPortrait src="" />);

    expect(html).toContain('data-hero-portrait=""');
    expect(html).not.toContain("data-hero-portrait-image");
    expect(html).not.toContain("<img");
  });
});
