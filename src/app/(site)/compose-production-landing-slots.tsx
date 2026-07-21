import type { ReactNode } from "react";
import { Terminal, type TerminalProps } from "@/features/code";
import { SiteFooter, type SiteFooterProps } from "@/features/footer";
import {
  CapabilityStrip,
  FactoryCarousel,
  type FactoryCarouselProps,
  type FactorySlideData,
  FaqPanel,
  type FaqPanelItem,
  type FaqPanelProps,
  HeroSection,
  LandingFooterArt,
  LandingHeader,
  type LandingHeaderNavItem,
  type LandingHeaderProps,
  WhaleBubblesSection,
  type WhaleBubblesSectionProps,
  YouiShowcase,
} from "@/features/landing-page";
import { ParticleSphere } from "@/features/landing-page/components/ParticleSphere";
import type { LandingPageSlots } from "@/features/landing-page/LandingPage";
import {
  fixtureLandingPageData,
  type LandingCapabilityData,
  type LandingCarouselData,
  type LandingCtaContent,
  type LandingFaqData,
  type LandingFooterData,
  type LandingHeaderData,
  type LandingHeroData,
  type LandingPageData,
  type LandingWhaleBubblesData,
  type LandingYouiData,
} from "@/features/landing-page/landing-page.data";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
} from "@/features/landing-page/whale-bubbles.fixtures";

/** Compose-local FAQ heading — same default as harness Wave B / faq-cta-harness. */
const FAQ_PANEL_HEADING = "FAQ";

/**
 * Production `/` LandingPage slots filled from MERGED public exports.
 * CTA stays omitted so LandingPage keeps a labeled placeholder until the
 * Wave B CTA surface is wired in a follow-on story.
 */
export const WIRED_PRODUCTION_LANDING_SLOTS = [
  "header",
  "hero",
  "capability",
  "youi",
  "carousel",
  "faq",
  "whaleBubbles",
  "footer",
] as const satisfies ReadonlyArray<keyof LandingPageSlots>;

export type WiredProductionLandingSlot =
  (typeof WIRED_PRODUCTION_LANDING_SLOTS)[number];

export type ProductionLandingSlots = Pick<
  LandingPageSlots,
  WiredProductionLandingSlot
>;

/**
 * Map fixture header onto the public LandingHeader contract.
 * Fixture `nav` ids are preserved when present; no invented search slot.
 */
export function mapFixtureHeaderToLandingHeaderProps(
  header: LandingHeaderData = fixtureLandingPageData.header,
): LandingHeaderProps {
  const items: LandingHeaderNavItem[] = header.nav.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
  }));

  return {
    brand: header.brand.length > 0 ? header.brand : undefined,
    items,
  };
}

/** Real production header slot: LandingHeader from fixture nav. */
export function composeProductionHeaderSlot(
  header: LandingHeaderData = fixtureLandingPageData.header,
): ReactNode {
  return <LandingHeader {...mapFixtureHeaderToLandingHeaderProps(header)} />;
}

export type FixtureHeroCommandSources = {
  cta?: LandingCtaContent;
  carousel?: LandingCarouselData;
};

/**
 * Map existing fixture command strings onto Terminal `lines`.
 * Prefers `cta.installCommand`, then distinct carousel slide `command` values.
 */
export function mapFixtureCommandsToTerminalLines(
  sources: FixtureHeroCommandSources = {
    cta: fixtureLandingPageData.cta,
    carousel: fixtureLandingPageData.carousel,
  },
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  const push = (command: string | undefined) => {
    if (command == null || command.length === 0 || seen.has(command)) {
      return;
    }
    seen.add(command);
    lines.push(command);
  };

  push(sources.cta?.installCommand);
  for (const slide of sources.carousel?.slides ?? []) {
    push(slide.command);
  }

  return lines;
}

/** Soft-wire Terminal props from fixture command lines. */
export function mapFixtureCommandsToTerminalProps(
  sources?: FixtureHeroCommandSources,
): Pick<TerminalProps, "lines" | "variant"> | null {
  const lines = mapFixtureCommandsToTerminalLines(sources);
  if (lines.length === 0) {
    return null;
  }
  return { lines, variant: "install" };
}

/**
 * Real production hero: HeroSection with Wave A ParticleSphere + optional
 * Terminal holes. Title/subtitle map from fixture hero fields.
 */
export function composeProductionHeroSlot(
  hero: LandingHeroData = fixtureLandingPageData.hero,
  commandSources: FixtureHeroCommandSources = {
    cta: fixtureLandingPageData.cta,
    carousel: fixtureLandingPageData.carousel,
  },
): ReactNode {
  const terminal = mapFixtureCommandsToTerminalProps(commandSources);

  return (
    <HeroSection
      sphere={<ParticleSphere className="h-full min-h-[220px] w-full" />}
      subtitle={hero.subtitle}
      terminal={terminal != null ? <Terminal {...terminal} /> : undefined}
      title={hero.title}
    />
  );
}

/** Capability strip from fixture capability items (already exported). */
export function composeProductionCapabilitySlot(
  capability: LandingCapabilityData = fixtureLandingPageData.capability,
): ReactNode {
  return <CapabilityStrip items={[...capability.items]} />;
}

/**
 * Youi showcase from fixture youi fields. Maps `imageSrc` → `backgroundSrc`;
 * graph uses YouiShowcase public defaults when not present on fixture.
 */
