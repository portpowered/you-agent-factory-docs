import type { ReactNode } from "react";
import type { TerminalProps } from "@/features/code";
import { SiteFooter, type SiteFooterProps } from "@/features/footer";
import {
  CapabilityStrip,
  CtaBand,
  type CtaBandProps,
  FactoryCarousel,
  type FactoryCarouselProps,
  type FactorySlideData,
  FaqPanel,
  type FaqPanelItem,
  type FaqPanelProps,
  HeroCommandPanel,
  type HeroModelProvider,
  HeroPortrait,
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
import { YouiCompactGoalReplayIsland } from "@/features/landing-page/components/YouiCompactGoalReplayIsland";
import type {
  LandingPageProps,
  LandingPageSlots,
} from "@/features/landing-page/LandingPage";
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
import { resolveLandingHomeAssets } from "@/features/landing-page/landing-page.public-assets";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
} from "@/features/landing-page/whale-bubbles.fixtures";
import type { BuildModeEnv } from "@/lib/build/static-export";
import { resolvePublicAssetHref } from "@/lib/navigation/site-metadata-path";

/** Compose-local FAQ heading — same default as harness Wave B / faq-cta-harness. */
const FAQ_PANEL_HEADING = "FAQ";

/**
 * Compose-local CTA control defaults — same as harness Wave B / faq-cta-harness.
 * Not fixture schema fields; LandingCtaContent has no ctaLabel / ctaHref.
 */
const CTA_BAND_LABEL = "Install the CLI";
const CTA_BAND_HREF = "/docs/guides";

/**
 * Production `/` LandingPage slots filled from MERGED public exports.
 * Includes Wave A fills plus Wave B carousel / faq / cta.
 */
export const WIRED_PRODUCTION_LANDING_SLOTS = [
  "header",
  "hero",
  "capability",
  "youi",
  "carousel",
  "faq",
  "cta",
  "whaleBubbles",
  "footer",
] as const satisfies ReadonlyArray<keyof LandingPageSlots>;

export type WiredProductionLandingSlot =
  (typeof WIRED_PRODUCTION_LANDING_SLOTS)[number];

export type ProductionLandingSlots = Pick<
  LandingPageSlots,
  WiredProductionLandingSlot
> &
  Pick<LandingPageProps, "midSceneBackgroundSrc" | "midSceneTransitionSrc">;

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
  search?: ReactNode,
): ReactNode {
  return (
    <LandingHeader
      {...mapFixtureHeaderToLandingHeaderProps(header)}
      search={search}
    />
  );
}

export const HOMEPAGE_INSTALL_COMMAND =
  "curl -fsSL https://youagentfactory.com/install.sh | sh";

export const HOMEPAGE_GOAL_COMMAND =
  'you run -a "loop" --to "build site, no mistakes"';

