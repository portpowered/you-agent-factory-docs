import {
  buildLocalizedRoute,
  type LocalizedRouteDestination,
  type SiteLocale,
  switchRouteLocale,
} from "@/lib/i18n/locale-routing";
import { withBasePath } from "@/lib/navigation/site-path";

/**
 * Resolves a localized route destination to an absolute site href for the
 * given GitHub Pages base path. Empty base path keeps root (unprefixed) hrefs;
 * project-site builds prefix with `/you-agent-factory-docs`.
 *
 * Do not pass the result to Next `<Link>` when next.config already sets
 * `basePath` — Link would double-prefix. Use for absolute URL / export contexts.
 */
export function resolveLocalizedSiteHref(
  destination: LocalizedRouteDestination,
  locale: SiteLocale,
  basePath = "",
): string {
  return withBasePath(buildLocalizedRoute(destination, locale), basePath);
}

/**
 * Resolves a locale-switched pathname under the given base path.
 * Same Link double-prefix caveat as `resolveLocalizedSiteHref`.
 */
export function resolveLocaleSwitchedSiteHref(
  pathname: string,
  locale: SiteLocale,
  basePath = "",
): string {
  return withBasePath(switchRouteLocale(pathname, locale), basePath);
}

/**
 * Applies the project-site (or root) base path to already-built nav hrefs.
 */
export function resolveSiteNavigationHrefs(
  hrefs: readonly string[],
  basePath = "",
): string[] {
  return hrefs.map((href) => withBasePath(href, basePath));
}
