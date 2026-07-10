import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
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
