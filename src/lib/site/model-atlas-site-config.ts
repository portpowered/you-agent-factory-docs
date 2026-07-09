import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import {
  SITE_COLLECTION_FAMILIES,
  type SiteConfig,
} from "./site-config.contract";

export const MODEL_ATLAS_REPOSITORY_URL =
  "https://github.com/portpowered/ai-model-reference" as const;

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
    { routeSurface: "blogIndex", labelKey: "blog" },
    { routeSurface: "tagsIndex", labelKey: "tags" },
  ],
  collections: SITE_COLLECTION_FAMILIES.map((family) => ({ family })),
  homeFeaturedLinks: [
    {
      kind: "route",
      routeSurface: "browse",
      titleKey: "atlasLinkTitle",
      descriptionKey: "atlasLinkDescription",
    },
  ],
} as const satisfies SiteConfig;
