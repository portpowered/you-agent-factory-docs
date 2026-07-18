import { describe, expect, test } from "bun:test";
import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import { resolveSiteConfigLayoutNav } from "./site-config-resolution";
import {
  YOU_AGENT_FACTORY_REPOSITORY_URL,
  youAgentFactorySiteConfig,
} from "./you-agent-factory-site-config";

describe("you-agent-factory site config", () => {
  test("contains You Agent Factory display brand values", () => {
    expect(youAgentFactorySiteConfig.brand).toEqual({
      scaffoldId: SCAFFOLD_ID,
      brandName: SITE_BRAND_NAME,
      siteHeading: SITE_HEADING,
    });
    expect(youAgentFactorySiteConfig.brand.scaffoldId).toBe(
      "you-agent-factory-scaffold",
    );
    expect(youAgentFactorySiteConfig.brand.brandName).toBe("You Agent Factory");
    expect(youAgentFactorySiteConfig.brand.siteHeading).toBe(
      "You Agent Factory",
    );
  });

  test("contains you-agent-factory repository URL", () => {
    expect(youAgentFactorySiteConfig.repositoryUrl).toBe(
      YOU_AGENT_FACTORY_REPOSITORY_URL,
    );
    expect(youAgentFactorySiteConfig.repositoryUrl).toBe(
      "https://github.com/portpowered/you-agent-factory",
    );
  });

  test("layout nav brand resolution returns You Agent Factory", () => {
    expect(resolveSiteConfigLayoutNav(youAgentFactorySiteConfig).title).toBe(
      "You Agent Factory",
    );
  });

  test("orders primary nav for home, guides, docs, W15 families, glossary, and blog", () => {
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).toEqual([
      "home",
      "guides",
      "docs",
      "references",
      "factories",
      "workers",
      "workstations",
      "glossary",
      "blogIndex",
    ]);
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.labelKey),
    ).toEqual([
      "home",
      "guides",
      "docs",
      "references",
      "factories",
      "workers",
      "workstations",
      "glossary",
      "blog",
    ]);
    expect(youAgentFactorySiteConfig.routeSurfaces).toMatchObject({
      home: { surface: "home" },
      guides: { surface: "docs-page", slug: "guides" },
      docs: { surface: "browse" },
      references: { surface: "docs-page", slug: "references" },
      factories: { surface: "docs-page", slug: "factories" },
      workers: { surface: "docs-page", slug: "workers" },
      workstations: { surface: "docs-page", slug: "workstations" },
      glossary: { surface: "glossary-index" },
      blogIndex: { surface: "blog-index" },
      search: { surface: "search" },
    });
    expect(youAgentFactorySiteConfig.routeSurfaces).not.toHaveProperty(
      "topology",
    );
    expect(youAgentFactorySiteConfig.routeSurfaces).not.toHaveProperty(
      "timeline",
    );
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).not.toContain("topology");
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).not.toContain("timeline");
  });

  test("includes CLI collection family placeholders", () => {
    expect(
      youAgentFactorySiteConfig.collections.map((entry) => entry.family),
    ).toEqual(["guides", "concepts", "techniques", "documentation"]);
    expect(
      youAgentFactorySiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("modules");
    expect(
      youAgentFactorySiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("models");
    expect(
      youAgentFactorySiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("papers");
    expect(
      youAgentFactorySiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("training");
    expect(
      youAgentFactorySiteConfig.collections.map((entry) => entry.family),
    ).not.toContain("systems");
  });

  test("lists CLI docs destinations for home featured links", () => {
    expect(
      youAgentFactorySiteConfig.homeFeaturedLinks.map((link) =>
        link.kind === "route" ? link.routeSurface : link.slug,
      ),
    ).toEqual(["guides", "docs", "glossary", "blogIndex"]);
    expect(
      youAgentFactorySiteConfig.homeFeaturedLinks.every(
        (link) =>
          link.kind === "route" &&
          ![
            "atlasLinkTitle",
            "gqaLinkTitle",
            "swigluLinkTitle",
            "reluLinkTitle",
          ].includes(link.titleKey),
      ),
    ).toBe(true);
    expect(youAgentFactorySiteConfig.homeFeaturedLinks).toHaveLength(4);
  });
});
