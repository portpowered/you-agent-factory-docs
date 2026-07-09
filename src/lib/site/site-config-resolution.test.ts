import { describe, expect, test } from "bun:test";
import { isDocsPageShippedForLocale } from "@/lib/content/pages";
import type { SiteConfig } from "./site-config.contract";
import { resolveSiteConfigHomeFeaturedLinkHrefs } from "./site-config-resolution";
import { youAgentFactorySiteConfig } from "./you-agent-factory-site-config";

/**
 * Fixture with docs-page featured links for locale-fallback resolution coverage.
 * Uses getting-started (still present after Atlas deletion) rather than deleted
 * Atlas module slugs.
 */
const featuredLinkLocaleFallbackConfig = {
  ...youAgentFactorySiteConfig,
  homeFeaturedLinks: [
    {
      kind: "route" as const,
      routeSurface: "docs",
      titleKey: "browseSectionTitle" as const,
      descriptionKey: "intro" as const,
    },
    {
      kind: "docs-page" as const,
      slug: "getting-started",
      titleKey: "title" as const,
      descriptionKey: "subtitle" as const,
    },
  ],
} satisfies SiteConfig;

describe("site config home featured link resolution", () => {
  test("default config resolves an empty featured-link href list", () => {
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(youAgentFactorySiteConfig, "en"),
    ).toEqual([]);
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(youAgentFactorySiteConfig, "vi"),
    ).toEqual([]);
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(youAgentFactorySiteConfig, "ja"),
    ).toEqual([]);
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(
        youAgentFactorySiteConfig,
        "zh-CN",
      ),
    ).toEqual([]);
  });

  test("uses shipped-docs locale fallback for docs-page featured links", () => {
    const docsLinks = featuredLinkLocaleFallbackConfig.homeFeaturedLinks.filter(
      (link) => link.kind === "docs-page",
    );

    for (const locale of ["vi", "ja", "zh-CN"] as const) {
      for (const link of docsLinks) {
        const expectedLocale = isDocsPageShippedForLocale(link.slug, locale)
          ? locale
          : "en";

        const href = resolveSiteConfigHomeFeaturedLinkHrefs(
          featuredLinkLocaleFallbackConfig,
          locale,
        )[featuredLinkLocaleFallbackConfig.homeFeaturedLinks.indexOf(link)];

        if (expectedLocale === locale) {
          expect(href).toContain(`/${locale}/`);
        } else {
          expect(href).toMatch(/^\/docs\//);
          expect(href).not.toContain(`/${locale}/`);
        }
      }
    }
  });

  test("resolves browse route and unshipped docs-page fallbacks for localized homes", () => {
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(
        featuredLinkLocaleFallbackConfig,
        "vi",
      ),
    ).toEqual(["/vi/browse", "/docs/getting-started"]);
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(
        featuredLinkLocaleFallbackConfig,
        "ja",
      ),
    ).toEqual(["/ja/browse", "/docs/getting-started"]);
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(
        featuredLinkLocaleFallbackConfig,
        "zh-CN",
      ),
    ).toEqual(["/zh-CN/browse", "/docs/getting-started"]);
  });
});
