"use client";

/**
 * Locale-aware wrapper for package-sourced contract description prose (W17).
 *
 * Resolves the active UI locale from an explicit prop, then page messages
 * context (DocsPageProviders), then the site default. On non-default locales,
 * emits an English language boundary via EnglishContractDescription.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { useOptionalPageMessagesContext } from "@/features/docs/components/page-messages-context";
import { EnglishContractDescription } from "@/lib/i18n/contract-language-boundary";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { cn } from "@/lib/utils";

export type ContractDescriptionProseProps = {
  /** Override UI locale; defaults to page context, then site default. */
  locale?: SiteLocale;
  children: ReactNode;
  className?: string;
  /**
   * Element tag. Defaults to `p` to match common reference description markup.
   * Use `span` for inline descriptions beside identifiers.
   */
  as?: "p" | "span";
} & Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "className" | "as" | "locale"
>;

/**
 * Resolve the UI locale for contract-description language boundaries.
 * Prefer an explicit prop, then DocsPageProviders page context, then `en`.
 */
export function resolveContractDescriptionLocale(
  localeProp: SiteLocale | undefined,
  pageLocale: SiteLocale | undefined,
): SiteLocale {
  return localeProp ?? pageLocale ?? defaultLocale;
}

/**
 * Renders canonical English contract description prose with the correct
 * language boundary for the surrounding UI locale.
 */
export function ContractDescriptionProse({
  locale: localeProp,
  children,
  className,
  as = "p",
  ...rest
}: ContractDescriptionProseProps) {
  const page = useOptionalPageMessagesContext();
  const locale = resolveContractDescriptionLocale(localeProp, page?.locale);

  return (
    <EnglishContractDescription
      as={as}
      className={cn(className)}
      locale={locale}
      {...rest}
    >
      {children}
    </EnglishContractDescription>
  );
}
