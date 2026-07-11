import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_BRAND_NAME } from "@/lib/scaffold";
import { resolveProductionMetadataBase } from "@/lib/seo/production-metadata-base";
import {
  defaultSocialOpenGraphImages,
  defaultSocialTwitter,
} from "@/lib/seo/social-preview-assets";

export const siteMetadata: Metadata = {
  metadataBase: resolveProductionMetadataBase(),
  title: SITE_BRAND_NAME,
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
    <html lang={lang} className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
