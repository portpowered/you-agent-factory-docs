import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isShippedLocalizedDocsSlug } from "@/lib/content/shipped-localized-docs";
import {
  buildLocalizedRoute,
  defaultLocale,
  type LocalizedRouteDestination,
  resolveLocale,
  type SiteLocale,
  supportedLocales,
  UnsupportedLocaleError,
} from "@/lib/i18n/locale-routing";

export function resolveRouteLocaleOrNotFound(locale?: string): SiteLocale {
  try {
    return resolveLocale(locale);
  } catch (error) {
    if (error instanceof UnsupportedLocaleError) {
      notFound();
    }
    throw error;
  }
}

/**
 * Builds canonical + language-alternate metadata hrefs for a route destination.
 *
 * Hrefs stay app-relative (unprefixed). Production origin + project-site base
 * path live on root `metadataBase` (`resolveProductionMetadataBase`); Next.js
 * joins these paths onto that base. Do not also run
 * `prefixMetadataAlternates` here — that double-prefixes under project-site
 * export.
 */
export function localizedRouteAlternates(
  destination: LocalizedRouteDestination,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: buildLocalizedRoute(destination, defaultLocale),
    languages: Object.fromEntries(
      supportedLocales.map((locale) => [
        locale,
        buildLocalizedRoute(destination, locale),
      ]),
    ),
  };
}

/**
 * Docs-page alternates filtered to locales that actually ship the slug under
 * fail-closed rules (W17). Unshipped locales are omitted from hreflang rather
 * than advertised. Use for `/docs/<slug>` pages and reference family routes.
 *
 * Uses the generated shipped-locale manifest (same gate as the language
 * switcher) so this helper stays free of server-only page loaders.
 */
export function localizedShippedDocsPageAlternates(
  docsSlug: string,
): NonNullable<Metadata["alternates"]> {
  const alternates = localizedRouteAlternates({
    surface: "docs-page",
    slug: docsSlug,
  });
  const languages = alternates.languages ?? {};

  return {
    ...alternates,
    languages: Object.fromEntries(
      Object.entries(languages).filter(([locale]) =>
        isShippedLocalizedDocsSlug(docsSlug, locale as SiteLocale),
      ),
    ),
  };
}

export function generateStaticLocaleParams() {
  return supportedLocales
    .filter((locale) => locale !== defaultLocale)
    .map((locale) => ({ locale }));
}

export function localizeStaticParams<TParam extends Record<string, unknown>>(
  params: readonly TParam[],
): Array<TParam & { locale: SiteLocale }> {
  return generateStaticLocaleParams().flatMap(({ locale }) =>
    params.map((param) => ({
      ...param,
      locale,
    })),
  );
}
