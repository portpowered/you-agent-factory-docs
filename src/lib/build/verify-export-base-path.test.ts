import { describe, expect, test } from "bun:test";
import {
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesBasePathInternalLinks,
} from "./verify-export-base-path";

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
