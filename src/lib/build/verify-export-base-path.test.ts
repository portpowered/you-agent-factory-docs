import { describe, expect, test } from "bun:test";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesBasePathInternalLinks,
} from "./verify-export-base-path";

const PROJECT_SITE_BASE_PATH = "/you-agent-factory-docs";

describe("verify-export-base-path", () => {
  test("exportHtmlReferencesBasePathAssets requires a non-empty base path asset prefix", () => {
    expect(
      exportHtmlReferencesBasePathAssets('<script src="/_next/x">', ""),
    ).toBe(false);
    expect(
      exportHtmlReferencesBasePathAssets(
        '<script src="/docs-site/_next/static/chunk.js">',
        "/docs-site",
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesBasePathAssets(
        '<script src="/_next/static/chunk.js">',
        "/docs-site",
      ),
    ).toBe(false);
  });

  test("project-site HTML must reference /you-agent-factory-docs/_next not bare /_next", () => {
    const prefixedHtml =
      '<script src="/you-agent-factory-docs/_next/static/chunk.js"></script>';
    const bareHtml = '<script src="/_next/static/chunk.js"></script>';

    expect(
      exportHtmlReferencesBasePathAssets(prefixedHtml, PROJECT_SITE_BASE_PATH),
    ).toBe(true);
    expect(
      exportHtmlReferencesBasePathAssets(bareHtml, PROJECT_SITE_BASE_PATH),
    ).toBe(false);
    expect(prefixedHtml.includes(`${PROJECT_SITE_BASE_PATH}/_next/`)).toBe(
      true,
    );
    expect(bareHtml.includes(`${PROJECT_SITE_BASE_PATH}/_next/`)).toBe(false);
  });

  test("exportHtmlReferencesBasePathInternalLinks detects docs/tags/root hrefs", () => {
    expect(
      exportHtmlReferencesBasePathInternalLinks(
        '<a href="/docs-site/docs/getting-started">',
        "/docs-site",
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesBasePathInternalLinks(
        '<a href="/docs-site/tags">',
        "/docs-site",
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesBasePathInternalLinks(
        '<a href="/docs/getting-started">',
        "/docs-site",
      ),
    ).toBe(false);
  });
});
