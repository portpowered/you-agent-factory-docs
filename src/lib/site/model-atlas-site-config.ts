import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import type { SiteConfig } from "./site-config.contract";

export const MODEL_ATLAS_REPOSITORY_URL =
  "https://github.com/portpowered/ai-model-reference" as const;

/**
 * Transitional default config still used by the current shell.
 * Later rewrite stories replace brand/nav/collections; the shared contract no
 * longer requires these Atlas topology/timeline/AI collection fields.
 */
export const modelAtlasSiteConfig = {
  brand: {
    scaffoldId: SCAFFOLD_ID,
    brandName: SITE_BRAND_NAME,
    siteHeading: SITE_HEADING,
  },
  repositoryUrl: MODEL_ATLAS_REPOSITORY_URL,
  routeSurfaces: {
    home: { surface: "home" },
    browse: { surface: "browse" },
    topology: { surface: "topology" },
    timeline: { surface: "docs-page", slug: "timeline" },
    blogIndex: { surface: "blog-index" },
    tagsIndex: { surface: "tags-index" },
  },
  primaryNav: [
    { routeSurface: "home", labelKey: "home" },
    { routeSurface: "topology", labelKey: "topology" },
    { routeSurface: "timeline", labelKey: "timeline" },
    { routeSurface: "blogIndex", labelKey: "blog" },
    { routeSurface: "tagsIndex", labelKey: "tags" },
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
