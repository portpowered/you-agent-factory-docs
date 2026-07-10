import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  evaluateProjectSiteExportConsumers,
  projectSiteExportConsumersPass,
  verifyProjectSiteExportDirectory,
} from "./verify-project-site-export-consumers";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_BOOTSTRAP = `${PROJECT_SITE_BASE_PATH}/api/search`;

function projectSiteHtmlFixture(): string {
  return [
    `<script src="${PROJECT_SITE_BASE_PATH}/_next/static/chunk.js"></script>`,
    `<a href="${PROJECT_SITE_BASE_PATH}/">Home</a>`,
    `<a href="${PROJECT_SITE_BASE_PATH}/docs/guides">Guides</a>`,
    `<a href="${PROJECT_SITE_BASE_PATH}/blog">Blog</a>`,
  ].join("");
}

describe("verify-project-site-export-consumers", () => {
  test("evaluateProjectSiteExportConsumers passes for prefixed project-site fixtures", () => {
    const evaluation = evaluateProjectSiteExportConsumers({
      html: projectSiteHtmlFixture(),
      chunksContent: `from:"${PROJECT_SITE_BOOTSTRAP}",type:"static"`,
      basePath: PROJECT_SITE_BASE_PATH,
    });

    expect(evaluation).toEqual({
      hasPrefixedNextAssets: true,
      hasRootLevelNextAssets: false,
      hasPrefixedNavigation: true,
      hasPrefixedSearchBootstrap: true,
      hasUnprefixedSearchBootstrap: false,
    });
    expect(
      projectSiteExportConsumersPass(evaluation, PROJECT_SITE_BASE_PATH),
    ).toEqual({ ok: true, evaluation });
  });

  test("evaluateProjectSiteExportConsumers fails on root /_next or bare search bootstrap", () => {
    const rootNext = evaluateProjectSiteExportConsumers({
      html: '<script src="/_next/static/chunk.js"></script><a href="/docs/guides">',
      chunksContent: `from:"${PROJECT_SITE_BOOTSTRAP}"`,
      basePath: PROJECT_SITE_BASE_PATH,
    });
    expect(rootNext.hasRootLevelNextAssets).toBe(true);
    expect(
      projectSiteExportConsumersPass(rootNext, PROJECT_SITE_BASE_PATH).ok,
    ).toBe(false);

    const bareSearch = evaluateProjectSiteExportConsumers({
      html: projectSiteHtmlFixture(),
      chunksContent: 'from:"/api/search",type:"static"',
      basePath: PROJECT_SITE_BASE_PATH,
    });
    expect(bareSearch.hasUnprefixedSearchBootstrap).toBe(true);
    expect(bareSearch.hasPrefixedSearchBootstrap).toBe(false);
    const barePass = projectSiteExportConsumersPass(
      bareSearch,
      PROJECT_SITE_BASE_PATH,
    );
    expect(barePass.ok).toBe(false);
    if (!barePass.ok) {
      expect(barePass.reason).toBe(
        `client chunks missing prefixed search bootstrap ${PROJECT_SITE_BOOTSTRAP}`,
      );
    }
  });

  test("evaluateProjectSiteExportConsumers tolerates DOCS_SEARCH_API_PATH constant beside prefixed bake", () => {
    const evaluation = evaluateProjectSiteExportConsumers({
      html: projectSiteHtmlFixture(),
      chunksContent: `let o="/api/search";let v="${PROJECT_SITE_BOOTSTRAP}";from:v`,
      basePath: PROJECT_SITE_BASE_PATH,
    });
    expect(evaluation.hasPrefixedSearchBootstrap).toBe(true);
    expect(evaluation.hasUnprefixedSearchBootstrap).toBe(false);
    expect(
      projectSiteExportConsumersPass(evaluation, PROJECT_SITE_BASE_PATH).ok,
    ).toBe(true);
  });

  test("chunk contract: project-site bake path must appear in chunk content", () => {
    const prefixed = evaluateProjectSiteExportConsumers({
      html: projectSiteHtmlFixture(),
      chunksContent: `function v(){return"${PROJECT_SITE_BOOTSTRAP}"}`,
      basePath: PROJECT_SITE_BASE_PATH,
    });
    expect(prefixed.hasPrefixedSearchBootstrap).toBe(true);
    expect(
      projectSiteExportConsumersPass(prefixed, PROJECT_SITE_BASE_PATH).ok,
    ).toBe(true);

    const unprefixedOnly = evaluateProjectSiteExportConsumers({
      html: projectSiteHtmlFixture(),
      chunksContent: 'function v(){return"/api/search"}',
      basePath: PROJECT_SITE_BASE_PATH,
    });
    expect(unprefixedOnly.hasPrefixedSearchBootstrap).toBe(false);
    expect(unprefixedOnly.hasUnprefixedSearchBootstrap).toBe(true);
    const failed = projectSiteExportConsumersPass(
      unprefixedOnly,
      PROJECT_SITE_BASE_PATH,
    );
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.reason).toContain(
        `client chunks missing prefixed search bootstrap ${PROJECT_SITE_BOOTSTRAP}`,
      );
    }
  });

  test("verifyProjectSiteExportDirectory reads out/ HTML and client chunks", () => {
    const root = mkdtempSync(join(tmpdir(), "project-site-export-"));
    try {
      const outDir = join(root, "out");
      const chunksDir = join(outDir, "_next/static/chunks");
      mkdirSync(join(outDir, "docs"), { recursive: true });
      mkdirSync(chunksDir, { recursive: true });
      writeFileSync(join(outDir, "index.html"), projectSiteHtmlFixture());
      writeFileSync(
        join(outDir, "docs/guides.html"),
        `<a href="${PROJECT_SITE_BASE_PATH}/docs/guides">Guides</a>`,
      );
      writeFileSync(
        join(outDir, "blog.html"),
        `<a href="${PROJECT_SITE_BASE_PATH}/blog">Blog</a>`,
      );
      writeFileSync(
        join(chunksDir, "main.js"),
        `from:"${PROJECT_SITE_BOOTSTRAP}",type:"static"`,
      );

      const result = verifyProjectSiteExportDirectory({
        basePath: PROJECT_SITE_BASE_PATH,
        outDir: "out",
        cwd: root,
      });
      expect(result.ok).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("verifyProjectSiteExportDirectory fails when chunks only bake unprefixed /api/search", () => {
    const root = mkdtempSync(join(tmpdir(), "project-site-export-bare-"));
    try {
      const outDir = join(root, "out");
      const chunksDir = join(outDir, "_next/static/chunks");
      mkdirSync(join(outDir, "docs"), { recursive: true });
      mkdirSync(chunksDir, { recursive: true });
      writeFileSync(join(outDir, "index.html"), projectSiteHtmlFixture());
      writeFileSync(
        join(outDir, "docs/guides.html"),
        `<a href="${PROJECT_SITE_BASE_PATH}/docs/guides">Guides</a>`,
      );
      writeFileSync(
        join(outDir, "blog.html"),
        `<a href="${PROJECT_SITE_BASE_PATH}/blog">Blog</a>`,
      );
      writeFileSync(
        join(chunksDir, "main.js"),
        'from:"/api/search",type:"static"',
      );

      const result = verifyProjectSiteExportDirectory({
        basePath: PROJECT_SITE_BASE_PATH,
        outDir: "out",
        cwd: root,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe(
          `client chunks missing prefixed search bootstrap ${PROJECT_SITE_BOOTSTRAP}`,
        );
        expect(result.evaluation.hasPrefixedSearchBootstrap).toBe(false);
        expect(result.evaluation.hasUnprefixedSearchBootstrap).toBe(true);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
