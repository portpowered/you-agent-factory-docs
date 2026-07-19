import { describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportHtmlRelativePath } from "@/lib/build/export-out-directory";
import {
  collectStaticExportContractedSurfaceDigests,
  STATIC_EXPORT_DETERMINISM_HTML_RELATIVE_PATHS,
  serializeContractedSurfaceDigests,
} from "@/lib/build/static-export-contracted-export-surfaces";
import { evaluateStaticExportDeterminism } from "@/lib/build/static-export-optimization-evidence";

function writeDirectoryLanding(
  outDir: string,
  route: string,
  html: string,
): void {
  const relative = exportHtmlRelativePath(route);
  const absolute = join(outDir, relative);
  mkdirSync(join(absolute, ".."), { recursive: true });
  writeFileSync(absolute, html);
}

describe("static-export-contracted-export-surfaces", () => {
  test("determinism HTML paths use trailing-slash directory landings", () => {
    expect([...STATIC_EXPORT_DETERMINISM_HTML_RELATIVE_PATHS]).toEqual([
      "index.html",
      "blog/index.html",
      "docs/guides/index.html",
    ]);
  });

  test("collects bootstrap hashes and HTML contract digests", () => {
    const root = join(
      tmpdir(),
      `static-export-contracted-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    mkdirSync(join(root, "api"), { recursive: true });

    writeFileSync(join(root, "api/search"), '{"type":"advanced"}');
    writeDirectoryLanding(
      root,
      "/",
      '<html><link href="/you-agent-factory-docs/_next/static/css/a.css"/></html>',
    );
    writeDirectoryLanding(
      root,
      "/blog",
      '<html><script src="/you-agent-factory-docs/_next/static/chunks/a.js"></script></html>',
    );
    writeDirectoryLanding(
      root,
      "/docs/guides",
      '<html><link href="/you-agent-factory-docs/_next/static/css/b.css"/></html>',
    );

    try {
      const first = collectStaticExportContractedSurfaceDigests({
        outDir: root,
        basePath: "/you-agent-factory-docs",
      });
      const second = collectStaticExportContractedSurfaceDigests({
        outDir: root,
        basePath: "/you-agent-factory-docs",
      });

      expect(first.digests["bootstrap:api/search"]).toMatch(/^[a-f0-9]{64}$/);
      expect(first.digests["html-contract:index.html"]).toMatch(
        /^[a-f0-9]{64}$/,
      );
      expect(first.digests["html-contract:blog/index.html"]).toMatch(
        /^[a-f0-9]{64}$/,
      );
      expect(first.digests["html-contract:docs/guides/index.html"]).toMatch(
        /^[a-f0-9]{64}$/,
      );
      expect(
        evaluateStaticExportDeterminism({
          firstDigests: serializeContractedSurfaceDigests(first),
          secondDigests: serializeContractedSurfaceDigests(second),
        }).passes,
      ).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("detects bootstrap drift between two out directories", () => {
    const a = join(
      tmpdir(),
      `static-export-a-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    const b = join(
      tmpdir(),
      `static-export-b-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    mkdirSync(join(a, "api"), { recursive: true });
    mkdirSync(join(b, "api"), { recursive: true });

    const html =
      '<html><link href="/you-agent-factory-docs/_next/static/css/a.css"/></html>';
    writeFileSync(join(a, "api/search"), '{"v":1}');
    writeFileSync(join(b, "api/search"), '{"v":2}');
    for (const root of [a, b]) {
      writeDirectoryLanding(root, "/", html);
      writeDirectoryLanding(root, "/blog", html);
      writeDirectoryLanding(root, "/docs/guides", html);
    }

    try {
      const first = collectStaticExportContractedSurfaceDigests({ outDir: a });
      const second = collectStaticExportContractedSurfaceDigests({ outDir: b });
      const result = evaluateStaticExportDeterminism({
        firstDigests: serializeContractedSurfaceDigests(first),
        secondDigests: serializeContractedSurfaceDigests(second),
      });
      expect(result.passes).toBe(false);
      expect(result.mismatchPaths).toContain("bootstrap:api/search");
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });
});
