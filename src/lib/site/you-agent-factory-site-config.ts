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
 * and blog route surfaces (not glossary or Atlas module pages).
 * Header primary nav is Blog / Docs / Guides / References only; Home is the
 * brand/logo destination, not a text nav chip. Search is a configured route
 * surface (header trigger) but not a primary nav item, to avoid duplicating
 * the header search control. Family destinations (factories / workers /
 * workstations) remain as route surfaces for page routes but are not
 * primary-nav text items or home featured destinations. The glossary index
 * route surface is retired (no `/docs/glossary` index destination).
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
    blogIndex: { surface: "blog-index" },
    search: { surface: "search" },
    // Family destinations remain as route surfaces for page routes; only
    // references stays in header primary nav with Blog / Docs / Guides.
    references: { surface: "docs-page", slug: "references" },
    factories: { surface: "docs-page", slug: "factories" },
    workers: { surface: "docs-page", slug: "workers" },
    workstations: { surface: "docs-page", slug: "workstations" },
  },
  primaryNav: [
    { routeSurface: "blogIndex", labelKey: "blog" },
    { routeSurface: "docs", labelKey: "docs" },
    { routeSurface: "guides", labelKey: "guides" },
    { routeSurface: "references", labelKey: "references" },
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
      routeSurface: "blogIndex",
      titleKey: "blogLinkTitle",
      descriptionKey: "blogLinkDescription",
    },
  ] as SiteConfig["homeFeaturedLinks"],
} as const satisfies SiteConfig;
