import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  prefixMetadataAlternates,
  resolvePublicAssetHref,
  resolveSiteAbsoluteHref,
} from "./site-metadata-path";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;

describe("resolveSiteAbsoluteHref", () => {
  test("keeps root builds unprefixed", () => {
    expect(resolveSiteAbsoluteHref("/docs/guides", "")).toBe("/docs/guides");
    expect(
      resolveSiteAbsoluteHref("/search", {
        NEXT_STATIC_EXPORT: "1",
        GITHUB_PAGES_BASE_PATH: "",
      }),
    ).toBe("/search");
  });

  test("prefixes project-site export hrefs", () => {
    expect(
      resolveSiteAbsoluteHref("/docs/guides", PROJECT_SITE_BASE_PATH),
    ).toBe(`${PROJECT_SITE_BASE_PATH}/docs/guides`);
    expect(
      resolveSiteAbsoluteHref("/blog", {
        NEXT_STATIC_EXPORT: "1",
        GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
      }),
    ).toBe(`${PROJECT_SITE_BASE_PATH}/blog`);
  });

  test("does not prefix outside static export builds", () => {
    expect(
      resolveSiteAbsoluteHref("/docs/guides", {
        GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
      }),
    ).toBe("/docs/guides");
  });
});

describe("resolvePublicAssetHref", () => {
  test("keeps public assets unprefixed for root builds", () => {
    expect(resolvePublicAssetHref("/favicon.ico", "")).toBe("/favicon.ico");
    expect(resolvePublicAssetHref("/images/diagram.png", "")).toBe(
      "/images/diagram.png",
    );
  });

  test("prefixes public assets for project-site exports", () => {
    expect(resolvePublicAssetHref("/favicon.ico", PROJECT_SITE_BASE_PATH)).toBe(
      `${PROJECT_SITE_BASE_PATH}/favicon.ico`,
    );
    expect(
      resolvePublicAssetHref("/images/diagram.png", {
        NEXT_STATIC_EXPORT: "1",
        GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
      }),
    ).toBe(`${PROJECT_SITE_BASE_PATH}/images/diagram.png`);
  });
});

describe("prefixMetadataAlternates", () => {
  test("keeps canonical and language alternates unprefixed for root", () => {
    expect(
      prefixMetadataAlternates(
        {
          canonical: "/docs/guides",
          languages: {
            en: "/docs/guides",
            vi: "/vi/docs/guides",
          },
        },
        "",
      ),
    ).toEqual({
      canonical: "/docs/guides",
      languages: {
        en: "/docs/guides",
        vi: "/vi/docs/guides",
      },
    });
  });

  test("prefixes canonical and language alternates for project-site", () => {
    expect(
      prefixMetadataAlternates(
        {
          canonical: "/",
          languages: {
            en: "/",
            ja: "/ja",
            "zh-CN": "/zh-CN",
          },
        },
        PROJECT_SITE_BASE_PATH,
      ),
    ).toEqual({
      canonical: `${PROJECT_SITE_BASE_PATH}/`,
      languages: {
        en: `${PROJECT_SITE_BASE_PATH}/`,
        ja: `${PROJECT_SITE_BASE_PATH}/ja`,
        "zh-CN": `${PROJECT_SITE_BASE_PATH}/zh-CN`,
      },
    });
  });
});
