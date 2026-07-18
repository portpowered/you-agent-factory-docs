/**
 * Webpack-/Turbopack-safe OpenAPI public-export resolution for Next.js
 * server/docs pages (published `/docs/references/api` success path).
 *
 * Do not use `createRequire(...).resolve("@you-agent-factory/api/manifest")` —
 * under Next/Turbopack that resolve can return a virtual `[externals]/...`
 * path that `normalizeApiOpenApiBundlerFsPath` cannot rewrite (it only handles
 * `[project]/`). Locate the installed package via the shared ancestor
 * `node_modules` walk (`resolveApiPackageManifestFsPath`), then join to
 * `openapi/openapi.yaml` beside the manifest under `generated/`.
 *
 * Still feeds W03 `resolveApiPackageArtifact` / `loadApiOpenApiArtifact` via
 * the injectable `resolveExport` dependency — never bypasses public-subpath
 * validation. Page wiring only; does not edit W08 renderer internals.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ApiPackageArtifactResolverDependencies } from "./api-package-artifact-resolver";
import { toApiPackageExportSpecifier } from "./api-package-public-exports";
import { resolveApiPackageManifestFsPath } from "./load-schema-verification-models";

const TURBOPACK_PROJECT_PREFIX = "[project]/";

/** Path relative to the package `generated/` directory (where `manifest.json` lives). */
export const API_OPENAPI_GENERATED_RELATIVE_PATH =
  "openapi/openapi.yaml" as const;

export const API_OPENAPI_PUBLIC_SUBPATH = "openapi" as const;

export const API_OPENAPI_EXPORT_SPECIFIER = toApiPackageExportSpecifier(
  API_OPENAPI_PUBLIC_SUBPATH,
);

const MANIFEST_EXPORT_SPECIFIER = toApiPackageExportSpecifier("manifest");

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeApiOpenApiTurbopackFsPath(
  resolvedPath: string,
): string {
  if (resolvedPath.startsWith(TURBOPACK_PROJECT_PREFIX)) {
    return join(
      process.cwd(),
      resolvedPath.slice(TURBOPACK_PROJECT_PREFIX.length),
    );
  }
  return resolvedPath;
}

/**
 * Absolute filesystem path for the packaged OpenAPI YAML, resolved through
 * the package manifest via ancestor `node_modules` lookup (webpack-safe).
 */
export function resolveApiOpenApiTurbopackFsPath(
  startDir: string = process.cwd(),
): string {
  const manifestPath = normalizeApiOpenApiTurbopackFsPath(
    resolveApiPackageManifestFsPath(startDir),
  );
  const generatedDir = dirname(manifestPath);
  const absolutePath = join(generatedDir, API_OPENAPI_GENERATED_RELATIVE_PATH);
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Packaged OpenAPI artifact missing at ${absolutePath} (from ${API_OPENAPI_EXPORT_SPECIFIER} via manifest ${manifestPath}).`,
    );
  }

  const packageJsonPath = join(generatedDir, "..", "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      exports?: Record<string, string>;
    };
    const openapiExport = packageJson.exports?.["./openapi"];
    if (
      openapiExport !== undefined &&
      openapiExport !== `./generated/${API_OPENAPI_GENERATED_RELATIVE_PATH}`
    ) {
      throw new Error(
        `@you-agent-factory/api exports["./openapi"] is ${JSON.stringify(openapiExport)}; expected "./generated/${API_OPENAPI_GENERATED_RELATIVE_PATH}".`,
      );
    }
  }

  return absolutePath;
}

/**
 * Resolve `@you-agent-factory/api/openapi` (or the package manifest) to a
 * `file:` URL under Next/webpack.
 */
export function resolveApiOpenApiTurbopackExport(
  specifier: string = API_OPENAPI_EXPORT_SPECIFIER,
): string {
  if (specifier === MANIFEST_EXPORT_SPECIFIER) {
    return pathToFileURL(resolveApiPackageManifestFsPath()).href;
  }
  if (specifier !== API_OPENAPI_EXPORT_SPECIFIER) {
    throw new Error(
      `API OpenAPI Turbopack resolver only accepts "${API_OPENAPI_EXPORT_SPECIFIER}" or "${MANIFEST_EXPORT_SPECIFIER}", got "${specifier}".`,
    );
  }
  return pathToFileURL(resolveApiOpenApiTurbopackFsPath()).href;
}

/**
 * W03 resolve dependencies that work inside Next/webpack server pages.
 */
export function apiOpenApiTurbopackLoadDependencies(): ApiPackageArtifactResolverDependencies {
  return {
    resolveExport: resolveApiOpenApiTurbopackExport,
  };
}
