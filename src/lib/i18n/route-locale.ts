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
import { resolveDocumentationRouteMigrationCanonicalDocsSlug } from "@/lib/seo/documentation-route-migration";

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
 *
 * When locale language alternates are advertised, also sets
 * `languages["x-default"]` to the English (defaultLocale) canonical href so
 * crawlers have an explicit default-language fallback.
 */
export function localizedRouteAlternates(
  destination: LocalizedRouteDestination,
): NonNullable<Metadata["alternates"]> {
  const defaultLocaleHref = buildLocalizedRoute(destination, defaultLocale);
  return {
    canonical: defaultLocaleHref,
    languages: {
      ...Object.fromEntries(
        supportedLocales.map((locale) => [
          locale,
          buildLocalizedRoute(destination, locale),
        ]),
      ),
      "x-default": defaultLocaleHref,
    },
  };
}

/**
 * English canonical-only alternates for surfaces that do not ship locale
 * variants yet (blog index / posts until blog locales ship).
 *
 * Intentionally omits `languages` so crawlers do not see false ja / zh-CN / vi
 * hreflang targets. Prefer this over `localizedRouteAlternates` for blog until
 * real translated blog content ships.
 */
export function englishOnlyCanonicalAlternates(
  destination: LocalizedRouteDestination,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: buildLocalizedRoute(destination, defaultLocale),
  };
}

const X_DEFAULT_HREFLANG = "x-default";

/**
 * Docs-page alternates filtered to locales that actually ship the slug under
 * fail-closed rules (W17). Unshipped locales are omitted from hreflang rather
 * than advertised. Use for `/docs/<slug>` pages and reference family routes.
 *
 * Plan §10 migration old slugs remap canonical + hreflang to the family target
 * slug (W18) so compatibility HTML does not compete as a canonical URL.
 *
 * Uses the generated shipped-locale manifest (same gate as the language
 * switcher) so this helper stays free of server-only page loaders.
 *
 * Keeps `x-default` → English canonical whenever shipped language alternates
 * remain after filtering (at minimum `en`).
 */
export function localizedShippedDocsPageAlternates(
  docsSlug: string,
): NonNullable<Metadata["alternates"]> {
  const canonicalDocsSlug =
    resolveDocumentationRouteMigrationCanonicalDocsSlug(docsSlug);
  const alternates = localizedRouteAlternates({
    surface: "docs-page",
    slug: canonicalDocsSlug,
  });
  const languages = alternates.languages ?? {};
  const xDefaultHref = languages[X_DEFAULT_HREFLANG];

  const shippedLanguages = Object.fromEntries(
    Object.entries(languages).filter(
      ([locale]) =>
        locale !== X_DEFAULT_HREFLANG &&
        isShippedLocalizedDocsSlug(canonicalDocsSlug, locale as SiteLocale),
    ),
  );

  if (
    Object.keys(shippedLanguages).length > 0 &&
    typeof xDefaultHref === "string"
  ) {
    shippedLanguages[X_DEFAULT_HREFLANG] = xDefaultHref;
  }

  return {
    ...alternates,
    languages: shippedLanguages,
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
