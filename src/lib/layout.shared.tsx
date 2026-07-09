import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import type { SiteConfig } from "@/lib/site/site-config.contract";
import { resolveSiteConfigLayoutNav } from "@/lib/site/site-config-layout-nav";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";

export function baseOptions(
  locale: SiteLocale = defaultLocale,
  siteConfig: SiteConfig = youAgentFactorySiteConfig,
): BaseLayoutProps {
  return {
    nav: resolveSiteConfigLayoutNav(siteConfig, locale),
    searchToggle: {
      enabled: false,
    },
  };
}
