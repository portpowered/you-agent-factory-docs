import { describe, expect, test } from "bun:test";
import {
  emptyLandingPageData,
  fixtureLandingPageData,
  type LandingPageData,
} from "@/features/landing-page/landing-page.data";

function assertLandingPageDataShape(data: LandingPageData) {
  expect(Array.isArray(data.header.nav)).toBe(true);
  expect(typeof data.hero.title).toBe("string");
  expect(Array.isArray(data.capability.items)).toBe(true);
  expect(Array.isArray(data.carousel.slides)).toBe(true);
  expect(typeof data.youi.title).toBe("string");
  expect(Array.isArray(data.faq.items)).toBe(true);
  expect(Array.isArray(data.whaleBubbles.bubbles)).toBe(true);
  expect(typeof data.cta.installCommand).toBe("string");
  expect(Array.isArray(data.footer.columns)).toBe(true);
  expect(typeof data.footer.meta.copyright).toBe("string");
}

describe("landing-page.data", () => {
  test("emptyLandingPageData exposes empty section arrays and strings", () => {
    assertLandingPageDataShape(emptyLandingPageData);
    expect(emptyLandingPageData.header.nav).toEqual([]);
    expect(emptyLandingPageData.carousel.slides).toEqual([]);
    expect(emptyLandingPageData.faq.items).toEqual([]);
    expect(emptyLandingPageData.whaleBubbles.bubbles).toEqual([]);
    expect(emptyLandingPageData.footer.columns).toEqual([]);
    expect(emptyLandingPageData.hero.title).toBe("");
    expect(emptyLandingPageData.cta.installCommand).toBe("");
  });

  test("fixtureLandingPageData fills slides and sections for later slot use", () => {
    assertLandingPageDataShape(fixtureLandingPageData);

    expect(fixtureLandingPageData.header.nav.length).toBeGreaterThan(0);
    expect(
      fixtureLandingPageData.capability.items.map((item) => item.label),
    ).toEqual([
      "YOU",
      "CLI",
      "MCP API SSE",
      "FLOWS : JS | GRAPH",
      "AGENTS : CODEX | CLAUDE | 10+",
      "ENTRY : CLI | API | MCP | UI",
      "OS : MAC | LINUX | WINDOWS",
    ]);
    expect(
      fixtureLandingPageData.header.nav.map((item) => item.label),
    ).not.toContain("Install");
    expect(fixtureLandingPageData.carousel.slides).toHaveLength(8);
    expect(
      fixtureLandingPageData.carousel.slides.map((slide) => slide.title),
    ).toEqual([
      "ralph",
      "LOOP",
      "review",
      "goal",
      "custom",
      "deep-research",
      "one-shot",
      "classify",
    ]);

    for (const slide of fixtureLandingPageData.carousel.slides) {
      expect(slide.id.length).toBeGreaterThan(0);
      expect(slide.title.length).toBeGreaterThan(0);
      expect(slide.blurb.length).toBeGreaterThan(0);
      expect(typeof slide.command).toBe("string");
    }

    expect(
      fixtureLandingPageData.faq.items[0]?.question.length,
    ).toBeGreaterThan(0);
    expect(fixtureLandingPageData.whaleBubbles.whaleSrc).toBe(
      "/home/mid-end-whale.png",
    );
    expect(fixtureLandingPageData.whaleBubbles.bubbles).toHaveLength(15);
    expect(fixtureLandingPageData.hero.portraitSrc).toBe(
      "/home/woman-head.png",
    );
    expect(fixtureLandingPageData.youi.imageSrc).toBe("/home/monkey.png");
    expect(fixtureLandingPageData.footer.artSrc).toBe(
      "/home/seadragon-crop.png",
    );
    expect(
      fixtureLandingPageData.footer.columns[0]?.links.length,
    ).toBeGreaterThan(0);
  });

  test("modules are importable without sibling feature packages", async () => {
    const theme = await import("@/features/landing-page/landing-page.theme");
    const data = await import("@/features/landing-page/landing-page.data");

    expect(theme.landingPageTheme).toBeDefined();
    expect(data.fixtureLandingPageData).toBeDefined();
    expect(data.emptyLandingPageData).toBeDefined();
  });
});
