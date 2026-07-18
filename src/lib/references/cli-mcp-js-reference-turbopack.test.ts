/**
 * Webpack-safe acquisition proofs for CLI / MCP / JavaScript runtime reference
 * resolvers. Asserts ancestor `node_modules` manifest resolution (not
 * `createRequire`) and readable generated artifact paths.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toApiPackageExportSpecifier } from "./api-package-public-exports";
import {
  CLI_REFERENCE_EXPORT_SPECIFIER,
  resolveCliReferenceExport,
  resolveCliReferenceFsPath,
} from "./cli-reference-turbopack";
import {
  JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER,
  resolveJavascriptRuntimeReferenceExport,
  resolveJavascriptRuntimeReferenceFsPath,
} from "./javascript-runtime-reference-turbopack";
import {
  MCP_REFERENCE_EXPORT_SPECIFIER,
  resolveMcpReferenceExport,
  resolveMcpReferenceFsPath,
} from "./mcp-reference-turbopack";

const MANIFEST_EXPORT_SPECIFIER = toApiPackageExportSpecifier("manifest");

describe("cli/mcp/js reference turbopack resolvers (webpack-safe)", () => {
  test("resolve readable filesystem paths via ancestor node_modules walk", () => {
    const cliPath = resolveCliReferenceFsPath();
    const mcpPath = resolveMcpReferenceFsPath();
    const jsPath = resolveJavascriptRuntimeReferenceFsPath();

    expect(cliPath).toMatch(/commands\.json$/);
    expect(mcpPath).toMatch(/tools\.json$/);
    expect(jsPath).toMatch(/runtime-api\.json$/);

    for (const path of [cliPath, mcpPath, jsPath]) {
      expect(Number.isFinite(Number(path))).toBe(false);
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, "utf8").length).toBeGreaterThan(0);
    }
  });

  test("resolveExport returns file: URLs for family artifacts and the manifest", () => {
    const cliUrl = resolveCliReferenceExport(CLI_REFERENCE_EXPORT_SPECIFIER);
    const mcpUrl = resolveMcpReferenceExport(MCP_REFERENCE_EXPORT_SPECIFIER);
    const jsUrl = resolveJavascriptRuntimeReferenceExport(
      JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER,
    );
    const manifestUrl = resolveCliReferenceExport(MANIFEST_EXPORT_SPECIFIER);

    for (const url of [cliUrl, mcpUrl, jsUrl, manifestUrl]) {
      expect(url.startsWith("file:")).toBe(true);
      expect(existsSync(fileURLToPath(url))).toBe(true);
    }
  });
});
