import type { ReactNode } from "react";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { defaultLocale } from "@/lib/i18n/locale-routing";

/**
 * Docs chrome for non-home `(site)` routes (browse, search, blog, docs, tags).
 * Production `/` stays outside this group so LandingPage is full-bleed.
 */
export default async function SiteDocsChromeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const messages = await loadUiMessages();
  return (
    <CanonicalDocsLayout messages={messages} locale={defaultLocale}>
      {children}
    </CanonicalDocsLayout>
  );
}
