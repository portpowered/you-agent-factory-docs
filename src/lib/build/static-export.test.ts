import { describe, expect, test } from "bun:test";
import {
  ensureStaticExportParams,
  GITHUB_PAGES_BASE_PATH_ENV,
  isStaticExportBuild,
  normalizeGitHubPagesBasePath,
  resolveBasePathForExportVerification,
  resolveGitHubPagesBasePath,
  resolveNextConfigForBuildMode,
  STATIC_EXPORT_ENV,
  staticExportNextConfig,
} from "./static-export";

describe("static export build mode", () => {
  test("is disabled unless NEXT_STATIC_EXPORT=1", () => {
    expect(isStaticExportBuild({})).toBe(false);
    expect(isStaticExportBuild({ [STATIC_EXPORT_ENV]: "0" })).toBe(false);
    expect(isStaticExportBuild({ [STATIC_EXPORT_ENV]: "1" })).toBe(true);
  });

  test("enables export output settings only in export mode", () => {
    expect(resolveNextConfigForBuildMode({})).toEqual({});
    expect(resolveNextConfigForBuildMode({ [STATIC_EXPORT_ENV]: "1" })).toEqual(
      staticExportNextConfig,
    );
  });

  test("static export config keeps images unoptimized for GitHub Pages", () => {
    expect(staticExportNextConfig.output).toBe("export");
    expect(staticExportNextConfig.images).toEqual({ unoptimized: true });
  });

  test("normalizes GitHub Pages base path values", () => {
    expect(normalizeGitHubPagesBasePath(undefined)).toBe("");
    expect(normalizeGitHubPagesBasePath("")).toBe("");
    expect(normalizeGitHubPagesBasePath("/")).toBe("");
    expect(normalizeGitHubPagesBasePath("you-agent-factory-docs")).toBe(
      "/you-agent-factory-docs",
    );
    expect(normalizeGitHubPagesBasePath("/you-agent-factory-docs/")).toBe(
      "/you-agent-factory-docs",
    );
  });

  test("reads base path only during static export builds", () => {
    expect(
      resolveGitHubPagesBasePath({
        [GITHUB_PAGES_BASE_PATH_ENV]: "/you-agent-factory-docs",
      }),
    ).toBe("");
    expect(
      resolveGitHubPagesBasePath({
        [STATIC_EXPORT_ENV]: "1",
        [GITHUB_PAGES_BASE_PATH_ENV]: "you-agent-factory-docs",
      }),
    ).toBe("/you-agent-factory-docs");
  });

  test("reads base path for export verification without NEXT_STATIC_EXPORT", () => {
    expect(
      resolveBasePathForExportVerification({
        [GITHUB_PAGES_BASE_PATH_ENV]: "you-agent-factory-docs",
      }),
    ).toBe("/you-agent-factory-docs");
    expect(resolveBasePathForExportVerification({})).toBe("");
  });

  test("applies the same normalized basePath and assetPrefix for the project site", () => {
    const config = resolveNextConfigForBuildMode({
      [STATIC_EXPORT_ENV]: "1",
      [GITHUB_PAGES_BASE_PATH_ENV]: "/you-agent-factory-docs",
    });
    expect(config).toEqual({
      ...staticExportNextConfig,
      basePath: "/you-agent-factory-docs",
      assetPrefix: "/you-agent-factory-docs",
    });
    expect(config.basePath).toBe(config.assetPrefix);
  });

  test("slash-normalized project-site forms share one basePath and assetPrefix", () => {
    for (const raw of [
      "you-agent-factory-docs",
      "/you-agent-factory-docs",
      "/you-agent-factory-docs/",
    ]) {
      const config = resolveNextConfigForBuildMode({
        [STATIC_EXPORT_ENV]: "1",
        [GITHUB_PAGES_BASE_PATH_ENV]: raw,
      });
      expect(config.basePath).toBe("/you-agent-factory-docs");
      expect(config.assetPrefix).toBe("/you-agent-factory-docs");
      expect(config.basePath).toBe(config.assetPrefix);
    }
  });

  test("keeps real generateStaticParams when non-empty", () => {
    expect(
      ensureStaticExportParams(
        [{ locale: "vi", slug: "post" }],
        { locale: "vi", slug: "placeholder" },
        { [STATIC_EXPORT_ENV]: "1" },
      ),
    ).toEqual([{ locale: "vi", slug: "post" }]);
  });

  test("allows empty generateStaticParams outside static export", () => {
    expect(
      ensureStaticExportParams([], { locale: "vi", slug: "placeholder" }, {}),
    ).toEqual([]);
  });

  test("emits a placeholder param when static export would otherwise be empty", () => {
    expect(
      ensureStaticExportParams(
        [],
        { locale: "vi", slug: "placeholder" },
        { [STATIC_EXPORT_ENV]: "1" },
      ),
    ).toEqual([{ locale: "vi", slug: "placeholder" }]);
  });

  test("emits a placeholder catch-all slug array for empty docs routes", () => {
    expect(
      ensureStaticExportParams(
        [],
        { locale: "ja", slug: ["__no_localized_docs_pages__"] },
        { [STATIC_EXPORT_ENV]: "1" },
      ),
    ).toEqual([{ locale: "ja", slug: ["__no_localized_docs_pages__"] }]);
  });
});
