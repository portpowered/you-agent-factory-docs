import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { exportHtmlRelativePath } from "@/lib/build/export-out-directory";
import {
  evaluateStaticExportConvergence,
  listW20StaticExportCoveredFamilies,
  W20_STATIC_EXPORT_COMMAND_GATES,
  W20_STATIC_EXPORT_FORBIDDEN_PROXY_SEGMENTS,
  W20_STATIC_EXPORT_POST_COMMAND_SUITE_PATHS,
  W20_STATIC_EXPORT_REQUIRED_FAMILIES,
  W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES,
  W20_STATIC_EXPORT_REQUIRED_TEST_PATHS,
  W20_STATIC_EXPORT_SUITE_COMMAND,
  W20_STATIC_EXPORT_SUITE_ENTRIES,
} from "./w20-static-export-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 static-export convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_STATIC_EXPORT_SUITE_COMMAND).toBe("make test-w20-static-export");
  });

  test("lists the make build command gate", () => {
    expect(W20_STATIC_EXPORT_COMMAND_GATES.length).toBeGreaterThan(0);

    const makeTargets = W20_STATIC_EXPORT_COMMAND_GATES.map(
      (gate) => gate.makeTarget,
    );
    expect(makeTargets).toContain("build");

    const packageScripts = W20_STATIC_EXPORT_COMMAND_GATES.map(
      (gate) => gate.packageScript,
    );
    expect(packageScripts).toContain("build:export");
  });

  test("lists a non-empty set of existing static-export suite files", () => {
    expect(W20_STATIC_EXPORT_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_STATIC_EXPORT_REQUIRED_TEST_PATHS.length).toBe(
      W20_STATIC_EXPORT_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_STATIC_EXPORT_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_STATIC_EXPORT_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required static-export gate family", () => {
    const covered = listW20StaticExportCoveredFamilies();
    expect(covered).toEqual([...W20_STATIC_EXPORT_REQUIRED_FAMILIES].sort());

    for (const family of W20_STATIC_EXPORT_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("catalogues representative routes for every FR-33 family", () => {
    const families = new Set(
      W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES.map((probe) => probe.family),
    );
    expect([...families].sort()).toEqual([
      "api",
      "cli",
      "events",
      "factory",
      "javascript",
      "mcp",
      "schema",
      "worker",
      "workstation",
    ]);

    expect(W20_STATIC_EXPORT_POST_COMMAND_SUITE_PATHS).toContain(
      "src/lib/verify/w20-static-export-out-verify.test.ts",
    );
  });

  test("forbids the established API proxy route segments", () => {
    expect(W20_STATIC_EXPORT_FORBIDDEN_PROXY_SEGMENTS).toEqual([
      "api/proxy",
      "api/openapi-proxy",
      "api/references-api-proxy",
    ]);
  });
});

describe("evaluateStaticExportConvergence", () => {
  test("fails closed when out/ is missing", () => {
    const cwd = join(repoRoot, ".tmp-w20-static-export-missing");
    rmSync(cwd, { recursive: true, force: true });
    mkdirSync(cwd, { recursive: true });

    const result = evaluateStaticExportConvergence("out", cwd);
    expect(result.ok).toBe(false);
    expect(
      result.reasons.some((reason) => /Missing export directory/.test(reason)),
    ).toBe(true);

    rmSync(cwd, { recursive: true, force: true });
  });

  test("passes a fixture out/ that embeds corpus + no-host markers", () => {
    const cwd = join(repoRoot, ".tmp-w20-static-export-fixture");
    rmSync(cwd, { recursive: true, force: true });
    const outDir = join(cwd, "out");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "index.html"),
      `<!doctype html><html><body>${"x".repeat(600)}</body></html>`,
    );

    for (const probe of W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES) {
      const relative = exportHtmlRelativePath(probe.path);
      const absolute = join(outDir, relative);
      mkdirSync(join(absolute, ".."), { recursive: true });
      const markers = [...probe.corpusMarkers, ...probe.noHostMarkers];
      const body = markers.map((marker) => `<div ${marker}></div>`).join("");
      writeFileSync(
        absolute,
        `<!doctype html><html><body>${body}${"y".repeat(600)}</body></html>`,
      );
    }

    const result = evaluateStaticExportConvergence("out", cwd);
    expect(result.ok).toBe(true);
    expect(result.routeChecks.every((check) => check.ok)).toBe(true);
    expect(result.forbiddenProxyHits).toEqual([]);

    rmSync(cwd, { recursive: true, force: true });
  });

  test("fails when a forbidden proxy route is exported", () => {
    const cwd = join(repoRoot, ".tmp-w20-static-export-proxy");
    rmSync(cwd, { recursive: true, force: true });
    const outDir = join(cwd, "out");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "index.html"),
      `<!doctype html><html><body>${"x".repeat(600)}</body></html>`,
    );

    for (const probe of W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES) {
      const relative = exportHtmlRelativePath(probe.path);
      const absolute = join(outDir, relative);
      mkdirSync(join(absolute, ".."), { recursive: true });
      const markers = [...probe.corpusMarkers, ...probe.noHostMarkers];
      const body = markers.map((marker) => `<div ${marker}></div>`).join("");
      writeFileSync(
        absolute,
        `<!doctype html><html><body>${body}${"y".repeat(600)}</body></html>`,
      );
    }

    mkdirSync(join(outDir, "api"), { recursive: true });
    writeFileSync(join(outDir, "api/proxy.html"), "<html>proxy</html>");

    const result = evaluateStaticExportConvergence("out", cwd);
    expect(result.ok).toBe(false);
    expect(result.forbiddenProxyHits.length).toBeGreaterThan(0);

    rmSync(cwd, { recursive: true, force: true });
  });
});
