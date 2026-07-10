import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  generateStaticLocaleParams,
  localizedRouteAlternates,
  localizeStaticParams,
  resolveRouteLocaleOrNotFound,
} from "./route-locale";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;
const ROOT_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: "",
} as const;

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

  test("keeps metadata alternates unprefixed for root export builds", () => {
    expect(
      localizedRouteAlternates({ surface: "home" }, ROOT_EXPORT_ENV),
    ).toEqual({
      canonical: "/",
      languages: {
        en: "/",
        ja: "/ja",
        "zh-CN": "/zh-CN",
        vi: "/vi",
      },
    });
  });

  test("prefixes metadata alternates for project-site export builds", () => {
    expect(
      localizedRouteAlternates({ surface: "home" }, PROJECT_SITE_EXPORT_ENV),
    ).toEqual({
      canonical: `${PROJECT_SITE_BASE_PATH}/`,
      languages: {
        en: `${PROJECT_SITE_BASE_PATH}/`,
        ja: `${PROJECT_SITE_BASE_PATH}/ja`,
        "zh-CN": `${PROJECT_SITE_BASE_PATH}/zh-CN`,
        vi: `${PROJECT_SITE_BASE_PATH}/vi`,
      },
    });
    expect(
      localizedRouteAlternates(
        { surface: "blog-index" },
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toEqual({
      canonical: `${PROJECT_SITE_BASE_PATH}/blog`,
      languages: {
        en: `${PROJECT_SITE_BASE_PATH}/blog`,
        ja: `${PROJECT_SITE_BASE_PATH}/ja/blog`,
        "zh-CN": `${PROJECT_SITE_BASE_PATH}/zh-CN/blog`,
        vi: `${PROJECT_SITE_BASE_PATH}/vi/blog`,
      },
    });
  });

  test("accepts japanese and chinese route locales", () => {
    expect(resolveRouteLocaleOrNotFound("ja")).toBe("ja");
    expect(resolveRouteLocaleOrNotFound("zh-CN")).toBe("zh-CN");
  });
});
