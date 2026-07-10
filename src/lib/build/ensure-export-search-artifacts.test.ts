import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { exportHtmlReferencesBasePathAssets } from "@/lib/build/verify-export-base-path";

describe("ensureExportSearchArtifacts base-path matching", () => {
  test("exportHtmlReferencesBasePathAssets distinguishes prefixed and default HTML", () => {
    const prefixedHtml = `<html><script src="${BUILT_APP_GITHUB_PAGES_BASE_PATH}/_next/static/chunk.js"></script></html>`;
    const defaultHtml =
      '<html><script src="/_next/static/chunk.js"></script></html>';

    expect(
      exportHtmlReferencesBasePathAssets(
        prefixedHtml,
        BUILT_APP_GITHUB_PAGES_BASE_PATH,
      ),
    ).toBe(true);
    expect(
      exportHtmlReferencesBasePathAssets(
        defaultHtml,
        BUILT_APP_GITHUB_PAGES_BASE_PATH,
      ),
    ).toBe(false);
  });

  test("writes search.html fixture for matcher checks", () => {
    const root = mkdtempSync(join(tmpdir(), "ensure-export-artifacts-"));
    const outDir = join(root, "out");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "search.html"),
      '<html><script src="/_next/static/chunk.js"></script></html>',
    );

    expect(
      exportHtmlReferencesBasePathAssets(
        '<html><script src="/_next/static/chunk.js"></script></html>',
        BUILT_APP_GITHUB_PAGES_BASE_PATH,
      ),
    ).toBe(false);

    rmSync(root, { recursive: true, force: true });
  });
});
