import type { UiMessages } from "@/lib/content/ui-messages.types";
import type { LocalizedRouteDestination } from "@/lib/i18n/locale-routing";

/**
 * Documented CLI docs named route surface placeholders.
 * SiteConfig.routeSurfaces is an open map — these ids are not a mandatory closed set,
 * and topology/timeline are not required contract surfaces.
 */
export const SITE_NAMED_ROUTE_SURFACES = [
  "home",
  "guides",
  "docs",
  "glossary",
  "blogIndex",
  "search",
  "references",
  "factories",
  "workers",
  "workstations",
] as const;

export type SiteNamedRouteSurface = (typeof SITE_NAMED_ROUTE_SURFACES)[number];

/** UI message keys for primary navigation labels under `messages.nav`. */
export type PrimaryNavLabelKey = keyof UiMessages["nav"];

/**
 * Documented CLI collection family placeholders.
 * SiteConfig.collections accepts these (and other string family ids);
 * Atlas AI families are not required by the contract.
 */
export const SITE_COLLECTION_FAMILIES = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
] as const;

export type SiteCollectionFamily = (typeof SITE_COLLECTION_FAMILIES)[number];

export type SiteBrandConfig = {
  /** Stable scaffold identifier used by health checks and smoke tests. */
  scaffoldId: string;
  /** Brand label rendered on shared shell surfaces. */
  brandName: string;
  /** Primary home page heading. */
  siteHeading: string;
};

/** Open route-surface map keyed by product-specific surface ids. */
export type SiteRouteSurfaces = Record<string, LocalizedRouteDestination>;

export type SitePrimaryNavEntry = {
  routeSurface: string;
  labelKey: PrimaryNavLabelKey;
};

export type SiteCollectionPlaceholder = {
  family: string;
};

/** UI message keys for home featured link titles under `messages.home`. */
export type HomeFeaturedLinkTitleKey = keyof UiMessages["home"];

/** UI message keys for home featured link descriptions under `messages.home`. */
export type HomeFeaturedLinkDescriptionKey = keyof UiMessages["home"];

type HomeFeaturedLinkCopyBinding = {
  titleKey: HomeFeaturedLinkTitleKey;
  descriptionKey: HomeFeaturedLinkDescriptionKey;
};

export type HomeFeaturedLinkPlaceholder =
  | ({
      kind: "route";
      routeSurface: string;
    } & HomeFeaturedLinkCopyBinding)
  | ({ kind: "docs-page"; slug: string } & HomeFeaturedLinkCopyBinding);

export type SiteConfig = {
  brand: SiteBrandConfig;
  repositoryUrl: string;
  routeSurfaces: SiteRouteSurfaces;
  primaryNav: readonly SitePrimaryNavEntry[];
  collections: readonly SiteCollectionPlaceholder[];
  homeFeaturedLinks: readonly HomeFeaturedLinkPlaceholder[];
};
