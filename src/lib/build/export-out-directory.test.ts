import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
  resolveExportHtmlFilePath,
  stripBasePathFromExportHtml,
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

describe("export-out-directory", () => {
  test("DEFAULT_EXPORT_OUT_DIR is out", () => {
    expect(DEFAULT_EXPORT_OUT_DIR).toBe("out");
  });

  test("exportHtmlRelativePath maps reader routes to out/ HTML files", () => {
    expect(exportHtmlRelativePath("/")).toBe("index.html");
    expect(exportHtmlRelativePath("/docs/architecture")).toBe(
      "docs/architecture.html",
    );
    expect(exportHtmlRelativePath("/tags/attention")).toBe(
      "tags/attention.html",
    );
  });

  test("resolveExportHtmlFilePath joins outDir with the relative HTML path", () => {
    const cwd = "/tmp/project";
    expect(resolveExportHtmlFilePath("out", "/", cwd)).toBe(
      join(cwd, "out", "index.html"),
    );
    expect(resolveExportHtmlFilePath("out", "/docs/glossary", cwd)).toBe(
      join(cwd, "out", "docs", "glossary.html"),
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
});
