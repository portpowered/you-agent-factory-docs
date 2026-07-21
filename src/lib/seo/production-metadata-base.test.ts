import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionMetadataBase,
  resolveProductionMetadataHref,
  resolveProductionSitemapLocHref,
} from "./production-metadata-base";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;
const ROOT_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: "",
} as const;

describe("resolveProductionMetadataBase", () => {
  test("uses production origin only for root / unset-base-path builds", () => {
    expect(resolveProductionMetadataBase({}).href).toBe(
      `${PRODUCTION_SITE_ORIGIN}/`,
    );
    expect(resolveProductionMetadataBase(ROOT_EXPORT_ENV).href).toBe(
      `${PRODUCTION_SITE_ORIGIN}/`,
    );
    expect(
      resolveProductionMetadataBase({
        GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
      }).href,
    ).toBe(`${PRODUCTION_SITE_ORIGIN}/`);
  });

  test("aligns metadataBase with origin + project-site base path on export", () => {
    const metadataBase = resolveProductionMetadataBase(PROJECT_SITE_EXPORT_ENV);
    expect(metadataBase.origin).toBe(PRODUCTION_SITE_ORIGIN);
    expect(metadataBase.pathname).toBe(PROJECT_SITE_BASE_PATH);
    expect(metadataBase.href).toBe(
      `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}`,
    );
  });

  test("does not force project-site prefix when base path is unset on export", () => {
    const metadataBase = resolveProductionMetadataBase({
      NEXT_STATIC_EXPORT: "1",
    });
    expect(metadataBase.pathname).toBe("/");
    expect(metadataBase.href).toBe(`${PRODUCTION_SITE_ORIGIN}/`);
  });
});

describe("resolveProductionMetadataHref", () => {
  test("resolves app-relative hrefs under the project-site metadataBase", () => {
    expect(
      resolveProductionMetadataHref("/docs/guides", PROJECT_SITE_EXPORT_ENV),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/guides`);
    expect(resolveProductionMetadataHref("/", PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/`,
    );
    expect(
      resolveProductionMetadataHref("/blog", PROJECT_SITE_EXPORT_ENV),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/blog`);
  });

  test("keeps root-mode hrefs on the production origin without project prefix", () => {
    expect(resolveProductionMetadataHref("/docs/guides", ROOT_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}/docs/guides`,
    );
    expect(resolveProductionMetadataHref("/search", {})).toBe(
      `${PRODUCTION_SITE_ORIGIN}/search`,
    );
  });

  test("strips an already-prefixed path so metadataBase does not double-prefix", () => {
    expect(
      resolveProductionMetadataHref(
        `${PROJECT_SITE_BASE_PATH}/docs/guides`,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/guides`);
  });

  test("keeps non-slash canonical absolute URLs when hrefs include a trailing slash", () => {
    expect(
      resolveProductionMetadataHref(
        "/docs/factories/",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/factories`);
    expect(
      resolveProductionMetadataHref("/docs/workers/", PROJECT_SITE_EXPORT_ENV),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/workers`);
    expect(
      resolveProductionMetadataHref(
        "/docs/workstations/",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(
      `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/workstations`,
    );
  });
});

describe("resolveProductionSitemapLocHref", () => {
  test("emits trailing-slash absolute locs under project-site export", () => {
    expect(
      resolveProductionSitemapLocHref("/docs/guides", PROJECT_SITE_EXPORT_ENV),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/guides/`);
    expect(
      resolveProductionSitemapLocHref(
        "/docs/factories",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(
      `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/factories/`,
    );
    expect(resolveProductionSitemapLocHref("/", PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/`,
    );
    expect(
      resolveProductionSitemapLocHref("/blog", PROJECT_SITE_EXPORT_ENV),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/blog/`);
  });

  test("keeps root-mode locs origin-only with trailing slash and no project prefix", () => {
    expect(
      resolveProductionSitemapLocHref("/docs/guides", ROOT_EXPORT_ENV),
    ).toBe(`${PRODUCTION_SITE_ORIGIN}/docs/guides/`);
    expect(resolveProductionSitemapLocHref("/search", {})).toBe(
      `${PRODUCTION_SITE_ORIGIN}/search/`,
    );
  });

  test("normalizes slash and non-slash app hrefs to the same trailing-slash loc", () => {
    expect(
      resolveProductionSitemapLocHref(
        "/docs/factories/",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(
      resolveProductionSitemapLocHref(
        "/docs/factories",
        PROJECT_SITE_EXPORT_ENV,
      ),
    );
  });
});
