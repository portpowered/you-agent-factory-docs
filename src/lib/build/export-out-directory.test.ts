import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
  resolveExportHtmlFilePath,
  STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_RELATIVE_PATHS,
  STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES,
  stripBasePathFromExportHtml,
  verifyExportDirectoryLandings,
  verifyExportOutDirectory,
} from "./export-out-directory";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function writeLanding(outDir: string, route: string, html = "<html></html>\n") {
  const relative = exportHtmlRelativePath(route);
  const absolute = join(outDir, relative);
  mkdirSync(join(absolute, ".."), { recursive: true });
  writeFileSync(absolute, html, "utf8");
}

describe("export-out-directory", () => {
  test("DEFAULT_EXPORT_OUT_DIR is out", () => {
    expect(DEFAULT_EXPORT_OUT_DIR).toBe("out");
  });

  test("exportHtmlRelativePath maps reader routes to directory index landings", () => {
    expect(exportHtmlRelativePath("/")).toBe("index.html");
    expect(exportHtmlRelativePath("/docs/architecture")).toBe(
      "docs/architecture/index.html",
    );
    expect(exportHtmlRelativePath("/tags/attention")).toBe(
      "tags/attention/index.html",
    );
  });

  test("exportHtmlRelativePath maps collection indexes to directory landings", () => {
    expect(exportHtmlRelativePath("/docs/factories")).toBe(
      "docs/factories/index.html",
    );
    expect(exportHtmlRelativePath("/docs/workers")).toBe(
      "docs/workers/index.html",
    );
    expect(exportHtmlRelativePath("/docs/workstations")).toBe(
      "docs/workstations/index.html",
    );
    expect(exportHtmlRelativePath("/docs/factories/")).toBe(
      "docs/factories/index.html",
    );
  });

  test("resolveExportHtmlFilePath joins outDir with the relative HTML path", () => {
    const cwd = "/tmp/project";
    expect(resolveExportHtmlFilePath("out", "/", cwd)).toBe(
      join(cwd, "out", "index.html"),
    );
    expect(resolveExportHtmlFilePath("out", "/docs/glossary", cwd)).toBe(
      join(cwd, "out", "docs", "glossary", "index.html"),
    );
  });

  test("stripBasePathFromExportHtml normalizes prefixed internal hrefs", () => {
    const html =
      '<a href="/you-agent-factory-docs/docs/glossary">Glossary</a><a href="/you-agent-factory-docs">Home</a>';
    expect(
      stripBasePathFromExportHtml(html, "/you-agent-factory-docs"),
    ).toContain('href="/docs/glossary"');
    expect(
      stripBasePathFromExportHtml(html, "/you-agent-factory-docs"),
    ).toContain('href="/"');
  });

  test("verifyExportOutDirectory accepts a non-empty index.html", () => {
    const dir = mkdtempSync(join(tmpdir(), "export-out-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, "index.html"), "<html></html>\n", "utf8");
    expect(verifyExportOutDirectory(dir, "/")).toEqual({ ok: true });
  });

  test("verifyExportOutDirectory rejects missing or empty export dirs", () => {
    const dir = mkdtempSync(join(tmpdir(), "export-out-missing-"));
    tempDirs.push(dir);
    expect(verifyExportOutDirectory(join(dir, "missing"), "/").ok).toBe(false);

    const emptyDir = mkdtempSync(join(tmpdir(), "export-out-empty-"));
    tempDirs.push(emptyDir);
    mkdirSync(emptyDir, { recursive: true });
    writeFileSync(join(emptyDir, "index.html"), "", "utf8");
    expect(verifyExportOutDirectory(emptyDir, "/").ok).toBe(false);
  });

  test("required directory landings cover factories, workers, workstations, and peers", () => {
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES).toContain(
      "/docs/factories",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES).toContain(
      "/docs/workers",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES).toContain(
      "/docs/workstations",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES).toContain(
      "/docs/guides",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES).toContain(
      "/docs/architecture",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES).not.toContain(
      "/docs/glossary",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES).toContain("/blog");
    expect([
      ...STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_RELATIVE_PATHS,
    ]).toEqual(
      STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES.map((route) =>
        exportHtmlRelativePath(route),
      ),
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_RELATIVE_PATHS).toContain(
      "docs/factories/index.html",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_RELATIVE_PATHS).toContain(
      "docs/workers/index.html",
    );
    expect(STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_RELATIVE_PATHS).toContain(
      "docs/workstations/index.html",
    );
  });

  test("verifyExportDirectoryLandings passes when all required landings exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "export-landings-ok-"));
    tempDirs.push(dir);
    for (const route of STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES) {
      writeLanding(dir, route);
    }
    expect(verifyExportDirectoryLandings(dir, "/")).toEqual({ ok: true });
  });

  test("verifyExportDirectoryLandings fails closed when any required landing is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "export-landings-missing-"));
    tempDirs.push(dir);
    for (const route of STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES) {
      if (route === "/docs/factories") {
        continue;
      }
      writeLanding(dir, route);
    }

    const result = verifyExportDirectoryLandings(dir, "/");
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected fail-closed missing factories landing");
    }
    expect(result.reason).toContain("docs/factories/index.html");

    // Flat-only HTML must not satisfy the directory-landing contract.
    writeFileSync(join(dir, "docs/factories.html"), "<html></html>\n", "utf8");
    const stillMissing = verifyExportDirectoryLandings(dir, "/");
    expect(stillMissing.ok).toBe(false);
    if (stillMissing.ok) {
      throw new Error("flat factories.html must not pass directory contract");
    }
    expect(stillMissing.reason).toContain("docs/factories/index.html");
  });
});
