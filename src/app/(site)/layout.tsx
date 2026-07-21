import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootDocument, siteMetadata } from "@/app/root-layout.shared";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { RouteLocaleEffect } from "@/features/i18n/RouteLocaleEffect";
import { AppProviders } from "@/features/providers/app-providers";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { defaultLocale } from "@/lib/i18n/locale-routing";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";
import "../globals.css";

export const metadata: Metadata = siteMetadata;

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const messages = await loadUiMessages();
  const metaByUrl = searchResultMetaMapToRecord(
    await loadSearchResultMetaMap(defaultLocale),
  );
  return (
    <RootDocument lang={defaultLocale}>
      <AppProviders metaByUrl={metaByUrl} messages={messages}>
        <CanonicalDocsLayout messages={messages} locale={defaultLocale}>
          <RouteLocaleEffect locale={defaultLocale} />
          {children}
        </CanonicalDocsLayout>
      </AppProviders>
    </RootDocument>
  );
}
