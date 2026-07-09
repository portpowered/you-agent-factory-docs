import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import type { SiteConfig } from "./site-config.contract";

/** Default product repository URL for the you-agent-factory shell. */
export const YOU_AGENT_FACTORY_REPOSITORY_URL =
  "https://github.com/portpowered/you-agent-factory" as const;

/** @deprecated Prefer YOU_AGENT_FACTORY_REPOSITORY_URL; kept for transitional imports. */
export const MODEL_ATLAS_REPOSITORY_URL = YOU_AGENT_FACTORY_REPOSITORY_URL;

/**
 * Transitional default config still used by the current shell.
 * Brand/repo and primary nav/route placeholders are you-agent-factory CLI
 * docs shaped; later rewrite stories replace collections/featured links.
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
    /** Kept for transitional home featured links until story 004. */
    browse: { surface: "browse" },
  },
  primaryNav: [
    { routeSurface: "home", labelKey: "home" },
    { routeSurface: "guides", labelKey: "guides" },
    { routeSurface: "docs", labelKey: "docs" },
    { routeSurface: "glossary", labelKey: "glossary" },
    { routeSurface: "blogIndex", labelKey: "blog" },
  ],
  collections: [
    { family: "glossary" },
    { family: "concepts" },
    { family: "modules" },
    { family: "models" },
    { family: "papers" },
    { family: "training" },
    { family: "systems" },
  ],
  homeFeaturedLinks: [
    {
      kind: "route",
      routeSurface: "browse",
      titleKey: "atlasLinkTitle",
      descriptionKey: "atlasLinkDescription",
    },
    {
      kind: "docs-page",
      slug: "modules/grouped-query-attention",
      titleKey: "gqaLinkTitle",
      descriptionKey: "gqaLinkDescription",
    },
    {
      kind: "docs-page",
      slug: "modules/swiglu",
      titleKey: "swigluLinkTitle",
      descriptionKey: "swigluLinkDescription",
    },
    {
      kind: "docs-page",
      slug: "modules/relu",
      titleKey: "reluLinkTitle",
      descriptionKey: "reluLinkDescription",
    },
  ],
} as const satisfies SiteConfig;
