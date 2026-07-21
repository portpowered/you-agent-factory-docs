import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { TORN_EDGE_DEFAULT_SRC, TornEdge } from "./TornEdge";

describe("TornEdge", () => {
  test("renders an observable edge image with the staged down-transition default", () => {
    const html = renderToStaticMarkup(<TornEdge />);

    expect(html).toContain('data-torn-edge=""');
    expect(html).toContain('data-torn-edge-placement="bottom"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-torn-edge-image=""');
    expect(html).toContain(`src="${TORN_EDGE_DEFAULT_SRC}"`);
    expect(TORN_EDGE_DEFAULT_SRC).toBe(landingHomeAssets.downTransition);
    expect(TORN_EDGE_DEFAULT_SRC).toBe("/home/down-transition.png");
  });

  test("applies placement top with a vertical flip and accepts className", () => {
    const html = renderToStaticMarkup(
      <TornEdge className="torn-edge-host" placement="top" />,
    );

    expect(html).toContain('data-torn-edge-placement="top"');
    expect(html).toContain("torn-edge-host");
    expect(html).toContain("scaleY(-1)");
  });

  test("accepts a harness-safe fixture src override", () => {
    const html = renderToStaticMarkup(
      <TornEdge src="/fixtures/torn-edge-harness.png" />,
    );

    expect(html).toContain('src="/fixtures/torn-edge-harness.png"');
    expect(html).not.toContain(landingHomeAssets.downTransition);
  });

  test("empty src keeps a stable empty host without crashing", () => {
    const html = renderToStaticMarkup(<TornEdge src="" />);

    expect(html).toContain('data-torn-edge=""');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("data-torn-edge-image");
    expect(html).not.toContain("<img");
  });
});
