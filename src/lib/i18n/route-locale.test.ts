import { describe, expect, test } from "bun:test";
import {
  generateStaticLocaleParams,
  localizedRouteAlternates,
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

  test("accepts japanese and chinese route locales", () => {
    expect(resolveRouteLocaleOrNotFound("ja")).toBe("ja");
    expect(resolveRouteLocaleOrNotFound("zh-CN")).toBe("zh-CN");
  });
});
