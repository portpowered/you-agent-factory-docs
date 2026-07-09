import { describe, expect, test } from "bun:test";
import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import {
  modelAtlasSiteConfig,
  YOU_AGENT_FACTORY_REPOSITORY_URL,
} from "./model-atlas-site-config";
import { resolveSiteConfigLayoutNav } from "./site-config-resolution";

describe("model atlas site config", () => {
  test("contains you-agent-factory scaffold brand values", () => {
    expect(modelAtlasSiteConfig.brand).toEqual({
      scaffoldId: SCAFFOLD_ID,
      brandName: SITE_BRAND_NAME,
      siteHeading: SITE_HEADING,
    });
    expect(modelAtlasSiteConfig.brand.scaffoldId).toBe(
      "you-agent-factory-scaffold",
    );
    expect(modelAtlasSiteConfig.brand.brandName).toBe("you-agent-factory");
    expect(modelAtlasSiteConfig.brand.siteHeading).toBe("you-agent-factory");
  });

  test("contains you-agent-factory repository URL", () => {
    expect(modelAtlasSiteConfig.repositoryUrl).toBe(
      YOU_AGENT_FACTORY_REPOSITORY_URL,
    );
    expect(modelAtlasSiteConfig.repositoryUrl).toBe(
      "https://github.com/portpowered/you-agent-factory",
    );
  });

  test("layout nav brand resolution returns you-agent-factory", () => {
    expect(resolveSiteConfigLayoutNav(modelAtlasSiteConfig).title).toBe(
      "you-agent-factory",
    );
  });

  test("orders primary nav for home, guides, docs, glossary, and blog", () => {
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).toEqual(["home", "guides", "docs", "glossary", "blogIndex"]);
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.labelKey),
    ).toEqual(["home", "guides", "docs", "glossary", "blog"]);
    expect(modelAtlasSiteConfig.routeSurfaces).toMatchObject({
      home: { surface: "home" },
      guides: { surface: "docs-page", slug: "guides" },
      docs: { surface: "browse" },
      glossary: { surface: "glossary-index" },
      blogIndex: { surface: "blog-index" },
      search: { surface: "search" },
    });
    expect(modelAtlasSiteConfig.routeSurfaces).not.toHaveProperty("topology");
    expect(modelAtlasSiteConfig.routeSurfaces).not.toHaveProperty("timeline");
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).not.toContain("topology");
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).not.toContain("timeline");
  });

  test("includes CLI collection family placeholders", () => {
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).toEqual(["guides", "concepts", "techniques", "documentation"]);
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("modules");
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("models");
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("papers");
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("training");
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("systems");
  });

  test("keeps home featured links as an empty transitional placeholder list", () => {
    expect(modelAtlasSiteConfig.homeFeaturedLinks).toEqual([]);
    expect(modelAtlasSiteConfig.homeFeaturedLinks).toHaveLength(0);
  });
});
