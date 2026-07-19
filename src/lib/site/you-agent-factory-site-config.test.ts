import { describe, expect, test } from "bun:test";
import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import { resolveSiteConfigLayoutNav } from "./site-config-resolution";
import {
  YOU_AGENT_FACTORY_REPOSITORY_URL,
  youAgentFactorySiteConfig,
} from "./you-agent-factory-site-config";

describe("you-agent-factory site config", () => {
  test("contains YOU header chrome mark and full product home heading", () => {
    expect(youAgentFactorySiteConfig.brand).toEqual({
      scaffoldId: SCAFFOLD_ID,
      brandName: SITE_BRAND_NAME,
      siteHeading: SITE_HEADING,
    });
    expect(youAgentFactorySiteConfig.brand.scaffoldId).toBe(
      "you-agent-factory-scaffold",
    );
    expect(youAgentFactorySiteConfig.brand.brandName).toBe("YOU");
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

  test("layout nav brand resolution returns YOU", () => {
    expect(resolveSiteConfigLayoutNav(youAgentFactorySiteConfig).title).toBe(
      "YOU",
    );
  });

  test("orders primary nav for Blog, Docs, Guides, and References only", () => {
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).toEqual(["blogIndex", "docs", "guides", "references"]);
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.labelKey),
    ).toEqual(["blog", "docs", "guides", "references"]);
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
    const primarySurfaces = youAgentFactorySiteConfig.primaryNav.map(
      (entry) => entry.routeSurface,
    );
    expect(primarySurfaces).not.toContain("home");
    expect(primarySurfaces).not.toContain("factories");
    expect(primarySurfaces).not.toContain("workers");
    expect(primarySurfaces).not.toContain("workstations");
    expect(primarySurfaces).not.toContain("glossary");
    expect(primarySurfaces).not.toContain("topology");
    expect(primarySurfaces).not.toContain("timeline");
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
    ).toEqual(["guides", "docs", "blogIndex"]);
    expect(
      youAgentFactorySiteConfig.homeFeaturedLinks.every(
        (link) =>
          link.kind === "route" &&
          ![
            "atlasLinkTitle",
            "gqaLinkTitle",
            "swigluLinkTitle",
            "reluLinkTitle",
            "glossaryLinkTitle",
          ].includes(link.titleKey),
      ),
    ).toBe(true);
    expect(youAgentFactorySiteConfig.homeFeaturedLinks).toHaveLength(3);
    expect(
      youAgentFactorySiteConfig.homeFeaturedLinks.some(
        (link) => link.kind === "route" && link.routeSurface === "glossary",
      ),
    ).toBe(false);
  });
});
