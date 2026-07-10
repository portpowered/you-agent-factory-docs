import { describe, expect, test } from "bun:test";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesBasePathInternalLinks,
  exportHtmlReferencesPrefixedNavigationHrefs,
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

  test("exportHtmlReferencesBasePathInternalLinks detects docs/tags/blog/root hrefs", () => {
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
        '<a href="/docs-site/blog">',
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

  test("exportHtmlReferencesPrefixedNavigationHrefs requires home/docs/blog under project site", () => {
    const html = [
      '<a href="/you-agent-factory-docs/">Home</a>',
      '<a href="/you-agent-factory-docs/docs/guides">Guides</a>',
      '<a href="/you-agent-factory-docs/blog">Blog</a>',
      '<a href="/you-agent-factory-docs/vi/blog">VI Blog</a>',
    ].join("");

    expect(
      exportHtmlReferencesPrefixedNavigationHrefs(
        html,
        PROJECT_SITE_BASE_PATH,
        ["/", "/docs/guides", "/blog", "/vi/blog"],
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesPrefixedNavigationHrefs(
        '<a href="/docs/guides"><a href="/blog">',
        PROJECT_SITE_BASE_PATH,
        ["/", "/docs/guides", "/blog"],
      ),
    ).toBe(false);
  });
});
