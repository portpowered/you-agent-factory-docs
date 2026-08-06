import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { FactoryCarousel } from "@/features/landing-page/components/FactoryCarousel";
import type { FactorySlideData } from "@/features/landing-page/components/FactorySlide";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";

const SLIDES: FactorySlideData[] = [
  {
    id: "slide-a",
    title: "alpha",
    blurb: "first",
    command: "you run -a alpha",
    artSrc: "/home/factories/octopus.webp",
  },
  {
    id: "slide-b",
    title: "beta",
    blurb: "second",
    command: "you run -a beta",
    artSrc: "/home/factories/owl.webp",
  },
];

const globalsCss = readFileSync(
  join(process.cwd(), "src", "app", "globals.css"),
  "utf8",
);

/** The `@media (max-width: 767px)` block, isolated from the rest of the sheet. */
function mobileCarouselRules(): string {
  const start = globalsCss.indexOf("Mobile factory carousel");
  expect(start).toBeGreaterThan(-1);
  const open = globalsCss.indexOf("@media (max-width: 767px)", start);
  return globalsCss.slice(open, globalsCss.indexOf("\n}\n", open));
}

describe("factory carousel artwork", () => {
  test("the focused slide renders its own plate", () => {
    const html = renderToStaticMarkup(
      <FactoryCarousel initialIndex={0} slides={SLIDES} />,
    );

    expect(html).toContain('src="/home/factories/octopus.webp"');
    expect(html).toContain("data-factory-slide-art=");
  });

  test("every shipped slide carries a plate", () => {
    for (const slide of fixtureLandingPageData.carousel.slides) {
      expect(slide.artSrc).toMatch(/^\/home\/factories\/[a-z-]+\.webp$/);
    }
  });

  test("a plate is bled behind the card as a blurred wash", () => {
    const html = renderToStaticMarkup(
      <FactoryCarousel initialIndex={0} slides={SLIDES} />,
    );

    expect(html).toContain("data-factory-slide-art-wash=");
    expect(html).toContain("blur-2xl");
  });

  /**
   * The mobile block once set `display: none` on the focused card's artwork,
   * a leftover from the slot-based layout. On the uniform track that left the
   * primary image with a zero-height box, so the card rendered as loose text
   * over the scene with no picture at all.
   */
  test("the mobile block never hides the focused card's artwork", () => {
    const mobile = mobileCarouselRules();

    expect(mobile).not.toMatch(/factory-slide__art[^}]*display:\s*none/);
    // A floor is required: `flex: 1` collapses to zero once the title, blurb,
    // and command have taken the card's height.
    expect(mobile).toMatch(/factory-slide__art\s*\{[^}]*min-height/);
  });

  test("the mobile block leaves the track travel alone", () => {
    const mobile = mobileCarouselRules();

    // Slides are positioned by `left`; overriding it here would pin every card
    // to one spot and break the rotation.
    expect(mobile).not.toMatch(/\.factory-carousel__slide[^}]*\bleft:/);
  });
});