export function composeProductionYouiSlot(
  youi: LandingYouiData = fixtureLandingPageData.youi,
): ReactNode {
  return <YouiShowcase backgroundSrc={youi.imageSrc} title={youi.title} />;
}

/**
 * Map landing fixture carousel slides onto the public FactoryCarousel /
 * FactorySlideData contract. Keeps id / title / blurb / command only; omits
 * `art` unless the fixture already supplies a caller-owned ReactNode (no path
 * → ReactNode invention from strings). Mirrored from harness Wave B — do not
 * import from (dev)/landing-harness/**.
 */
export function mapFixtureCarouselToFactoryCarouselProps(
  carousel: LandingCarouselData = fixtureLandingPageData.carousel,
): Pick<FactoryCarouselProps, "slides"> {
  const slides: FactorySlideData[] = carousel.slides.map((slide) => {
    const mapped: FactorySlideData = {
      id: slide.id,
      title: slide.title,
      blurb: slide.blurb,
      command: slide.command,
    };
    if (slide.art != null) {
      mapped.art = slide.art;
    }
    return mapped;
  });

  return { slides };
}

/** Real production carousel slot: FactoryCarousel from fixture slides. */
export function composeProductionCarouselSlot(
  carousel: LandingCarouselData = fixtureLandingPageData.carousel,
): ReactNode {
  return (
    <FactoryCarousel {...mapFixtureCarouselToFactoryCarouselProps(carousel)} />
  );
}

/**
 * Map landing fixture FAQ items onto the public FaqPanel / FaqPanelItem
 * contract (id / question / answer). No invented FAQ schemas. Mirrored from
 * harness Wave B — do not import from (dev)/landing-harness/**.
 */
export function mapFixtureFaqToFaqPanelProps(
  faq: LandingFaqData = fixtureLandingPageData.faq,
): Pick<FaqPanelProps, "items" | "heading"> {
  const items: FaqPanelItem[] = faq.items.map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
  }));

  return { items, heading: FAQ_PANEL_HEADING };
}

/** Real production faq slot: FaqPanel from fixture items. */
export function composeProductionFaqSlot(
  faq: LandingFaqData = fixtureLandingPageData.faq,
): ReactNode {
  return <FaqPanel {...mapFixtureFaqToFaqPanelProps(faq)} />;
}

/**
 * Map landing fixture whale/bubbles data onto WhaleBubblesSection props.
 * Falls back to `WHALE_BUBBLES_FIXTURE_*` when fixture fields are empty.
 */
export function mapFixtureWhaleBubblesToSectionProps(
  whaleBubbles: LandingWhaleBubblesData = fixtureLandingPageData.whaleBubbles,
): Pick<WhaleBubblesSectionProps, "whaleSrc" | "items"> {
  const whaleSrc =
    whaleBubbles.whaleSrc != null && whaleBubbles.whaleSrc.length > 0
      ? whaleBubbles.whaleSrc
      : WHALE_BUBBLES_FIXTURE_SRC;
  const items =
    whaleBubbles.bubbles.length > 0
      ? whaleBubbles.bubbles.map((bubble) => ({
          id: bubble.id,
          label: bubble.label,
        }))
      : WHALE_BUBBLES_FIXTURE_ITEMS;

  return { whaleSrc, items };
}

/** Real production whaleBubbles slot fill. */
export function composeProductionWhaleBubblesSlot(
  whaleBubbles: LandingWhaleBubblesData = fixtureLandingPageData.whaleBubbles,
): ReactNode {
  return (
    <WhaleBubblesSection
      {...mapFixtureWhaleBubblesToSectionProps(whaleBubbles)}
    />
  );
}

/**
 * Map fixture footer onto SiteFooter. Uses LandingFooterArt for `artSrc`
 * (MERGED public footer-art export). Omits fixture-only `meta.tagline`.
 */
export function mapFixtureFooterToSiteFooterProps(
  footer: LandingFooterData = fixtureLandingPageData.footer,
): SiteFooterProps {
  const art =
    footer.artSrc != null && footer.artSrc.length > 0 ? (
      <LandingFooterArt src={footer.artSrc} />
    ) : undefined;

  return {
    columns: footer.columns,
    meta: {
      copyright: footer.meta.copyright,
    },
    art,
  };
}

/** Real production footer: SiteFooter + LandingFooterArt. */
export function composeProductionFooterSlot(
  footer: LandingFooterData = fixtureLandingPageData.footer,
): ReactNode {
  return <SiteFooter {...mapFixtureFooterToSiteFooterProps(footer)} />;
}

/**
 * Aggregate production LandingPage slot props from MERGED public exports.
 * Returns only wired keys — cta stays on LandingPage placeholder defaults
 * until a follow-on Wave B story wires it. Props map from
 * `fixtureLandingPageData` (or optional override) onto public component
 * contracts only; no CMS schemas.
 */
export function composeProductionLandingSlots(
  data: LandingPageData = fixtureLandingPageData,
): ProductionLandingSlots {
  return {
    header: composeProductionHeaderSlot(data.header),
    hero: composeProductionHeroSlot(data.hero, {
      cta: data.cta,
      carousel: data.carousel,
    }),
    capability: composeProductionCapabilitySlot(data.capability),
    youi: composeProductionYouiSlot(data.youi),
    carousel: composeProductionCarouselSlot(data.carousel),
    faq: composeProductionFaqSlot(data.faq),
    whaleBubbles: composeProductionWhaleBubblesSlot(data.whaleBubbles),
    footer: composeProductionFooterSlot(data.footer),
  };
}
