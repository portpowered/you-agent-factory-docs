"use client";

import type { ReactNode } from "react";
import { PageAssetsProvider } from "@/features/docs/components/page-assets-context";
import { PageMessagesProvider } from "@/features/docs/components/page-messages-context";
import type { PageAssetConfig, PageMessages } from "@/lib/content/schemas";
import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type { SiteLocale } from "@/lib/i18n/locale-routing";
import { ReferenceChromeProvider } from "@/lib/i18n/reference-chrome-context";

export function DocsPageProviders({
  messages,
  assets,
  locale,
  referenceChrome,
  children,
}: {
  messages: PageMessages;
  assets: PageAssetConfig;
  locale?: SiteLocale;
  /** Localized Factory-reference chrome for inventory/badge surfaces (W17). */
  referenceChrome?: ReferenceChromeMessages;
  children?: ReactNode;
}) {
  const body = (
    <PageMessagesProvider messages={messages} locale={locale}>
      <PageAssetsProvider assets={assets}>{children}</PageAssetsProvider>
    </PageMessagesProvider>
  );

  if (referenceChrome === undefined) {
    return body;
  }

  return (
    <ReferenceChromeProvider chrome={referenceChrome}>
      {body}
    </ReferenceChromeProvider>
  );
}
