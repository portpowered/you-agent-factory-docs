import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LANDING_SLOT_ORDER } from "@/features/landing-page/LandingPage";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import { landingThemeToCssVars } from "@/features/landing-page/landing-page.theme";
import { WIRED_WAVE_A_SLOTS } from "./compose-wave-a-slots";
import { WIRED_WAVE_B_SLOTS } from "./compose-wave-b-slots";

mock.module("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound()");
  },
}));

type MutableEnv = Record<string, string | undefined>;

const mutableEnv = process.env as unknown as MutableEnv;
const originalNodeEnv = mutableEnv.NODE_ENV;
const originalEnableExamples = process.env.ENABLE_COMPONENT_EXAMPLES;

function setNodeEnv(value: string | undefined): void {
  if (value === undefined) {
    delete mutableEnv.NODE_ENV;
    return;
  }
  mutableEnv.NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);
  if (originalEnableExamples === undefined) {
    delete process.env.ENABLE_COMPONENT_EXAMPLES;
  } else {
    process.env.ENABLE_COMPONENT_EXAMPLES = originalEnableExamples;
  }
});

const WIRED_SLOT_SET = new Set<string>([
  ...WIRED_WAVE_A_SLOTS,
  ...WIRED_WAVE_B_SLOTS,
]);

describe("LandingHarnessPage", () => {
  test("composes Wave A + Wave B fills together and keeps unwired slots as placeholders", async () => {
    setNodeEnv("development");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: LandingHarnessPage } = await import("./page");
    const html = renderToStaticMarkup(LandingHarnessPage() as ReactElement);

    expect(html).toContain('data-landing-page=""');

    // Wave A: wired footer (SiteFooter) from fixture columns/meta
    expect(html).toContain('data-testid="site-footer"');
    expect(html).toContain('data-testid="site-footer-columns"');
    expect(html).toContain('data-testid="site-footer-meta"');
    expect(html).toContain(
      fixtureLandingPageData.footer.columns[0]?.title ?? "",
    );
    expect(html).toContain(
      fixtureLandingPageData.footer.columns[1]?.title ?? "",
    );
    expect(html).toContain(fixtureLandingPageData.footer.meta.copyright);
    expect(html).not.toContain('data-landing-placeholder="footer"');

    // Wave A: wired whaleBubbles from fixture bubble labels
    expect(html).toContain('data-whale-bubbles-section=""');
    expect(html).toContain('data-whale-plate=""');
    for (const bubble of fixtureLandingPageData.whaleBubbles.bubbles) {
      expect(html).toContain(bubble.label);
    }
    expect(html).not.toContain('data-landing-placeholder="whaleBubbles"');

    // Wave A: wired hero — ParticleSphere + optional Terminal from fixture commands
    expect(html).toContain('data-landing-harness-hero=""');
    expect(html).toContain('data-particle-sphere=""');
    expect(html).toContain('data-particle-sphere-canvas=""');
    expect(html).toContain('data-terminal=""');
    expect(html).toContain(fixtureLandingPageData.cta.installCommand);
    expect(html).not.toContain('data-landing-placeholder="hero"');

    // Wave B: wired carousel (FactoryCarousel) from fixture slides
    expect(html).toContain('data-factory-carousel=""');
    expect(html).not.toContain('data-landing-placeholder="carousel"');
    for (const slide of fixtureLandingPageData.carousel.slides) {
      expect(html).toContain(slide.title);
      expect(html).toContain(slide.blurb);
      expect(html).toContain(slide.command);
    }

    // Wave B: wired faq (FaqPanel) from fixture items
    expect(html).toContain('data-landing-faq-panel=""');
    expect(html).not.toContain('data-landing-placeholder="faq"');
    for (const item of fixtureLandingPageData.faq.items) {
      expect(html).toContain(item.question);
      expect(html).toContain(item.answer);
    }

    // Wave B: wired cta (CtaBand) from fixture + faq-cta-harness defaults
    expect(html).toContain('data-landing-cta-band=""');
    expect(html).not.toContain('data-landing-placeholder="cta"');
    expect(html).toContain(fixtureLandingPageData.cta.headline);
    expect(html).toContain(fixtureLandingPageData.cta.supporting);
    expect(html).toContain(fixtureLandingPageData.cta.installCommand);
    expect(html).toContain("Install the CLI");

    // Remaining unwired slots (header, capability, youi) stay labeled placeholders
    const remainingPlaceholders = LANDING_SLOT_ORDER.filter(
      (slot) => !WIRED_SLOT_SET.has(slot),
    );
    expect(remainingPlaceholders).toEqual(["header", "capability", "youi"]);
    for (const slot of remainingPlaceholders) {
      expect(html).toContain(`data-landing-placeholder="${slot}"`);
    }
    for (const slot of WIRED_SLOT_SET) {
      expect(html).not.toContain(`data-landing-placeholder="${slot}"`);
    }

    // Unwired fixture content trees are not mounted as filled slots
    // (command strings may still appear via soft-wired Terminal chrome /
    // FactoryCarousel slides).
    expect(html).not.toContain(fixtureLandingPageData.hero.title);
    expect(html).not.toContain(fixtureLandingPageData.hero.subtitle);
    expect(html).not.toContain(
      fixtureLandingPageData.capability.items[0]?.label ?? "",
    );
    expect(html).not.toContain(fixtureLandingPageData.youi.title);

    const vars = landingThemeToCssVars();
    expect(html).toContain(
      `--landing-whale-initial-scale:${vars["--landing-whale-initial-scale"]}`,
    );
    expect(html).toContain(
      `--landing-sphere-particle-count:${vars["--landing-sphere-particle-count"]}`,
    );
  });

  test("calls notFound in production unless ENABLE_COMPONENT_EXAMPLES=1", async () => {
    setNodeEnv("production");
    delete process.env.ENABLE_COMPONENT_EXAMPLES;

    const { default: LandingHarnessPage } = await import("./page");
    expect(() => LandingHarnessPage()).toThrow(/notFound\(\)/);

    process.env.ENABLE_COMPONENT_EXAMPLES = "1";
    const html = renderToStaticMarkup(LandingHarnessPage() as ReactElement);
    expect(html).toContain('data-landing-page=""');
  });
});
