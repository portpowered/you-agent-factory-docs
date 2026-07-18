import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load as loadYaml } from "js-yaml";
import { countOpenApiOperations } from "./count-openapi-operations";
import {
  normalizeBundlerFsPath,
  OPENAPI_SPIKE_PACKAGE_EXPORT,
  resolveOpenApiArtifactPath,
} from "./resolve-openapi-artifact";

describe("W01 OpenAPI spike single-page route projection", () => {
  test("resolves OpenAPI from the installed package export, not a page-local fork", () => {
    const artifactPath = resolveOpenApiArtifactPath();
    expect(artifactPath).toContain("@you-agent-factory/api");
    expect(artifactPath.endsWith("openapi.yaml")).toBe(true);
    expect(artifactPath.includes("node_modules")).toBe(true);
    expect(OPENAPI_SPIKE_PACKAGE_EXPORT).toBe("@you-agent-factory/api/openapi");
  });

  test("normalizes Turbopack [project]/ virtual paths for fs reads", () => {
    const virtual =
      "[project]/node_modules/@you-agent-factory/api/generated/manifest.json";
    const normalized = normalizeBundlerFsPath(virtual);
    expect(normalized.startsWith(process.cwd())).toBe(true);
    expect(normalized.includes("[project]/")).toBe(false);
    expect(normalized.endsWith("generated/manifest.json")).toBe(true);
  });

  test("packaged OpenAPI artifact currently publishes 45 operations across 41 paths", () => {
    const artifactPath = resolveOpenApiArtifactPath();
    const document = loadYaml(readFileSync(artifactPath, "utf8")) as {
      paths?: Record<string, Record<string, unknown>>;
    };
    expect(Object.keys(document.paths ?? {}).length).toBe(41);
    expect(countOpenApiOperations(document)).toBe(45);
  });

  test('per:"file" projects every published operation onto exactly one virtual page', () => {
    // Run outside happy-dom: bun test preload breaks fumadocs-openapi's
    // json-schema-ref-parser via URL polyfills. Plain `bun` keeps Node URL/fs.
    const scriptPath = join(
      import.meta.dir,
      "assert-single-page-projection.ts",
    );
    const result = Bun.spawnSync({
      cmd: ["bun", scriptPath],
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    expect(result.exitCode).toBe(0);
    expect(stderr).toBe("");

    const payload = JSON.parse(stdout.trim()) as {
      ok: boolean;
      pageCount: number;
      pagePath: string;
      operationCount: number;
      document: string;
    };
    expect(payload.ok).toBe(true);
    expect(payload.pageCount).toBe(1);
    expect(payload.operationCount).toBe(45);
    expect(payload.pagePath).toContain("references-openapi-spike");
    expect(payload.document).toBe("you-agent-factory-api");
  });
});
