import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  composeWaveAFooterSlot,
  mapFixtureFooterToSiteFooterProps,
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
