/**
 * Webpack-safe OpenAPI acquisition proofs for the published API reference
 * page. Asserts ancestor `node_modules` manifest resolution (not
 * `createRequire`) and a readable `openapi/openapi.yaml` path.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  API_OPENAPI_EXPORT_SPECIFIER,
  resolveApiOpenApiTurbopackExport,
  resolveApiOpenApiTurbopackFsPath,
} from "./api-openapi-turbopack";
import { toApiPackageExportSpecifier } from "./api-package-public-exports";

const MANIFEST_EXPORT_SPECIFIER = toApiPackageExportSpecifier("manifest");

describe("api openapi turbopack resolver (webpack-safe)", () => {
  test("resolve readable OpenAPI filesystem path via ancestor node_modules walk", () => {
    const openapiPath = resolveApiOpenApiTurbopackFsPath();

    expect(openapiPath).toMatch(/openapi\.yaml$/);
    expect(existsSync(openapiPath)).toBe(true);
    expect(readFileSync(openapiPath, "utf8")).toMatch(/openapi:\s*["']?3\./);
    expect(openapiPath.includes("[externals]/")).toBe(false);
    expect(openapiPath.includes("[project]/")).toBe(false);
  });

  test("resolveExport returns file: URLs for openapi and the manifest", () => {
    const openapiUrl = resolveApiOpenApiTurbopackExport(
      API_OPENAPI_EXPORT_SPECIFIER,
    );
    const manifestUrl = resolveApiOpenApiTurbopackExport(
      MANIFEST_EXPORT_SPECIFIER,
    );

    for (const url of [openapiUrl, manifestUrl]) {
      expect(url.startsWith("file:")).toBe(true);
      expect(existsSync(fileURLToPath(url))).toBe(true);
    }
  });
});
