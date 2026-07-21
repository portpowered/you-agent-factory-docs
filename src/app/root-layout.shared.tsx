import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { resolveGaMeasurementId } from "@/lib/analytics/ga-measurement-id";
import { SITE_PRODUCT_NAME } from "@/lib/scaffold";
import { resolveProductionMetadataBase } from "@/lib/seo/production-metadata-base";
import {
  defaultSocialOpenGraphImages,
  defaultSocialTwitter,
} from "@/lib/seo/social-preview-assets";

export const siteMetadata: Metadata = {
  metadataBase: resolveProductionMetadataBase(),
  // SEO/document title keeps the full product name; header chrome uses YOU.
  title: SITE_PRODUCT_NAME,
  description:
    "CLI documentation for installing the factory, running named goals, and operating agent workflows",
  openGraph: {
    images: defaultSocialOpenGraphImages(),
  },
  twitter: defaultSocialTwitter(),
};

type RootDocumentProps = {
  children: ReactNode;
  lang: string;
};

/**
 * Shared HTML shell for (site), [locale], docs, and (dev). Mounts GA4 once via
 * `@next/third-parties` when the resolved Measurement ID is non-empty. No raw
 * duplicate gtag HTML — pageviews only (Wave A).
 */
export function RootDocument({ children, lang }: RootDocumentProps) {
  const gaId = resolveGaMeasurementId();

  return (
    <html
      lang={lang}
      className="dark"
      data-color-palette="factory-dark"
      suppressHydrationWarning
    >
      <body>
        {children}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
