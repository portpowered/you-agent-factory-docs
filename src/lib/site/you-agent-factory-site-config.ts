import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import {
  SITE_COLLECTION_FAMILIES,
  type SiteConfig,
} from "./site-config.contract";

/** Default product repository URL for the you-agent-factory shell. */
export const YOU_AGENT_FACTORY_REPOSITORY_URL =
  "https://github.com/portpowered/you-agent-factory" as const;

/**
 * Default site config for the you-agent-factory CLI docs product.
 * Brand/repo, primary nav/route placeholders, collections, and home featured
 * links are CLI docs shaped. Home featured links point at guides, docs/browse,
 * glossary, and blog route surfaces (not Atlas module pages).
 * Search is a configured route surface (header trigger) but not a primary
 * nav item, to avoid duplicating the header search control.
 */
export const youAgentFactorySiteConfig = {
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
    // W15 family destinations: available for nav/discovery wiring; primaryNav
    // membership is owned by the desktop/mobile primary-nav story.
    references: { surface: "docs-page", slug: "references" },
    factories: { surface: "docs-page", slug: "factories" },
    workers: { surface: "docs-page", slug: "workers" },
    workstations: { surface: "docs-page", slug: "workstations" },
  },
  primaryNav: [
    { routeSurface: "home", labelKey: "home" },
    { routeSurface: "guides", labelKey: "guides" },
    { routeSurface: "docs", labelKey: "docs" },
    { routeSurface: "glossary", labelKey: "glossary" },
    { routeSurface: "blogIndex", labelKey: "blog" },
  ],
  collections: SITE_COLLECTION_FAMILIES.map((family) => ({ family })),
  homeFeaturedLinks: [
    {
      kind: "route",
      routeSurface: "guides",
      titleKey: "guidesLinkTitle",
      descriptionKey: "guidesLinkDescription",
    },
    {
      kind: "route",
      routeSurface: "docs",
      titleKey: "docsLinkTitle",
      descriptionKey: "docsLinkDescription",
    },
    {
      kind: "route",
      routeSurface: "glossary",
      titleKey: "glossaryLinkTitle",
      descriptionKey: "glossaryLinkDescription",
    },
    {
      kind: "route",
      routeSurface: "blogIndex",
      titleKey: "blogLinkTitle",
      descriptionKey: "blogLinkDescription",
    },
  ] as SiteConfig["homeFeaturedLinks"],
} as const satisfies SiteConfig;
