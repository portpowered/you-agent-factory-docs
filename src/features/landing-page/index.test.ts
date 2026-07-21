import { describe, expect, test } from "bun:test";
import {
  CtaBand,
  type CtaBandProps,
  FaqPanel,
  type FaqPanelItem,
  type FaqPanelProps,
  LandingFooterArt,
  type LandingFooterArtProps,
  LandingHeader,
  type LandingHeaderNavItem,
  type LandingHeaderProps,
} from "@/features/landing-page";

describe("landing-page public barrel (W-faq-cta)", () => {
  test("re-exports LandingHeader, FaqPanel, CtaBand, LandingFooterArt and prop types", () => {
    expect(typeof LandingHeader).toBe("function");
    expect(typeof FaqPanel).toBe("function");
    expect(typeof CtaBand).toBe("function");
    expect(typeof LandingFooterArt).toBe("function");

    const navItem: LandingHeaderNavItem = {
      label: "Browse",
      href: "/browse",
    };
    const headerProps: LandingHeaderProps = { items: [navItem] };
    expect(headerProps.items[0]?.href).toBe("/browse");

    const faqItem: FaqPanelItem = {
      id: "q1",
      question: "Q?",
      answer: "A.",
    };
    const faqProps: FaqPanelProps = { items: [faqItem] };
    expect(faqProps.items[0]?.id).toBe("q1");

    const ctaProps: CtaBandProps = {
      headline: "Install",
      ctaLabel: "Get started",
      ctaHref: "/docs/guides",
    };
    expect(ctaProps.ctaHref).toBe("/docs/guides");

    const artProps: LandingFooterArtProps = { src: "/home/seadragon-crop.png" };
    expect(artProps.src).toBe("/home/seadragon-crop.png");
  });
});
