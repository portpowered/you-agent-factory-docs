import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import {
  SITE_COLLECTION_FAMILIES,
  type SiteConfig,
} from "./site-config.contract";

/** Default product repository URL for the you-agent-factory shell. */
export const YOU_AGENT_FACTORY_REPOSITORY_URL =
  "https://github.com/portpowered/you-agent-factory" as const;

/** @deprecated Prefer YOU_AGENT_FACTORY_REPOSITORY_URL; kept for transitional imports. */
export const MODEL_ATLAS_REPOSITORY_URL = YOU_AGENT_FACTORY_REPOSITORY_URL;

/**
 * Transitional default config still used by the current shell.
 * Brand/repo, primary nav/route placeholders, collections, and home featured
 * links are you-agent-factory CLI docs shaped. Home featured links stay an
 * empty placeholder list so B01 can author final marketing copy.
 * Search is a configured route surface (header trigger) but not a primary
 * nav item, to avoid duplicating the header search control.
 */
export const modelAtlasSiteConfig = {
  brand: {
    scaffoldId: SCAFFOLD_ID,
    brandName: SITE_BRAND_NAME,
    siteHeading: SITE_HEADING,
  },
  repositoryUrl: YOU_AGENT_FACTORY_REPOSITORY_URL,
  routeSurfaces: {
    home: { surface: "home" },
    guides: { surface: "docs-page", slug: "guides" },
    docs: { surface: "browse" },
    glossary: { surface: "glossary-index" },
    blogIndex: { surface: "blog-index" },
    search: { surface: "search" },
  },
  primaryNav: [
    { routeSurface: "home", labelKey: "home" },
    { routeSurface: "guides", labelKey: "guides" },
    { routeSurface: "docs", labelKey: "docs" },
    { routeSurface: "glossary", labelKey: "glossary" },
    { routeSurface: "blogIndex", labelKey: "blog" },
  ],
  collections: SITE_COLLECTION_FAMILIES.map((family) => ({ family })),
  /** Empty until B01 authors final home marketing featured links. */
  homeFeaturedLinks: [] as SiteConfig["homeFeaturedLinks"],
} as const satisfies SiteConfig;
