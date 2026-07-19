import { describe, expect, test } from "bun:test";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesBasePathInternalLinks,
  exportHtmlReferencesPrefixedMetadataHrefs,
  exportHtmlReferencesPrefixedNavigationHrefs,
  exportHtmlReferencesPrefixedPublicAsset,
  exportHtmlReferencesRootLevelNextAssets,
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
    expect(exportHtmlReferencesRootLevelNextAssets(prefixedHtml)).toBe(false);
    expect(exportHtmlReferencesRootLevelNextAssets(bareHtml)).toBe(true);
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

  test("exportHtmlReferencesPrefixedNavigationHrefs accepts trailing-slash Link hrefs", () => {
    const html = [
      '<a href="/you-agent-factory-docs/">Home</a>',
      '<a href="/you-agent-factory-docs/docs/guides/">Guides</a>',
      '<a href="/you-agent-factory-docs/blog/">Blog</a>',
    ].join("");

    expect(
      exportHtmlReferencesPrefixedNavigationHrefs(
        html,
        PROJECT_SITE_BASE_PATH,
        ["/", "/docs/guides", "/blog"],
      ),
    ).toBe(true);
  });

  test("collection index nav/sidebar hrefs resolve in non-slash and trailing-slash forms", () => {
    const collectionHrefs = [
      "/docs/factories",
      "/docs/workers",
      "/docs/workstations",
    ] as const;
    const nonSlashHtml = collectionHrefs
      .map(
        (href) =>
          `<a href="/you-agent-factory-docs${href}">${href.slice("/docs/".length)}</a>`,
      )
      .join("");
    const trailingSlashHtml = collectionHrefs
      .map(
        (href) =>
          `<a href="/you-agent-factory-docs${href}/">${href.slice("/docs/".length)}</a>`,
      )
      .join("");

    expect(
      exportHtmlReferencesPrefixedNavigationHrefs(
        nonSlashHtml,
        PROJECT_SITE_BASE_PATH,
        collectionHrefs,
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesPrefixedNavigationHrefs(
        trailingSlashHtml,
        PROJECT_SITE_BASE_PATH,
        collectionHrefs,
      ),
    ).toBe(true);
  });

  test("Pages representative nav hrefs require relative home/getting-started/comparing under project site", () => {
    const representativeHrefs = [
      "/",
      "/docs/guides/getting-started",
      "/blog/comparing-agent-factories",
    ] as const;
    const relativePrefixedHtml = [
      '<a href="/you-agent-factory-docs">Home</a>',
      '<a href="/you-agent-factory-docs/docs/guides/getting-started">Getting started</a>',
      '<a href="/you-agent-factory-docs/blog/comparing-agent-factories">Comparing</a>',
    ].join("");
    const comparingAbsoluteOnlyHtml = [
      '<a href="/you-agent-factory-docs">Home</a>',
      '<a href="/you-agent-factory-docs/docs/guides/getting-started">Getting started</a>',
      '<link rel="canonical" href="https://portpowered.github.io/you-agent-factory-docs/blog/comparing-agent-factories">',
      '<meta property="og:url" content="https://portpowered.github.io/you-agent-factory-docs/blog/comparing-agent-factories">',
    ].join("");

    expect(
      exportHtmlReferencesPrefixedNavigationHrefs(
        relativePrefixedHtml,
        PROJECT_SITE_BASE_PATH,
        representativeHrefs,
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesPrefixedNavigationHrefs(
        comparingAbsoluteOnlyHtml,
        PROJECT_SITE_BASE_PATH,
        representativeHrefs,
      ),
    ).toBe(false);
  });

  test("exportHtmlReferencesPrefixedMetadataHrefs requires prefixed canonical and hreflang", () => {
    const html = [
      '<link rel="canonical" href="/you-agent-factory-docs/docs/guides">',
      '<link rel="alternate" href="/you-agent-factory-docs/vi/docs/guides" hreflang="vi">',
      '<link rel="alternate" href="/you-agent-factory-docs/ja/docs/guides" hreflang="ja">',
    ].join("");

    expect(
      exportHtmlReferencesPrefixedMetadataHrefs(
        html,
        PROJECT_SITE_BASE_PATH,
        "/docs/guides",
        ["/vi/docs/guides", "/ja/docs/guides"],
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesPrefixedMetadataHrefs(
        '<link rel="canonical" href="/docs/guides">',
        PROJECT_SITE_BASE_PATH,
        "/docs/guides",
      ),
    ).toBe(false);
  });

  test("exportHtmlReferencesPrefixedMetadataHrefs accepts absolute production metadataBase URLs", () => {
    const html = [
      '<link rel="canonical" href="https://portpowered.github.io/you-agent-factory-docs/docs/guides">',
      '<link rel="alternate" href="https://portpowered.github.io/you-agent-factory-docs/vi/docs/guides" hreflang="vi">',
    ].join("");

    expect(
      exportHtmlReferencesPrefixedMetadataHrefs(
        html,
        PROJECT_SITE_BASE_PATH,
        "/docs/guides",
        ["/vi/docs/guides"],
      ),
    ).toBe(true);
  });

  test("exportHtmlReferencesPrefixedPublicAsset detects project-site asset URLs", () => {
    expect(
      exportHtmlReferencesPrefixedPublicAsset(
        '<link rel="icon" href="/you-agent-factory-docs/favicon.ico">',
        PROJECT_SITE_BASE_PATH,
        "/favicon.ico",
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesPrefixedPublicAsset(
        '<img src="/images/diagram.png">',
        PROJECT_SITE_BASE_PATH,
        "/images/diagram.png",
      ),
    ).toBe(false);
  });
});
