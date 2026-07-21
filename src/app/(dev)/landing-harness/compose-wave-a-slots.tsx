import type { ReactNode } from "react";
import { SiteFooter, type SiteFooterProps } from "@/features/footer";
import {
  WhaleBubblesSection,
  type WhaleBubblesSectionProps,
} from "@/features/landing-page";
import {
  fixtureLandingPageData,
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
