import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LANDING_SLOT_MIN_HEIGHTS,
  LANDING_SLOT_ORDER,
  LandingPage,
} from "@/features/landing-page/LandingPage";
import { landingThemeToCssVars } from "@/features/landing-page/landing-page.theme";

describe("LandingPage", () => {
  test("defaults all nine slots to labeled placeholders in contract order", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    const placeholderIndexes = LANDING_SLOT_ORDER.map((slot) => {
      const marker = `data-landing-placeholder="${slot}"`;
      const index = html.indexOf(marker);
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    });

    for (let i = 1; i < placeholderIndexes.length; i += 1) {
      const previous = placeholderIndexes[i - 1];
      const current = placeholderIndexes[i];
      expect(previous).toBeDefined();
      expect(current).toBeDefined();
      expect(current).toBeGreaterThan(previous ?? -1);
    }

    for (const slot of LANDING_SLOT_ORDER) {
      expect(html).toContain(`min-height:${LANDING_SLOT_MIN_HEIGHTS[slot]}px`);
    }
  });

  test("renders provided slot nodes in place of matching placeholders", () => {
    const html = renderToStaticMarkup(
      <LandingPage
        hero={<div data-custom-hero="1">Custom hero</div>}
        footer={<footer data-custom-footer="1">Custom footer</footer>}
      />,
    );

    expect(html).toContain('data-custom-hero="1"');
    expect(html).toContain("Custom hero");
    expect(html).not.toContain('data-landing-placeholder="hero"');

    expect(html).toContain('data-custom-footer="1"');
    expect(html).toContain("Custom footer");
    expect(html).not.toContain('data-landing-placeholder="footer"');

    expect(html).toContain('data-landing-placeholder="header"');
    expect(html).toContain('data-landing-placeholder="carousel"');
  });

  test("applies landing theme CSS variables on the root wrapper", () => {
    const html = renderToStaticMarkup(<LandingPage />);
    const vars = landingThemeToCssVars();

    expect(html).toContain('data-landing-page=""');
    expect(html).toContain(
      `--landing-whale-initial-scale:${vars["--landing-whale-initial-scale"]}`,
    );
    expect(html).toContain(
      `--landing-sphere-particle-count:${vars["--landing-sphere-particle-count"]}`,
    );
    expect(html).toContain(
      `--landing-carousel-neighbor-scale:${vars["--landing-carousel-neighbor-scale"]}`,
    );
  });
});
