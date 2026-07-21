import type { ReactNode } from "react";
import { Terminal, type TerminalProps } from "@/features/code";
import { SiteFooter, type SiteFooterProps } from "@/features/footer";
import {
  WhaleBubblesSection,
  type WhaleBubblesSectionProps,
} from "@/features/landing-page";
import { ParticleSphere } from "@/features/landing-page/components/ParticleSphere";
import {
  fixtureLandingPageData,
  type LandingCarouselData,
  type LandingCtaContent,
  type LandingFooterData,
  type LandingWhaleBubblesData,
} from "@/features/landing-page/landing-page.data";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_FIXTURE_SRC,
} from "@/features/landing-page/whale-bubbles.fixtures";

/**
 * Map landing fixture footer data onto the public SiteFooter contract.
 * Omits fixture-only extras (for example `meta.tagline`); maps `artSrc` to an
 * optional caller-owned `<img>` node.
 */
export function mapFixtureFooterToSiteFooterProps(
  footer: LandingFooterData = fixtureLandingPageData.footer,
): SiteFooterProps {
  const art =
    footer.artSrc != null && footer.artSrc.length > 0 ? (
      // Decorative fixture art for harness preview. SiteFooter owns `art?: ReactNode`,
      // not asset-path schemas — map the public path string at compose time.
      <img
        alt=""
        aria-hidden="true"
        className="h-24 w-full object-contain"
        data-testid="landing-harness-footer-art"
        src={footer.artSrc}
      />
    ) : undefined;

  return {
    columns: footer.columns,
    meta: {
      copyright: footer.meta.copyright,
    },
    art,
  };
}

/** Real Wave A footer slot fill for landing-harness (W-integrate). */
export function composeWaveAFooterSlot(
  footer: LandingFooterData = fixtureLandingPageData.footer,
): ReactNode {
  return <SiteFooter {...mapFixtureFooterToSiteFooterProps(footer)} />;
}

/**
 * Map landing fixture whale/bubbles data onto the public WhaleBubblesSection
 * contract. Falls back to `WHALE_BUBBLES_FIXTURE_*` when fixture fields are
 * empty so the harness still mounts a reviewable mid→end plate.
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

/** Real Wave A whaleBubbles slot fill for landing-harness (W-integrate). */
export function composeWaveAWhaleBubblesSlot(
  whaleBubbles: LandingWhaleBubblesData = fixtureLandingPageData.whaleBubbles,
): ReactNode {
  return (
    <WhaleBubblesSection
      {...mapFixtureWhaleBubblesToSectionProps(whaleBubbles)}
    />
  );
}

export type FixtureHeroCommandSources = {
  cta?: LandingCtaContent;
  carousel?: LandingCarouselData;
};

/**
 * Map existing fixture command strings onto Terminal `lines` (soft-wire).
 * Prefers `cta.installCommand`, then distinct carousel slide `command` values.
 * No invented Terminal props beyond the public contract.
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

/** Soft-wire Terminal props from fixture command lines (optional hero chrome). */
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
 * Real Wave A hero slot fill for landing-harness (W-integrate): ParticleSphere
 * in the hero hole, with optional Terminal command chrome from fixture lines.
 * Does not mount Wave B LandingHeader / HeroPortrait.
 */
export function composeWaveAHeroSlot(
  sources: FixtureHeroCommandSources = {
    cta: fixtureLandingPageData.cta,
    carousel: fixtureLandingPageData.carousel,
  },
): ReactNode {
  const terminal = mapFixtureCommandsToTerminalProps(sources);

  return (
    <section
      className="relative flex min-h-[640px] w-full flex-col bg-neutral-950 text-neutral-100"
      data-landing-harness-hero=""
    >
      <div
        className="relative min-h-[320px] w-full flex-1"
        data-landing-harness-hero-sphere=""
      >
        <ParticleSphere className="h-full min-h-[320px] w-full" />
      </div>
      {terminal != null ? (
        <div
          className="mx-auto w-full max-w-xl px-6 pb-8"
          data-landing-harness-hero-terminal=""
        >
          <Terminal {...terminal} />
        </div>
      ) : null}
    </section>
  );
}