export const HOMEPAGE_MODEL_PROVIDERS = [
  {
    id: "claude",
    label: "Claude",
    parameter: "--provider claude",
  },
  {
    id: "codex",
    label: "Codex",
    parameter: "--provider codex",
  },
  {
    id: "cursor",
    label: "Cursor",
    parameter: "--provider cursor",
  },
  {
    id: "agy",
    label: "Agy",
    parameter: "--provider agy",
  },
  {
    id: "opencode",
    label: "OpenCode",
    parameter: "--provider opencode",
  },
  {
    id: "pi",
    label: "Pi",
    parameter: "--provider pi",
  },
] as const satisfies readonly HeroModelProvider[];

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
  _commandSources: FixtureHeroCommandSources = {
    cta: fixtureLandingPageData.cta,
    carousel: fixtureLandingPageData.carousel,
  },
): ReactNode {
  return (
    <HeroSection
      portrait={<HeroPortrait src={hero.portraitSrc} />}
      sphere={<ParticleSphere className="aspect-square h-auto w-full" />}
      subtitle=""
      terminal={
        <HeroCommandPanel
          goalCommand={HOMEPAGE_GOAL_COMMAND}
          installCommand={HOMEPAGE_INSTALL_COMMAND}
          providers={HOMEPAGE_MODEL_PROVIDERS}
        />
      }
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
 * Wires the landing-owned compact goal replay island as `replayIsland` while
 * keeping the semantic/static graph fallback in delivered HTML.
 */
export function composeProductionYouiSlot(
  youi: LandingYouiData = fixtureLandingPageData.youi,
  graphSrc?: string,
): ReactNode {
  return (
    <YouiShowcase
      backgroundSrc={youi.imageSrc}
      graphSrc={graphSrc}
      replayIsland={<YouiCompactGoalReplayIsland />}
      title={youi.title}
    />
  );
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
  octopusSrc?: string,
): ReactNode {
  return (
    <section
      className="relative isolate overflow-hidden bg-transparent pb-24 text-[#191f2b] [--foreground:#191f2b] [--muted-foreground:#46505f]"
      data-factory-scene=""
    >
      <div className="relative mx-auto max-w-[100rem]">
        <FactoryCarousel
          {...mapFixtureCarouselToFactoryCarouselProps(carousel)}
          className="relative z-10"
          eyebrow="pre-installed factories"
          featureArtSrc={octopusSrc}
          initialIndex={Math.min(1, Math.max(0, carousel.slides.length - 1))}
        />
      </div>
    </section>
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
  return (
    <FaqPanel
      {...mapFixtureFaqToFaqPanelProps(faq)}
      className="mx-auto max-w-[100rem]"
      surface="parchment"
    />
  );
}

/**
 * Map landing fixture CTA fields onto the public CtaBand contract.
 * Reuses faq-cta-harness defaults for required `ctaLabel` and optional
 * `ctaHref` — does not extend LandingCtaContent or invent schema fields.
 * Mirrored from harness Wave B — do not import from (dev)/landing-harness/**.
 */
export function mapFixtureCtaToCtaBandProps(
  cta: LandingCtaContent = fixtureLandingPageData.cta,
): CtaBandProps {
  return {
    headline: cta.headline,
    supporting: cta.supporting,
    installCommand: cta.installCommand,
    ctaLabel: CTA_BAND_LABEL,
    ctaHref: CTA_BAND_HREF,
  };
}

/** Real production cta slot: CtaBand from fixture CTA fields. */
export function composeProductionCtaSlot(
  cta: LandingCtaContent = fixtureLandingPageData.cta,
  fogSrc?: string,
): ReactNode {
  return (
    <CtaBand
      {...mapFixtureCtaToCtaBandProps(cta)}
      fogSrc={fogSrc}
      installCommand={undefined}
      showAction={false}
      supporting={undefined}
      surface="overlay"
    />
  );
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
          description: bubble.description,
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
      renderPlate={false}
    />
  );
}

/**
 * Map fixture footer onto SiteFooter. Uses LandingFooterArt for `artSrc`
 * (MERGED public footer-art export). Omits fixture-only `meta.tagline`.
 */
export function mapFixtureFooterToSiteFooterProps(
  footer: LandingFooterData = fixtureLandingPageData.footer,
  fieldSrc?: string,
): SiteFooterProps {
  const art =
    footer.artSrc != null && footer.artSrc.length > 0 ? (
      <LandingFooterArt fieldSrc={fieldSrc} src={footer.artSrc} />
    ) : undefined;

  return {
    columns: footer.columns,
    meta: {
      copyright: footer.meta.copyright,
      links: [
        ...(footer.meta.author
          ? [{ label: footer.meta.author, href: "/coming-soon/about" }]
          : []),
        ...(footer.meta.license
          ? [
              {
                label: footer.meta.license,
                href: "https://github.com/portpowered/you-agent-factory/blob/main/LICENSE",
              },
            ]
          : []),
      ],
    },
    art,
    className:
      "[--background:#dfd6c5] [--foreground:#191f2b] [--muted-foreground:#46505f] [--border:rgba(25,31,43,0.22)]",
  };
}

/** Real production footer: SiteFooter + LandingFooterArt. */
export function composeProductionFooterSlot(
  footer: LandingFooterData = fixtureLandingPageData.footer,
  fieldSrc?: string,
): ReactNode {
  return (
    <SiteFooter {...mapFixtureFooterToSiteFooterProps(footer, fieldSrc)} />
  );
}

/**
 * Aggregate production LandingPage slot props from MERGED public exports.
 * Returns only wired keys. Props map from `fixtureLandingPageData` (or
 * optional override) onto public component contracts only; no CMS schemas.
 */
export function composeProductionLandingSlots(
  data: LandingPageData = fixtureLandingPageData,
  basePathOrEnv: string | BuildModeEnv = process.env,
  search?: ReactNode,
): ProductionLandingSlots {
  const assets = resolveLandingHomeAssets(basePathOrEnv);
  const resolveOptionalAsset = (assetPath: string | undefined) =>
    assetPath === undefined
      ? undefined
      : resolvePublicAssetHref(assetPath, basePathOrEnv);

  return {
    header: composeProductionHeaderSlot(data.header, search),
    hero: composeProductionHeroSlot(
      {
        ...data.hero,
        portraitSrc:
          resolveOptionalAsset(data.hero.portraitSrc) ?? assets.womanHead,
      },
      {
        cta: data.cta,
        carousel: data.carousel,
      },
    ),
    capability: composeProductionCapabilitySlot(data.capability),
    youi: composeProductionYouiSlot(
      {
        ...data.youi,
        imageSrc: resolveOptionalAsset(data.youi.imageSrc) ?? assets.monkey,
      },
      assets.factoryGraphUi,
    ),
    carousel: composeProductionCarouselSlot(data.carousel, assets.octopus),
    faq: composeProductionFaqSlot(data.faq),
    cta: composeProductionCtaSlot(data.cta, assets.ctaFog),
    whaleBubbles: composeProductionWhaleBubblesSlot({
      ...data.whaleBubbles,
      whaleSrc:
        resolveOptionalAsset(data.whaleBubbles.whaleSrc) ?? assets.midEndWhale,
    }),
    footer: composeProductionFooterSlot(
      {
        ...data.footer,
        artSrc:
          resolveOptionalAsset(data.footer.artSrc) ?? assets.seadragonCrop,
      },
      assets.youYouYouBackground,
    ),
    midSceneBackgroundSrc: assets.midEndWhale,
    midSceneTransitionSrc: assets.youYouYouBackground,
  };
}
