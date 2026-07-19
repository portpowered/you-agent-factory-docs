import { DOCS_CHROME_HEADER_TEXT_CLASSES } from "@/features/docs/styles/docs-chrome-header-breadcrumb";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import type { SiteConfig } from "@/lib/site/site-config.contract";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
import { cn } from "@/lib/utils";

/** Desktop primary-nav text links: white rest, primary-yellow hover (chrome map). */
export const PRIMARY_NAV_LINK_CLASS = DOCS_CHROME_HEADER_TEXT_CLASSES;

export const PRIMARY_NAV_DESKTOP_CLASS = "hidden md:flex";

export const PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS = cn("md:hidden");

export const PRIMARY_NAV_MOBILE_PANEL_CLASS =
  "order-last w-full basis-full border-t border-border py-3 md:hidden";

export const PRIMARY_NAV_MOBILE_LINK_CLASS =
  "flex min-w-0 rounded-lg border border-sidebar-border px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type PrimaryNavItem = {
  href: string;
  label: string;
};

export type GetPrimaryNavItemsOptions = {
  siteConfig?: SiteConfig;
};

/**
 * CLI docs primary destinations from site config (Blog, Docs, Guides,
 * References). Home is the brand/logo destination, not a text nav chip.
 * Does not accept Atlas topology options — those surfaces are not primary
 * nav items for the you-agent-factory shell.
 */
export function getPrimaryNavItems(
  messages: UiMessages,
  locale: SiteLocale = defaultLocale,
  options: GetPrimaryNavItemsOptions = {},
): PrimaryNavItem[] {
  // Widen the transitional const default to SiteConfig so open route-surface
  // lookups stay typed as Record<string, ...> rather than a closed const map.
  const siteConfig: SiteConfig =
    options.siteConfig ?? youAgentFactorySiteConfig;

  return siteConfig.primaryNav.map((entry) => {
    const destination = siteConfig.routeSurfaces[entry.routeSurface];
    if (!destination) {
      throw new Error(
        `Missing site config route surface: ${entry.routeSurface}`,
      );
    }

    return {
      href: buildLocalizedRoute(destination, locale),
      label: messages.nav[entry.labelKey],
    };
  });
}
