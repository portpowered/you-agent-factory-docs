import { describe, expect, test } from "bun:test";
import { isDocsPageShippedForLocale } from "@/lib/content/pages";
import type { SiteConfig } from "./site-config.contract";
import { resolveSiteConfigHomeFeaturedLinkHrefs } from "./site-config-resolution";
import { youAgentFactorySiteConfig } from "./you-agent-factory-site-config";

/** Fixture with docs-page featured links for locale-fallback resolution coverage. */
const featuredLinkLocaleFallbackConfig = {
  ...youAgentFactorySiteConfig,
  homeFeaturedLinks: [
    {
      kind: "docs-page" as const,
      slug: "modules/grouped-query-attention",
      titleKey: "gqaLinkTitle" as const,
      descriptionKey: "gqaLinkDescription" as const,
    },
    {
      kind: "docs-page" as const,
      slug: "modules/swiglu",
      titleKey: "swigluLinkTitle" as const,
      descriptionKey: "swigluLinkDescription" as const,
    },
    {
      kind: "docs-page" as const,
      slug: "modules/relu",
      titleKey: "reluLinkTitle" as const,
      descriptionKey: "reluLinkDescription" as const,
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

  test("preserves localized shipped module hrefs on vietnamese home for docs-page links", () => {
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(
        featuredLinkLocaleFallbackConfig,
        "vi",
      ),
    ).toEqual([
      "/vi/docs/modules/grouped-query-attention",
      "/docs/modules/swiglu",
      "/docs/modules/relu",
    ]);
  });

  test("preserves localized shipped module hrefs on japanese home for docs-page links", () => {
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(
        featuredLinkLocaleFallbackConfig,
        "ja",
      ),
    ).toEqual([
      "/ja/docs/modules/grouped-query-attention",
      "/docs/modules/swiglu",
      "/docs/modules/relu",
    ]);
  });

  test("falls back to canonical docs hrefs on chinese home when zh-CN is unshipped", () => {
    expect(
      resolveSiteConfigHomeFeaturedLinkHrefs(modelAtlasSiteConfig, "zh-CN"),
    ).toEqual([
      "/zh-CN/browse",
      "/docs/modules/grouped-query-attention",
      "/docs/modules/swiglu",
      "/docs/modules/relu",
    ]);
  });
});
