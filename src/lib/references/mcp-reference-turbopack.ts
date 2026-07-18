/**
 * Webpack-/Turbopack-safe MCP public-export resolution for Next.js server/docs
 * pages.
 *
 * Do not use `createRequire(...).resolve("@you-agent-factory/api/manifest")` —
 * webpack production server chunks stub `createRequire` with a MODULE_NOT_FOUND
 * resolver. Locate the installed package via the shared ancestor `node_modules`
 * walk (`resolveApiPackageManifestFsPath`), then join to `mcp/tools.json`
 * beside the manifest under `generated/`.
 *
 * Still feeds W03 `resolveApiPackageArtifact` via the injectable `resolveExport`
 * dependency — never bypasses public-subpath validation.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ApiPackageArtifactResolverDependencies } from "./api-package-artifact-resolver";
import { toApiPackageExportSpecifier } from "./api-package-public-exports";
import { resolveApiPackageManifestFsPath } from "./load-schema-verification-models";

const TURBOPACK_PROJECT_PREFIX = "[project]/";

/** Path relative to the package `generated/` directory (where `manifest.json` lives). */
export const MCP_REFERENCE_GENERATED_RELATIVE_PATH = "mcp/tools.json" as const;

export const MCP_REFERENCE_PUBLIC_SUBPATH = "mcp" as const;

export const MCP_REFERENCE_EXPORT_SPECIFIER = toApiPackageExportSpecifier(
  MCP_REFERENCE_PUBLIC_SUBPATH,
);

const MANIFEST_EXPORT_SPECIFIER = toApiPackageExportSpecifier("manifest");

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeMcpReferenceFsPath(resolvedPath: string): string {
  if (resolvedPath.startsWith(TURBOPACK_PROJECT_PREFIX)) {
    return join(
      process.cwd(),
      resolvedPath.slice(TURBOPACK_PROJECT_PREFIX.length),
    );
  }
  return resolvedPath;
}

/**
 * Absolute filesystem path for the packaged MCP tools JSON, resolved through
 * the package manifest via ancestor `node_modules` lookup (webpack-safe).
 */
export function resolveMcpReferenceFsPath(
  startDir: string = process.cwd(),
): string {
  const manifestPath = normalizeMcpReferenceFsPath(
    resolveApiPackageManifestFsPath(startDir),
  );
  const generatedDir = dirname(manifestPath);
  const absolutePath = join(
    generatedDir,
    MCP_REFERENCE_GENERATED_RELATIVE_PATH,
  );
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Packaged MCP artifact missing at ${absolutePath} (from ${MCP_REFERENCE_EXPORT_SPECIFIER} via manifest ${manifestPath}).`,
    );
  }

  const packageJsonPath = join(generatedDir, "..", "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      exports?: Record<string, string>;
    };
    const mcpExport = packageJson.exports?.["./mcp"];
    if (
      mcpExport !== undefined &&
      mcpExport !== `./generated/${MCP_REFERENCE_GENERATED_RELATIVE_PATH}`
    ) {
      throw new Error(
        `@you-agent-factory/api exports["./mcp"] is ${JSON.stringify(mcpExport)}; expected "./generated/${MCP_REFERENCE_GENERATED_RELATIVE_PATH}".`,
      );
    }
  }

  return absolutePath;
}

/**
 * Resolve `@you-agent-factory/api/mcp` (or the package manifest) to a `file:`
 * URL under Next/webpack.
 */
export function resolveMcpReferenceExport(
  specifier: string = MCP_REFERENCE_EXPORT_SPECIFIER,
): string {
  if (specifier === MANIFEST_EXPORT_SPECIFIER) {
    return pathToFileURL(resolveApiPackageManifestFsPath()).href;
  }
  if (specifier !== MCP_REFERENCE_EXPORT_SPECIFIER) {
    throw new Error(
      `MCP reference Turbopack resolver only accepts "${MCP_REFERENCE_EXPORT_SPECIFIER}" or "${MANIFEST_EXPORT_SPECIFIER}", got "${specifier}".`,
    );
  }
  return pathToFileURL(resolveMcpReferenceFsPath()).href;
}

/**
 * W03 resolve dependencies that work inside Next/webpack server pages.
 */
export function mcpReferenceTurbopackLoadDependencies(): ApiPackageArtifactResolverDependencies {
  return {
    resolveExport: resolveMcpReferenceExport,
  };
}
