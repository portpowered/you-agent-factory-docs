import type { Metadata } from "next";
import type { ReactNode } from "react";
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

export function RootDocument({ children, lang }: RootDocumentProps) {
  return (
    <html
      lang={lang}
      className="dark"
      data-color-palette="factory-dark"
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
