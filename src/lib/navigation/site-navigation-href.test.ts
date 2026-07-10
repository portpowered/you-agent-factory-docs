import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  resolveLocaleSwitchedSiteHref,
  resolveLocalizedSiteHref,
  resolveSiteNavigationHrefs,
} from "@/lib/navigation/site-navigation-href";
import {
  stripBasePathFromHref,
  withBasePath,
} from "@/lib/navigation/site-path";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;

describe("site navigation href consumers", () => {
  test("root builds keep unprefixed home, docs, and blog hrefs", () => {
    expect(resolveLocalizedSiteHref({ surface: "home" }, "en", "")).toBe("/");
    expect(
      resolveLocalizedSiteHref(
        { surface: "docs-page", slug: "guides" },
        "en",
        "",
      ),
    ).toBe("/docs/guides");
    expect(resolveLocalizedSiteHref({ surface: "blog-index" }, "en", "")).toBe(
      "/blog",
    );
  });

  test("project-site builds prefix home, docs, and blog under the live base path", () => {
    expect(
      resolveLocalizedSiteHref(
        { surface: "home" },
        "en",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/");
    expect(
      resolveLocalizedSiteHref(
        { surface: "docs-page", slug: "guides" },
        "en",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/docs/guides");
    expect(
      resolveLocalizedSiteHref(
        { surface: "blog-index" },
        "en",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/blog");
  });

  test("locale-prefixed routes stay under the project-site base path", () => {
    expect(
      resolveLocalizedSiteHref(
        { surface: "home" },
        "vi",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/vi");
    expect(
      resolveLocalizedSiteHref(
        { surface: "docs-page", slug: "guides" },
        "ja",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/ja/docs/guides");
    expect(
      resolveLocalizedSiteHref(
        { surface: "blog-index" },
        "zh-CN",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/zh-CN/blog");
    expect(
      resolveLocaleSwitchedSiteHref(
        "/docs/guides",
        "vi",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/vi/docs/guides");
  });

  test("root builds keep locale routes unprefixed", () => {
    expect(resolveLocalizedSiteHref({ surface: "home" }, "vi", "")).toBe("/vi");
    expect(resolveLocaleSwitchedSiteHref("/blog", "ja", "")).toBe("/ja/blog");
  });

  test("resolveSiteNavigationHrefs prefixes representative primary destinations", () => {
    const rootHrefs = ["/", "/docs/guides", "/blog"] as const;
    expect(resolveSiteNavigationHrefs(rootHrefs, "")).toEqual([
      "/",
      "/docs/guides",
      "/blog",
    ]);
    expect(
      resolveSiteNavigationHrefs(rootHrefs, PROJECT_SITE_BASE_PATH),
    ).toEqual([
      "/you-agent-factory-docs/",
      "/you-agent-factory-docs/docs/guides",
      "/you-agent-factory-docs/blog",
    ]);
  });

  test("stripBasePathFromHref reverses project-site prefixing for locale matching", () => {
    expect(
      stripBasePathFromHref(
        "/you-agent-factory-docs/vi/docs/guides",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/vi/docs/guides");
    expect(
      stripBasePathFromHref("/you-agent-factory-docs", PROJECT_SITE_BASE_PATH),
    ).toBe("/");
    expect(stripBasePathFromHref("/docs/guides", "")).toBe("/docs/guides");
    expect(
      withBasePath(
        stripBasePathFromHref(
          "/you-agent-factory-docs/blog",
          PROJECT_SITE_BASE_PATH,
        ),
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/blog");
  });
});
