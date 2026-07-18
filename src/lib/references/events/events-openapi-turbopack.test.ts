/**
 * Webpack-safe events OpenAPI acquisition proofs. Asserts ancestor
 * `node_modules` manifest resolution (not `createRequire`) and a readable
 * `openapi/openapi.yaml` path — required once W16 search loads the events
 * corpus during static-export catalog build.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toApiPackageExportSpecifier } from "@/lib/references/api-package-public-exports";
import {
  EVENTS_OPENAPI_EXPORT,
  resolveEventsOpenApiExport,
  resolveEventsOpenApiFsPath,
} from "@/lib/references/events";

const MANIFEST_EXPORT_SPECIFIER = toApiPackageExportSpecifier("manifest");

describe("events openapi turbopack resolver (webpack-safe)", () => {
  test("resolve readable OpenAPI filesystem path via ancestor node_modules walk", () => {
    const openapiPath = resolveEventsOpenApiFsPath();

    expect(openapiPath).toMatch(/openapi\.yaml$/);
    expect(existsSync(openapiPath)).toBe(true);
    expect(readFileSync(openapiPath, "utf8")).toMatch(/openapi:\s*["']?3\./);
    expect(openapiPath.includes("[externals]/")).toBe(false);
    expect(openapiPath.includes("[project]/")).toBe(false);
  });

  test("resolveExport returns file: URLs for openapi and the manifest", () => {
    const openapiUrl = resolveEventsOpenApiExport(EVENTS_OPENAPI_EXPORT);
    const manifestUrl = resolveEventsOpenApiExport(MANIFEST_EXPORT_SPECIFIER);

    for (const url of [openapiUrl, manifestUrl]) {
      expect(url.startsWith("file:")).toBe(true);
      expect(existsSync(fileURLToPath(url))).toBe(true);
    }
  });
});
