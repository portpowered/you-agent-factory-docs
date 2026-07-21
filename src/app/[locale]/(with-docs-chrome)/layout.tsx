import type { ReactNode } from "react";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { resolveRouteLocaleOrNotFound } from "@/lib/i18n/route-locale";

/**
 * Docs chrome for non-home localized routes. Localized home (`/[locale]`) stays
 * outside this group so it shares the production landing chrome bypass.
 */
export default async function LocalizedDocsChromeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveRouteLocaleOrNotFound(rawLocale);
  const messages = await loadUiMessages(locale);
  return (
    <CanonicalDocsLayout messages={messages} locale={locale}>
      {children}
    </CanonicalDocsLayout>
  );
}
