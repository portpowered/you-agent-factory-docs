import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  type BuildModeEnv,
  resolveGitHubPagesBasePath,
} from "@/lib/build/static-export";
import {
  buildLocalizedRoute,
  defaultLocale,
  type LocalizedRouteDestination,
  resolveLocale,
  type SiteLocale,
  supportedLocales,
  UnsupportedLocaleError,
} from "@/lib/i18n/locale-routing";
import { prefixMetadataAlternates } from "@/lib/navigation/site-metadata-path";

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
 * Project-site static exports prefix via the shared GitHub Pages base path;
 * root / non-export builds stay unprefixed. Pass `env` in tests to assert both
 * modes without mutating process.env.
 */
export function localizedRouteAlternates(
  destination: LocalizedRouteDestination,
  env: BuildModeEnv = process.env,
): NonNullable<Metadata["alternates"]> {
  return prefixMetadataAlternates(
    {
      canonical: buildLocalizedRoute(destination, defaultLocale),
      languages: Object.fromEntries(
        supportedLocales.map((locale) => [
          locale,
          buildLocalizedRoute(destination, locale),
        ]),
      ),
    },
    resolveGitHubPagesBasePath(env),
  );
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
