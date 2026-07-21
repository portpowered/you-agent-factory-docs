import type { ReactNode } from "react";
import { SiteFooter, type SiteFooterProps } from "@/features/footer";
import {
  fixtureLandingPageData,
  type LandingFooterData,
} from "@/features/landing-page/landing-page.data";

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
