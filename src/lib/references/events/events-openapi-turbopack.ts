/**
 * Webpack-/Turbopack-safe OpenAPI export resolution for Next.js server pages
 * (events corpus + W16 search projection that loads it during catalog build).
 *
 * Do not use `createRequire(...).resolve("@you-agent-factory/api/manifest")` —
 * webpack production server chunks stub `createRequire` so `.resolve` can return
 * a non-string module id (`TypeError: ….startsWith is not a function`). Locate
 * the installed package via the shared ancestor `node_modules` walk
 * (`resolveApiPackageManifestFsPath`), then join to `openapi/openapi.yaml`
 * beside the manifest under `generated/` — same pattern as
 * `api-openapi-turbopack.ts` / W07 schema loaders.
 *
 * Still feeds W03 `resolveApiPackageArtifact` / `loadEventsOpenApi` via the
 * injectable `resolveExport` dependency — never bypasses public-subpath
 * validation.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { toApiPackageExportSpecifier } from "@/lib/references/api-package-public-exports";
import { resolveApiPackageManifestFsPath } from "@/lib/references/load-schema-verification-models";
import type { LoadEventsOpenApiDependencies } from "./load-events-openapi";
import { EVENTS_OPENAPI_EXPORT } from "./stream-operations";

const TURBOPACK_PROJECT_PREFIX = "[project]/";

const MANIFEST_EXPORT_SPECIFIER = toApiPackageExportSpecifier("manifest");

/**
 * Path relative to the package `generated/` directory (where `manifest.json`
 * lives). Package `exports["./openapi"]` is `./generated/openapi/openapi.yaml`.
 */
export const EVENTS_OPENAPI_GENERATED_RELATIVE_PATH =
  "openapi/openapi.yaml" as const;

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeEventsOpenApiFsPath(resolvedPath: string): string {
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
 *
 * Manifest resolves to `.../generated/manifest.json`; OpenAPI sits beside it at
 * `.../generated/openapi/openapi.yaml` (do not re-prefix `generated/`).
 */
export function resolveEventsOpenApiFsPath(
  startDir: string = process.cwd(),
): string {
  const manifestPath = normalizeEventsOpenApiFsPath(
    resolveApiPackageManifestFsPath(startDir),
  );
  const generatedDir = dirname(manifestPath);
  const absolutePath = join(
    generatedDir,
    EVENTS_OPENAPI_GENERATED_RELATIVE_PATH,
  );
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Packaged OpenAPI artifact missing at ${absolutePath} (from ${EVENTS_OPENAPI_EXPORT} via manifest ${manifestPath}).`,
    );
  }

  // Soft sanity check: package export still points at the same relative file.
  const packageJsonPath = join(generatedDir, "..", "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      exports?: Record<string, string>;
    };
    const openapiExport = packageJson.exports?.["./openapi"];
    if (
      openapiExport !== undefined &&
      openapiExport !== `./generated/${EVENTS_OPENAPI_GENERATED_RELATIVE_PATH}`
    ) {
      throw new Error(
        `@you-agent-factory/api exports["./openapi"] is ${JSON.stringify(openapiExport)}; expected "./generated/${EVENTS_OPENAPI_GENERATED_RELATIVE_PATH}".`,
      );
    }
  }

  return absolutePath;
}

/**
 * Resolve `@you-agent-factory/api/openapi` (or the package manifest) to a
 * `file:` URL under Next/webpack.
 */
export function resolveEventsOpenApiExport(
  specifier: string = EVENTS_OPENAPI_EXPORT,
): string {
  if (specifier === MANIFEST_EXPORT_SPECIFIER) {
    return pathToFileURL(resolveApiPackageManifestFsPath()).href;
  }
  if (specifier !== EVENTS_OPENAPI_EXPORT) {
    throw new Error(
      `Events OpenAPI Turbopack resolver only accepts "${EVENTS_OPENAPI_EXPORT}" or "${MANIFEST_EXPORT_SPECIFIER}", got "${specifier}".`,
    );
  }
  return pathToFileURL(resolveEventsOpenApiFsPath()).href;
}

/**
 * W03 load dependencies that work inside Next/webpack server pages.
 * Supplies both webpack-safe export resolution and a portable YAML parser
 * (`yaml` package) because `Bun.YAML` is unavailable under Next's Node server.
 */
export function eventsOpenApiTurbopackLoadDependencies(): LoadEventsOpenApiDependencies {
  return {
    resolveExport: resolveEventsOpenApiExport,
    parseYaml: (text) => parseYaml(text),
  };
}
