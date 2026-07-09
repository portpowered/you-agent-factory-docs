import {
  buildLocalizedRoute,
  defaultLocale,
  type LocalizedRouteDestination,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import type { SiteConfig } from "./site-config.contract";

/**
 * Client-safe brand/home resolution for shell chrome.
 * Kept separate from `site-config-resolution.ts` so client components do not
 * pull Node-only featured-link helpers (`pages` / `fs`).
 */
export function requireSiteConfigRouteSurface(
  config: SiteConfig,
  routeSurface: string,
): LocalizedRouteDestination {
  const destination = config.routeSurfaces[routeSurface];
  if (!destination) {
    throw new Error(`Missing site config route surface: ${routeSurface}`);
  }
  return destination;
}

export function resolveSiteConfigLayoutNav(
  config: SiteConfig,
  locale: SiteLocale = defaultLocale,
): { title: string; url: string } {
  return {
    title: config.brand.brandName,
    url: buildLocalizedRoute(
      requireSiteConfigRouteSurface(config, "home"),
      locale,
    ),
  };
}
