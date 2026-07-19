import { describe, expect, test } from "bun:test";
import { baseOptions } from "@/lib/layout.shared";
import type { SiteConfig } from "@/lib/site/site-config.contract";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";

const alternateSiteConfig = {
  brand: {
    scaffoldId: "example-scaffold",
    brandName: "Example Atlas",
    siteHeading: "Example Reference",
  },
  repositoryUrl: "https://github.com/example/example",
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
      titleKey: "docsLinkTitle",
      descriptionKey: "docsLinkDescription",
    },
    {
      kind: "route",
      routeSurface: "home",
      titleKey: "guidesLinkTitle",
      descriptionKey: "guidesLinkDescription",
    },
    {
      kind: "route",
      routeSurface: "blogIndex",
      titleKey: "blogLinkTitle",
      descriptionKey: "blogLinkDescription",
    },
    {
      kind: "route",
      routeSurface: "tagsIndex",
      titleKey: "title",
      descriptionKey: "intro",
    },
  ],
} satisfies SiteConfig;

describe("baseOptions", () => {
  test("sources the layout nav title from site config brand name", () => {
    expect(baseOptions().nav?.title).toBe(
      youAgentFactorySiteConfig.brand.brandName,
    );
    expect(baseOptions("en", alternateSiteConfig).nav?.title).toBe(
      "Example Atlas",
    );
  });

  test("resolves the default locale home route through site config", () => {
    expect(baseOptions("en").nav?.url).toBe("/");
  });

  test("preserves localized home route prefixes from site config", () => {
    expect(baseOptions("vi").nav?.url).toBe("/vi");
    expect(baseOptions("ja").nav?.url).toBe("/ja");
  });

  test("keeps search toggle disabled", () => {
    expect(baseOptions().searchToggle).toEqual({ enabled: false });
  });
});
