import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appPageModuleMatchesRetiredRouteFamily,
  auditStaticExportLegacyCompileGraph,
  findRetiredExportHtmlViolations,
  formatLegacyCompileGraphAudit,
  isRetiredAtlasDocsSlug,
  listAppPageModulePaths,
  omitRetiredAtlasDocsStaticParams,
  RETIRED_ATLAS_DOCS_COLLECTION_IDS,
  retiredExportHtmlPathPrefixes,
  SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS,
} from "./static-export-legacy-compile-graph";

const repoRoot = join(import.meta.dir, "../../..");

describe("static-export-legacy-compile-graph", () => {
  test("isRetiredAtlasDocsSlug detects retired collection prefixes only", () => {
    for (const id of RETIRED_ATLAS_DOCS_COLLECTION_IDS) {
      expect(isRetiredAtlasDocsSlug([id])).toBe(true);
      expect(isRetiredAtlasDocsSlug([id, "attention"])).toBe(true);
    }
    expect(isRetiredAtlasDocsSlug(["guides", "getting-started"])).toBe(false);
    expect(isRetiredAtlasDocsSlug(["concepts", "harness"])).toBe(false);
    expect(isRetiredAtlasDocsSlug(["glossary", "token"])).toBe(false);
    expect(isRetiredAtlasDocsSlug(undefined)).toBe(false);
    expect(isRetiredAtlasDocsSlug([])).toBe(false);
  });

  test("omitRetiredAtlasDocsStaticParams drops retired Atlas params and keeps factory ones", () => {
    const filtered = omitRetiredAtlasDocsStaticParams([
      { slug: ["guides", "getting-started"] },
      { slug: ["modules", "attention"] },
      { slug: ["models"] },
      { slug: ["concepts", "harness"] },
      { slug: ["papers", "attention-is-all-you-need"] },
      { locale: "ja", slug: ["systems", "foo"] },
      { locale: "ja", slug: ["techniques", "ralph"] },
    ]);

    expect(filtered).toEqual([
      { slug: ["guides", "getting-started"] },
      { slug: ["concepts", "harness"] },
      { locale: "ja", slug: ["techniques", "ralph"] },
    ]);
  });

  test("appPageModuleMatchesRetiredRouteFamily ignores route groups and dynamic segments", () => {
    expect(
      appPageModuleMatchesRetiredRouteFamily("(site)/docs/models/page.tsx"),
    ).toBe(true);
    expect(
      appPageModuleMatchesRetiredRouteFamily("[locale]/docs/modules/page.tsx"),
    ).toBe(true);
    expect(
      appPageModuleMatchesRetiredRouteFamily("(site)/topology/page.tsx"),
    ).toBe(true);
    expect(
      appPageModuleMatchesRetiredRouteFamily("[locale]/docs/timeline/page.tsx"),
    ).toBe(true);
    expect(
      appPageModuleMatchesRetiredRouteFamily("(site)/docs/guides/page.tsx"),
    ).toBe(false);
    expect(
      appPageModuleMatchesRetiredRouteFamily(
        "(site)/docs/architecture/page.tsx",
      ),
    ).toBe(false);
    expect(
      appPageModuleMatchesRetiredRouteFamily(
        "(dev)/component-examples/page.tsx",
      ),
    ).toBe(false);
  });

  test("live app tree has no retired route modules and keeps factory export routes", () => {
    const result = auditStaticExportLegacyCompileGraph({
      projectRoot: repoRoot,
      // Do not require a built out/ for this unit proof.
      outDir: join(repoRoot, ".does-not-exist-out"),
    });

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);

    for (const marker of SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS) {
      expect(
        result.appPageModules.some(
          (page) => page === marker || page.endsWith(`/${marker}`),
        ),
      ).toBe(true);
    }

    expect(
      result.appPageModules.some((page) =>
        appPageModuleMatchesRetiredRouteFamily(page),
      ),
    ).toBe(false);
  });

  test("findRetiredExportHtmlViolations flags retired HTML and ignores factory HTML", () => {
    const dir = mkdtempSync(join(tmpdir(), "legacy-export-html-"));
    try {
      mkdirSync(join(dir, "docs/guides"), { recursive: true });
      mkdirSync(join(dir, "docs/modules"), { recursive: true });
      mkdirSync(join(dir, "ja/docs/models"), { recursive: true });
      mkdirSync(join(dir, "topology"), { recursive: true });
      writeFileSync(join(dir, "index.html"), "<html></html>\n");
      writeFileSync(join(dir, "docs/guides/getting-started.html"), "<html/>\n");
      writeFileSync(join(dir, "docs/modules/attention.html"), "<html/>\n");
      writeFileSync(join(dir, "ja/docs/models/index.html"), "<html/>\n");
      writeFileSync(join(dir, "topology.html"), "<html/>\n");

      const violations = findRetiredExportHtmlViolations(dir, "/");
      const paths = violations.map((entry) => entry.path).sort();

      expect(paths).toContain("docs/modules/attention.html");
      expect(paths).toContain("ja/docs/models/index.html");
      expect(paths).toContain("topology.html");
      expect(paths).not.toContain("docs/guides/getting-started.html");
      expect(paths).not.toContain("index.html");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("retiredExportHtmlPathPrefixes cover default and localized locales", () => {
    expect(retiredExportHtmlPathPrefixes("/docs/modules")).toEqual([
      "docs/modules",
      "ja/docs/modules",
      "zh-CN/docs/modules",
      "vi/docs/modules",
    ]);
  });

  test("formatLegacyCompileGraphAudit reports ok and failure shapes", () => {
    const ok = formatLegacyCompileGraphAudit({
      ok: true,
      violations: [],
      appPageModules: ["(site)/docs/guides/page.tsx"],
    });
    expect(ok).toContain("static-export-legacy-compile-graph: ok");
    expect(ok).toContain("appPageModules=1");

    const fail = formatLegacyCompileGraphAudit({
      ok: false,
      violations: [
        {
          kind: "retired-export-html",
          path: "docs/models.html",
          detail:
            "Static export emitted HTML for retired route family /docs/models: docs/models.html",
        },
      ],
      appPageModules: [],
    });
    expect(fail).toContain("static-export-legacy-compile-graph: FAIL");
    expect(fail).toContain("[retired-export-html] docs/models.html");
  });

  test("listAppPageModulePaths walks nested app trees", () => {
    const dir = mkdtempSync(join(tmpdir(), "app-pages-"));
    try {
      mkdirSync(join(dir, "(site)/docs/guides"), { recursive: true });
      mkdirSync(join(dir, "[locale]/docs/modules"), { recursive: true });
      writeFileSync(
        join(dir, "(site)/docs/guides/page.tsx"),
        "export default function Page(){return null}",
      );
      writeFileSync(
        join(dir, "[locale]/docs/modules/page.tsx"),
        "export default function Page(){return null}",
      );

      expect(listAppPageModulePaths(dir)).toEqual([
        "(site)/docs/guides/page.tsx",
        "[locale]/docs/modules/page.tsx",
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
