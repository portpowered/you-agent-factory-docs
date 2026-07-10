import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  bakeDocsSearchStaticBootstrapFromEnv,
  DOCS_SEARCH_API_PATH,
} from "@/lib/search/docs-search-bootstrap-path";
import {
  exportClientBundleIncludesBootstrapFrom,
  exportContentReferencesUnprefixedSearchBootstrap,
  resolveExportSearchBootstrapClientFrom,
} from "./verify-export-search-bootstrap-client-path";

const PROJECT_SITE_BOOTSTRAP_FROM = `${BUILT_APP_GITHUB_PAGES_BASE_PATH}/api/search`;

describe("verify-export-search-bootstrap-client-path", () => {
  test("resolveExportSearchBootstrapClientFrom prefixes /api/search for root and project-site", () => {
    expect(
      resolveExportSearchBootstrapClientFrom(BUILT_APP_GITHUB_PAGES_BASE_PATH),
    ).toBe(PROJECT_SITE_BOOTSTRAP_FROM);
    expect(resolveExportSearchBootstrapClientFrom("")).toBe("/api/search");
  });

  test("env bake maps to the same chunk-contract bootstrap path for root vs project-site", () => {
    const projectSiteBake = bakeDocsSearchStaticBootstrapFromEnv({
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: BUILT_APP_GITHUB_PAGES_BASE_PATH,
    });
    const rootBake = bakeDocsSearchStaticBootstrapFromEnv({
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: "",
    });

    expect(projectSiteBake).toBe(PROJECT_SITE_BOOTSTRAP_FROM);
    expect(rootBake).toBe(DOCS_SEARCH_API_PATH);
    expect(
      resolveExportSearchBootstrapClientFrom(BUILT_APP_GITHUB_PAGES_BASE_PATH),
    ).toBe(projectSiteBake);
    expect(resolveExportSearchBootstrapClientFrom("")).toBe(rootBake);
  });

  test("exportClientBundleIncludesBootstrapFrom matches baked bootstrap literals", () => {
    const chunks = `from:"${PROJECT_SITE_BOOTSTRAP_FROM}",type:"static"`;
    expect(
      exportClientBundleIncludesBootstrapFrom(
        chunks,
        PROJECT_SITE_BOOTSTRAP_FROM,
      ),
    ).toBe(true);
    expect(
      exportClientBundleIncludesBootstrapFrom(
        'from:"/other-site/search-bootstrap"',
        PROJECT_SITE_BOOTSTRAP_FROM,
      ),
    ).toBe(false);
  });

  test("chunk contract accepts SWC-inlined return of the project-site bake", () => {
    const inlinedChunks = `function v(){return"${PROJECT_SITE_BOOTSTRAP_FROM}"}let o="${DOCS_SEARCH_API_PATH}"`;
    expect(
      exportClientBundleIncludesBootstrapFrom(
        inlinedChunks,
        PROJECT_SITE_BOOTSTRAP_FROM,
      ),
    ).toBe(true);
  });

  test("chunk contract fails when only an unprefixed /api/search bake is present", () => {
    const unprefixedOnly = 'from:"/api/search",type:"static"';
    expect(
      exportClientBundleIncludesBootstrapFrom(
        unprefixedOnly,
        PROJECT_SITE_BOOTSTRAP_FROM,
      ),
    ).toBe(false);
    expect(
      exportContentReferencesUnprefixedSearchBootstrap(unprefixedOnly),
    ).toBe(true);
  });

  test("exportContentReferencesUnprefixedSearchBootstrap detects bare /api/search literals", () => {
    expect(
      exportContentReferencesUnprefixedSearchBootstrap(
        'from:"/api/search",type:"static"',
      ),
    ).toBe(true);
    expect(
      exportContentReferencesUnprefixedSearchBootstrap(
        'from:"/api/search.vi",type:"static"',
      ),
    ).toBe(true);
    expect(
      exportContentReferencesUnprefixedSearchBootstrap(
        `from:"${PROJECT_SITE_BOOTSTRAP_FROM}",type:"static"`,
      ),
    ).toBe(false);
  });
});
