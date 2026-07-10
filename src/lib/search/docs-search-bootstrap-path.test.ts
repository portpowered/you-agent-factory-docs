import { describe, expect, test } from "bun:test";
import { oramaStaticClient } from "fumadocs-core/search/client/orama-static";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { docsSearchApi } from "@/lib/search/search-server";
import { withGlobalFetchOverride } from "@/tests/shared/global-fetch-lock";
import {
  DOCS_SEARCH_API_PATH,
  DOCS_SEARCH_BOOTSTRAP_FROM_ENV,
  readDocsSearchStaticBootstrapFrom,
  resolveClientDocsSearchBootstrapFromForLocale,
  resolveDocsSearchBootstrapFromForLocale,
  resolveDocsSearchStaticBootstrapFrom,
} from "./docs-search-bootstrap-path";

const PROJECT_SITE_BOOTSTRAP_FROM = `${BUILT_APP_GITHUB_PAGES_BASE_PATH}${DOCS_SEARCH_API_PATH}`;

describe("resolveDocsSearchStaticBootstrapFrom", () => {
  test("returns /api/search for root / unset-base-path builds", () => {
    expect(resolveDocsSearchStaticBootstrapFrom({})).toBe(DOCS_SEARCH_API_PATH);
    expect(
      resolveDocsSearchStaticBootstrapFrom({
        NEXT_STATIC_EXPORT: "0",
      }),
    ).toBe(DOCS_SEARCH_API_PATH);
    expect(
      resolveDocsSearchStaticBootstrapFrom({
        NEXT_STATIC_EXPORT: "1",
        GITHUB_PAGES_BASE_PATH: "",
      }),
    ).toBe(DOCS_SEARCH_API_PATH);
  });

  test("prefixes bootstrap path with live project-site basePath during export", () => {
    expect(
      resolveDocsSearchStaticBootstrapFrom({
        NEXT_STATIC_EXPORT: "1",
        GITHUB_PAGES_BASE_PATH: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      }),
    ).toBe(PROJECT_SITE_BOOTSTRAP_FROM);
  });

  test("readDocsSearchStaticBootstrapFrom prefers NEXT_PUBLIC env when set", () => {
    expect(
      readDocsSearchStaticBootstrapFrom({
        [DOCS_SEARCH_BOOTSTRAP_FROM_ENV]: PROJECT_SITE_BOOTSTRAP_FROM,
      }),
    ).toBe(PROJECT_SITE_BOOTSTRAP_FROM);
  });
});

describe("resolveDocsSearchBootstrapFromForLocale", () => {
  test("uses the default API route for english in root builds", () => {
    expect(resolveDocsSearchBootstrapFromForLocale("en", {})).toBe(
      DOCS_SEARCH_API_PATH,
    );
  });

  test("uses a locale query for non-default locales in root builds", () => {
    expect(resolveDocsSearchBootstrapFromForLocale("vi", {})).toBe(
      "/api/search?locale=vi",
    );
    expect(resolveDocsSearchBootstrapFromForLocale("ja", {})).toBe(
      "/api/search?locale=ja",
    );
  });

  test("uses a distinct export artifact under the project-site prefix", () => {
    expect(
      resolveDocsSearchBootstrapFromForLocale("vi", {
        NEXT_STATIC_EXPORT: "1",
        GITHUB_PAGES_BASE_PATH: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      }),
    ).toBe(`${PROJECT_SITE_BOOTSTRAP_FROM}.vi`);

    expect(
      resolveDocsSearchBootstrapFromForLocale("ja", {
        NEXT_STATIC_EXPORT: "1",
        GITHUB_PAGES_BASE_PATH: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      }),
    ).toBe(`${PROJECT_SITE_BOOTSTRAP_FROM}.ja`);
  });
});

describe("resolveClientDocsSearchBootstrapFromForLocale", () => {
  test("prefers the baked public bootstrap path for english", () => {
    expect(
      resolveClientDocsSearchBootstrapFromForLocale("en", {
        [DOCS_SEARCH_BOOTSTRAP_FROM_ENV]: PROJECT_SITE_BOOTSTRAP_FROM,
      }),
    ).toBe(PROJECT_SITE_BOOTSTRAP_FROM);
  });

  test("derives localized export artifacts from the baked public bootstrap path", () => {
    expect(
      resolveClientDocsSearchBootstrapFromForLocale("vi", {
        [DOCS_SEARCH_BOOTSTRAP_FROM_ENV]: PROJECT_SITE_BOOTSTRAP_FROM,
      }),
    ).toBe(`${PROJECT_SITE_BOOTSTRAP_FROM}.vi`);

    expect(
      resolveClientDocsSearchBootstrapFromForLocale("ja", {
        [DOCS_SEARCH_BOOTSTRAP_FROM_ENV]: PROJECT_SITE_BOOTSTRAP_FROM,
      }),
    ).toBe(`${PROJECT_SITE_BOOTSTRAP_FROM}.ja`);
  });
});

describe("static search bootstrap fetch path", () => {
  test("oramaStaticClient bootstraps from project-site-prefixed static asset without API route", async () => {
    const bootstrapFrom = `http://bootstrap-path-unit.test${PROJECT_SITE_BOOTSTRAP_FROM}`;
    const payload = await docsSearchApi.export();

    let fetchedUrl: string | undefined;
    await withGlobalFetchOverride(
      (async (input: RequestInfo | URL) => {
        fetchedUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        return new Response(JSON.stringify(payload), { status: 200 });
      }) as typeof fetch,
      async () => {
        const client = oramaStaticClient({ from: bootstrapFrom });
        const results = await client.search("attention");
        expect(fetchedUrl).toBe(bootstrapFrom);
        expect(results.length).toBeGreaterThan(0);
      },
    );
  });
});
