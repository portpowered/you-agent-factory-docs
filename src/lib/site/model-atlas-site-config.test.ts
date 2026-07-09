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

  test("orders primary nav for home, topology, timeline, blog, and tags", () => {
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).toEqual(["home", "topology", "timeline", "blogIndex", "tagsIndex"]);
    expect(
      modelAtlasSiteConfig.primaryNav.map((entry) => entry.labelKey),
    ).toEqual(["home", "topology", "timeline", "blog", "tags"]);
  });

  test("includes transitional Model Atlas collection family placeholders", () => {
    expect(
      modelAtlasSiteConfig.collections.map((entry) => entry.family),
    ).toEqual([
      "glossary",
      "concepts",
      "modules",
      "models",
      "papers",
      "training",
      "systems",
    ]);
  });

  test("includes current home featured link placeholders", () => {
    expect(modelAtlasSiteConfig.homeFeaturedLinks).toEqual([
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
    ]);
  });
});
