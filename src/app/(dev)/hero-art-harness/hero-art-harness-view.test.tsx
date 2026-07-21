import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroArtHarnessView } from "./hero-art-harness-view";

describe("HeroArtHarnessView", () => {
  test("renders vertical stacked sections on neutral skeleton background", () => {
    const html = renderToStaticMarkup(<HeroArtHarnessView />);

    expect(html).toContain('data-hero-art-harness=""');
    expect(html).toContain("bg-neutral-100");
    expect(html).toContain('data-hero-art-harness-section="hero"');
    expect(html).toContain('data-hero-art-harness-section="capability"');
    expect(html).toContain('data-hero-art-harness-section="youi"');
    expect(html).toContain('data-torn-edge-placement="bottom"');
    expect(html).toContain('data-torn-edge-placement="top"');
  });
});
