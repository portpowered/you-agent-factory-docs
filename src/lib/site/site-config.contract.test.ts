import { describe, expect, test } from "bun:test";
import {
  SITE_COLLECTION_FAMILIES,
  SITE_NAMED_ROUTE_SURFACES,
  type SiteConfig,
} from "./site-config.contract";

/** Representative CLI docs SiteConfig — no Atlas topology/timeline/collection requirements. */
const cliDocsSiteConfig = {
  brand: {
    scaffoldId: "you-agent-factory-scaffold",
    brandName: "you-agent-factory",
    siteHeading: "you-agent-factory",
  },
  repositoryUrl: "https://github.com/portpowered/you-agent-factory",
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
    { routeSurface: "guides", labelKey: "glossary" },
    { routeSurface: "docs", labelKey: "architecture" },
    { routeSurface: "glossary", labelKey: "glossary" },
    { routeSurface: "blogIndex", labelKey: "blog" },
    { routeSurface: "search", labelKey: "search" },
  ],
  collections: SITE_COLLECTION_FAMILIES.map((family) => ({ family })),
  homeFeaturedLinks: [
    {
      kind: "route",
      routeSurface: "guides",
      titleKey: "browseSectionTitle",
      descriptionKey: "intro",
    },
    {
      kind: "docs-page",
      slug: "guides/getting-started",
      titleKey: "title",
      descriptionKey: "subtitle",
    },
  ],
} satisfies SiteConfig;

describe("site config contract", () => {
  test("documents CLI named route surface placeholders without topology or timeline", () => {
    expect(SITE_NAMED_ROUTE_SURFACES).toEqual([
      "home",
      "guides",
      "docs",
      "glossary",
      "blogIndex",
      "search",
    ]);
    expect(SITE_NAMED_ROUTE_SURFACES).not.toContain("topology");
    expect(SITE_NAMED_ROUTE_SURFACES).not.toContain("timeline");
  });

  test("documents CLI collection family placeholders without Atlas AI families", () => {
    expect(SITE_COLLECTION_FAMILIES).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
    ]);
    expect(SITE_COLLECTION_FAMILIES).not.toContain("modules");
    expect(SITE_COLLECTION_FAMILIES).not.toContain("models");
    expect(SITE_COLLECTION_FAMILIES).not.toContain("papers");
    expect(SITE_COLLECTION_FAMILIES).not.toContain("training");
    expect(SITE_COLLECTION_FAMILIES).not.toContain("systems");
  });

  test("accepts a CLI placeholder config without Atlas topology, timeline, or AI collections", () => {
    expect(cliDocsSiteConfig.routeSurfaces).not.toHaveProperty("topology");
    expect(cliDocsSiteConfig.routeSurfaces).not.toHaveProperty("timeline");
    expect(
      cliDocsSiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).toEqual(["home", "guides", "docs", "glossary", "blogIndex", "search"]);
    expect(
      cliDocsSiteConfig.primaryNav.every(
        (entry) =>
          entry.labelKey !== "topology" && entry.labelKey !== "timeline",
      ),
    ).toBe(true);
    expect(cliDocsSiteConfig.collections.map((entry) => entry.family)).toEqual([
      ...SITE_COLLECTION_FAMILIES,
    ]);
    expect(
      cliDocsSiteConfig.homeFeaturedLinks.every((link) => {
        if (link.kind === "docs-page") {
          return !link.slug.startsWith("modules/");
        }
        return (
          link.titleKey !== "atlasLinkTitle" &&
          link.titleKey !== "gqaLinkTitle" &&
          link.titleKey !== "swigluLinkTitle" &&
          link.titleKey !== "reluLinkTitle"
        );
      }),
    ).toBe(true);
  });
});
