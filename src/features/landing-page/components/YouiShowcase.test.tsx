import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import {
  YOUI_SHOWCASE_BACKGROUND_SIZES,
  YOUI_SHOWCASE_DEFAULT_BACKGROUND_SRC,
  YOUI_SHOWCASE_DEFAULT_GRAPH_ALT,
  YOUI_SHOWCASE_DEFAULT_GRAPH_SRC,
  YOUI_SHOWCASE_DEFAULT_TITLE,
  YOUI_SHOWCASE_GRAPH_INTRINSIC_HEIGHT,
  YOUI_SHOWCASE_GRAPH_INTRINSIC_WIDTH,
  YOUI_SHOWCASE_GRAPH_SIZES,
  YOUI_SHOWCASE_MONKEY_INTRINSIC_HEIGHT,
  YOUI_SHOWCASE_MONKEY_INTRINSIC_WIDTH,
  YouiShowcase,
} from "./YouiShowcase";

describe("YouiShowcase", () => {
  test("renders monkey background and graph UI with explicit sizes", () => {
    const html = renderToStaticMarkup(<YouiShowcase />);

    expect(html).toContain('data-youi-showcase=""');
    expect(html).toContain('data-youi-showcase-background=""');
    expect(html).toContain('data-youi-showcase-background-image=""');
    expect(html).toContain('data-youi-showcase-graph-image=""');
    expect(html).toContain(`src="${YOUI_SHOWCASE_DEFAULT_BACKGROUND_SRC}"`);
    expect(html).toContain(`src="${YOUI_SHOWCASE_DEFAULT_GRAPH_SRC}"`);
    expect(YOUI_SHOWCASE_DEFAULT_BACKGROUND_SRC).toBe(landingHomeAssets.monkey);
    expect(YOUI_SHOWCASE_DEFAULT_BACKGROUND_SRC).toBe("/home/monkey.png");
    expect(YOUI_SHOWCASE_DEFAULT_GRAPH_SRC).toBe(
      landingHomeAssets.factoryGraphUi,
    );
    expect(YOUI_SHOWCASE_DEFAULT_GRAPH_SRC).toBe("/home/factory-graph-ui.png");
    expect(html).toContain(`sizes="${YOUI_SHOWCASE_BACKGROUND_SIZES}"`);
    expect(html).toContain(`sizes="${YOUI_SHOWCASE_GRAPH_SIZES}"`);
    expect(YOUI_SHOWCASE_BACKGROUND_SIZES).not.toBe("100vw");
    expect(YOUI_SHOWCASE_GRAPH_SIZES).not.toBe("100vw");
    expect(YOUI_SHOWCASE_GRAPH_SIZES).toContain("480px");
    expect(html).toContain(`width="${YOUI_SHOWCASE_MONKEY_INTRINSIC_WIDTH}"`);
    expect(html).toContain(`height="${YOUI_SHOWCASE_MONKEY_INTRINSIC_HEIGHT}"`);
    expect(html).toContain(`width="${YOUI_SHOWCASE_GRAPH_INTRINSIC_WIDTH}"`);
    expect(html).toContain(`height="${YOUI_SHOWCASE_GRAPH_INTRINSIC_HEIGHT}"`);
  });

  test("defaults title from fixtureLandingPageData.youi", () => {
    const html = renderToStaticMarkup(<YouiShowcase />);

    expect(YOUI_SHOWCASE_DEFAULT_TITLE).toBe(fixtureLandingPageData.youi.title);
    expect(html).toContain('data-youi-showcase-title=""');
    expect(html).toContain(fixtureLandingPageData.youi.title);
  });

  test("background is presentational; graph UI has meaningful alt", () => {
    const html = renderToStaticMarkup(<YouiShowcase />);

    expect(html).toContain('data-youi-showcase-background=""');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(`alt="${YOUI_SHOWCASE_DEFAULT_GRAPH_ALT}"`);
  });

  test("accepts className, title, and src overrides", () => {
    const html = renderToStaticMarkup(
      <YouiShowcase
        backgroundSrc="/fixtures/youi-monkey.png"
        className="youi-host"
        graphAlt="Custom graph"
        graphSrc="/fixtures/youi-graph.png"
        title="Custom Youi"
      />,
    );

    expect(html).toContain("youi-host");
    expect(html).toContain("Custom Youi");
    expect(html).toContain('src="/fixtures/youi-monkey.png"');
    expect(html).toContain('src="/fixtures/youi-graph.png"');
    expect(html).toContain('alt="Custom graph"');
    expect(html).not.toContain(landingHomeAssets.monkey);
    expect(html).not.toContain(landingHomeAssets.factoryGraphUi);
  });

  test("empty optional images keep a stable host without crashing", () => {
    const html = renderToStaticMarkup(
      <YouiShowcase backgroundSrc="" graphSrc="" title="" />,
    );

    expect(html).toContain('data-youi-showcase=""');
    expect(html).toContain('data-youi-showcase-content=""');
    expect(html).toContain('aria-label="Youi showcase"');
    expect(html).not.toContain("data-youi-showcase-background");
    expect(html).not.toContain("data-youi-showcase-graph-image");
    expect(html).not.toContain("data-youi-showcase-title");
  });

  test("omitting only one image still mounts the other", () => {
    const withoutGraph = renderToStaticMarkup(<YouiShowcase graphSrc="" />);
    const withoutBackground = renderToStaticMarkup(
      <YouiShowcase backgroundSrc="" />,
    );

    expect(withoutGraph).toContain("data-youi-showcase-background-image");
    expect(withoutGraph).not.toContain("data-youi-showcase-graph-image");
    expect(withoutBackground).toContain("data-youi-showcase-graph-image");
    expect(withoutBackground).not.toContain(
      "data-youi-showcase-background-image",
    );
  });
});
