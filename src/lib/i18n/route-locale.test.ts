import { describe, expect, test } from "bun:test";
import {
  generateStaticLocaleParams,
  localizedRouteAlternates,
  localizedShippedDocsPageAlternates,
  localizeStaticParams,
  resolveRouteLocaleOrNotFound,
} from "./route-locale";

describe("route-locale", () => {
  test("generates static locale params for every non-default locale", () => {
    expect(generateStaticLocaleParams()).toEqual([
      { locale: "ja" },
      { locale: "zh-CN" },
      { locale: "vi" },
    ]);
  });

  test("localizes static params for every non-default locale", () => {
    expect(localizeStaticParams([{ slug: "attention" }])).toEqual([
      { slug: "attention", locale: "ja" },
      { slug: "attention", locale: "zh-CN" },
      { slug: "attention", locale: "vi" },
    ]);
  });

  test("publishes alternates for every supported locale", () => {
    expect(
      localizedRouteAlternates({
        surface: "docs-page",
        slug: "modules/grouped-query-attention",
      }),
    ).toEqual({
      canonical: "/docs/modules/grouped-query-attention",
      languages: {
        en: "/docs/modules/grouped-query-attention",
        ja: "/ja/docs/modules/grouped-query-attention",
        "zh-CN": "/zh-CN/docs/modules/grouped-query-attention",
        vi: "/vi/docs/modules/grouped-query-attention",
      },
    });
  });

  test("filters docs-page alternates to shipped locales only", () => {
    expect(localizedShippedDocsPageAlternates("references")).toEqual({
      canonical: "/docs/references",
      languages: {
        en: "/docs/references",
        ja: "/ja/docs/references",
        "zh-CN": "/zh-CN/docs/references",
        vi: "/vi/docs/references",
      },
    });
    expect(localizedShippedDocsPageAlternates("references/api")).toEqual({
      canonical: "/docs/references/api",
      languages: {
        en: "/docs/references/api",
        ja: "/ja/docs/references/api",
        "zh-CN": "/zh-CN/docs/references/api",
        vi: "/vi/docs/references/api",
      },
    });
    expect(localizedShippedDocsPageAlternates("references/cli")).toEqual({
      canonical: "/docs/references/cli",
      languages: {
        en: "/docs/references/cli",
      },
    });
  });

  test("remaps §10 migration old docs slugs to family target canonicals", () => {
    expect(localizedShippedDocsPageAlternates("documentation/api-doc")).toEqual(
      {
        canonical: "/docs/references/api",
        languages: {
          en: "/docs/references/api",
          ja: "/ja/docs/references/api",
          "zh-CN": "/zh-CN/docs/references/api",
          vi: "/vi/docs/references/api",
        },
      },
    );
    expect(
      localizedShippedDocsPageAlternates("documentation/cli-command-index"),
    ).toEqual({
      canonical: "/docs/references/cli",
      languages: {
        en: "/docs/references/cli",
      },
    });
  });

  test("publishes alternates for static browse routes", () => {
    expect(localizedRouteAlternates({ surface: "browse" })).toEqual({
      canonical: "/browse",
      languages: {
        en: "/browse",
        ja: "/ja/browse",
        "zh-CN": "/zh-CN/browse",
        vi: "/vi/browse",
      },
    });
  });

  test("keeps metadata alternates app-relative for home and blog surfaces", () => {
    // Production origin + project-site base path live on root metadataBase;
    // these hrefs must stay unprefixed so Next.js does not double-prefix.
    expect(localizedRouteAlternates({ surface: "home" })).toEqual({
      canonical: "/",
      languages: {
        en: "/",
        ja: "/ja",
        "zh-CN": "/zh-CN",
        vi: "/vi",
      },
    });
    expect(localizedRouteAlternates({ surface: "blog-index" })).toEqual({
      canonical: "/blog",
      languages: {
        en: "/blog",
        ja: "/ja/blog",
        "zh-CN": "/zh-CN/blog",
        vi: "/vi/blog",
      },
    });
  });

  test("accepts japanese and chinese route locales", () => {
    expect(resolveRouteLocaleOrNotFound("ja")).toBe("ja");
    expect(resolveRouteLocaleOrNotFound("zh-CN")).toBe("zh-CN");
  });
});
