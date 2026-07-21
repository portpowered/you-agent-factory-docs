import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingPlaceholder } from "@/features/landing-page/components/LandingPlaceholder";

describe("LandingPlaceholder", () => {
  test("renders a gray labeled box with visible label and minHeight", () => {
    const html = renderToStaticMarkup(
      <LandingPlaceholder label="hero" minHeight={640} />,
    );

    expect(html).toContain('data-landing-placeholder="hero"');
    expect(html).toContain("hero");
    expect(html).toContain("min-height:640px");
    expect(html).toContain("bg-neutral-200");
  });

  test("accepts string minHeight values", () => {
    const html = renderToStaticMarkup(
      <LandingPlaceholder label="cta" minHeight="40vh" />,
    );

    expect(html).toContain('data-landing-placeholder="cta"');
    expect(html).toContain("min-height:40vh");
  });
});
