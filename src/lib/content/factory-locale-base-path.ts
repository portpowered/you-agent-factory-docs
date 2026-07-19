import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import type { BuildModeEnv } from "@/lib/build/static-export";
import {
  buildLocalizedRoute,
  defaultLocale,
  type LocalizedRouteDestination,
  localePrefix,
  type SiteLocale,
  supportedLocales,
  switchRouteLocale,
} from "@/lib/i18n/locale-routing";
import { resolveLocalizedSiteHref } from "@/lib/navigation/site-navigation-href";
import { withBasePath } from "@/lib/navigation/site-path";
import {
  DOCS_SEARCH_API_PATH,
  resolveDocsSearchBootstrapFromForLocale,
} from "@/lib/search/docs-search-bootstrap-path";

/**
 * Shipped reader locales for factory search and navigation. Matches
 * `supportedLocales` (en, ja, zh-CN, vi).
 */
export const FACTORY_SHIPPED_LOCALES = supportedLocales;

export type FactoryShippedLocale = (typeof FACTORY_SHIPPED_LOCALES)[number];

/**
 * GitHub Pages project-site base path for factory search bootstrap and
 * absolute navigation hrefs under static export.
 */
export const FACTORY_PAGES_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;

export { DOCS_SEARCH_API_PATH, defaultLocale };

const FACTORY_SHIPPED_LOCALE_SET = new Set<string>(FACTORY_SHIPPED_LOCALES);

/**
 * Resolves a factory route destination to a locale-aware app href.
 * Pass `basePath` only for absolute/export contexts — Next `<Link>` already
 * honors `basePath` from next.config and would double-prefix.
 */
export function resolveFactoryLocalizedHref(
  destination: LocalizedRouteDestination,
  locale: SiteLocale,
  basePath = "",
): string {
  return resolveLocalizedSiteHref(destination, locale, basePath);
}

/**
 * Localizes a search-result (or other absolute app) URL for the active
 * reader locale. Default locale keeps the unprefixed path.
 */
export function resolveFactorySearchResultHref(
  url: string,
  locale: SiteLocale,
): string {
  const localized = switchRouteLocale(url, locale);
  assertFactoryLocaleHref(localized, locale);
  return localized;
}

/**
 * Resolves the locale-aware search bootstrap fetch path for live and export
 * builds. Project-site export prefixes with `/you-agent-factory-docs`.
 */
export function resolveFactorySearchBootstrapFrom(
  locale: SiteLocale,
  env: BuildModeEnv = process.env,
): string {
  const bootstrapFrom = resolveDocsSearchBootstrapFromForLocale(locale, env);
  assertFactorySearchBootstrapFrom(bootstrapFrom, locale, env);
  return bootstrapFrom;
}

/**
 * Applies the Pages base path to already-localized factory nav hrefs for
 * absolute/export verification contexts.
 */
export function resolveFactoryNavHrefsWithBasePath(
  hrefs: readonly string[],
  basePath = FACTORY_PAGES_BASE_PATH,
): string[] {
  return hrefs.map((href) => {
    const prefixed = withBasePath(href, basePath);
    if (basePath !== "") {
      assertFactoryPagesBasePathHref(prefixed, basePath);
    }
    return prefixed;
  });
}

export function isFactoryShippedLocale(
  value: string,
): value is FactoryShippedLocale {
  return FACTORY_SHIPPED_LOCALE_SET.has(value);
}

/**
 * Fail closed when a reader-facing href does not honor the locale routing
 * contract for a shipped factory locale.
 */
export function assertFactoryLocaleHref(
  href: string,
  locale: SiteLocale,
): void {
  if (!isFactoryShippedLocale(locale)) {
    throw new Error(
      `Locale "${locale}" is outside the factory shipped set (${FACTORY_SHIPPED_LOCALES.join(", ")}).`,
    );
  }

  const prefix = localePrefix(locale);
  if (prefix === "") {
    for (const other of FACTORY_SHIPPED_LOCALES) {
      if (other === defaultLocale) {
        continue;
      }
      const otherPrefix = `/${other}`;
      if (href === otherPrefix || href.startsWith(`${otherPrefix}/`)) {
        throw new Error(
          `Default-locale href "${href}" must not carry locale prefix "${otherPrefix}".`,
        );
      }
    }
    return;
  }

  if (href !== prefix && !href.startsWith(`${prefix}/`)) {
    throw new Error(
      `Locale "${locale}" href "${href}" must start with "${prefix}".`,
    );
  }
}

/**
 * Fail closed when an absolute/export href is missing the Pages base path.
 */
export function assertFactoryPagesBasePathHref(
  href: string,
  basePath: string = FACTORY_PAGES_BASE_PATH,
): void {
  if (basePath === "") {
    return;
  }

  if (href !== basePath && !href.startsWith(`${basePath}/`)) {
    throw new Error(
      `Project-site href "${href}" must start with Pages base path "${basePath}".`,
    );
  }
}

/**
 * Fail closed when search bootstrap drifts from the locale + Pages contract.
 */
export function assertFactorySearchBootstrapFrom(
  bootstrapFrom: string,
  locale: SiteLocale,
  env: BuildModeEnv = {},
): void {
  const expected = resolveDocsSearchBootstrapFromForLocale(locale, env);
  if (bootstrapFrom !== expected) {
    throw new Error(
      `Search bootstrap "${bootstrapFrom}" does not match factory locale/base-path contract "${expected}" for locale "${locale}".`,
    );
  }

  const isExport = env.NEXT_STATIC_EXPORT === "1";
  const basePath =
    isExport && typeof env.GITHUB_PAGES_BASE_PATH === "string"
      ? env.GITHUB_PAGES_BASE_PATH
      : "";

  if (basePath !== "") {
    assertFactoryPagesBasePathHref(
      bootstrapFrom.split("?")[0] ?? bootstrapFrom,
      basePath,
    );
  }
}

/**
 * Fail closed when breadcrumb / nav segment hrefs break the locale contract.
 */
export function assertFactoryLocaleAwareNavHrefs(
  hrefs: Iterable<string | undefined>,
  locale: SiteLocale,
): void {
  for (const href of hrefs) {
    if (!href) {
      continue;
    }
    assertFactoryLocaleHref(href, locale);
  }
}

/**
 * Convenience: localized factory docs page href (optional Pages base path).
 */
export function resolveFactoryDocsPageHref(
  slug: string,
  locale: SiteLocale,
  basePath = "",
): string {
  return resolveFactoryLocalizedHref(
    { surface: "docs-page", slug },
    locale,
    basePath,
  );
}

/**
 * Convenience: localized factory surface href used by browse/tags/search.
 */
export function resolveFactorySurfaceHref(
  surface: Extract<
    LocalizedRouteDestination["surface"],
    "home" | "browse" | "search" | "tags-index" | "blog-index"
  >,
  locale: SiteLocale,
  basePath = "",
): string {
  return resolveFactoryLocalizedHref({ surface }, locale, basePath);
}

/** Re-export for callers that need the raw localized route without base path. */
export { buildLocalizedRoute };
