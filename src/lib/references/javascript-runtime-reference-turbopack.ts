/**
 * Turbopack-safe JavaScript runtime public-export resolution for Next.js
 * server/docs pages.
 *
 * Next/Turbopack does not expose `import.meta.resolve` the same way Bun does.
 * Resolve the package `manifest` JSON export via `createRequire`, then join to
 * `javascript/runtime-api.json` beside it under `generated/` — same pattern as
 * the CLI and MCP reference Turbopack helpers.
 *
 * Still feeds W03 `resolveApiPackageArtifact` via the injectable `resolveExport`
 * dependency — never bypasses public-subpath validation.
 */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ApiPackageArtifactResolverDependencies } from "./api-package-artifact-resolver";
import { toApiPackageExportSpecifier } from "./api-package-public-exports";

const require = createRequire(import.meta.url);
const TURBOPACK_PROJECT_PREFIX = "[project]/";

/** Path relative to the package `generated/` directory (where `manifest.json` lives). */
export const JAVASCRIPT_RUNTIME_REFERENCE_GENERATED_RELATIVE_PATH =
  "javascript/runtime-api.json" as const;

export const JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH =
  "javascript/runtime" as const;

export const JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER =
  toApiPackageExportSpecifier(JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH);

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeJavascriptRuntimeReferenceFsPath(
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
 * Absolute filesystem path for the packaged JavaScript runtime JSON, resolved
 * through the package manifest (avoids Turbopack `import.meta.resolve` gaps).
 */
export function resolveJavascriptRuntimeReferenceFsPath(): string {
  const manifestPath = normalizeJavascriptRuntimeReferenceFsPath(
    require.resolve("@you-agent-factory/api/manifest"),
  );
  const generatedDir = dirname(manifestPath);
  const absolutePath = join(
    generatedDir,
    JAVASCRIPT_RUNTIME_REFERENCE_GENERATED_RELATIVE_PATH,
  );
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Packaged JavaScript runtime artifact missing at ${absolutePath} (from ${JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER} via manifest ${manifestPath}).`,
    );
  }

  const packageJsonPath = join(generatedDir, "..", "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      exports?: Record<string, string>;
    };
    const jsExport = packageJson.exports?.["./javascript/runtime"];
    if (
      jsExport !== undefined &&
      jsExport !==
        `./generated/${JAVASCRIPT_RUNTIME_REFERENCE_GENERATED_RELATIVE_PATH}`
    ) {
      throw new Error(
        `@you-agent-factory/api exports["./javascript/runtime"] is ${JSON.stringify(jsExport)}; expected "./generated/${JAVASCRIPT_RUNTIME_REFERENCE_GENERATED_RELATIVE_PATH}".`,
      );
    }
  }

  return absolutePath;
}

/**
 * Resolve `@you-agent-factory/api/javascript/runtime` to a `file:` URL under
 * Next/Turbopack.
 */
export function resolveJavascriptRuntimeReferenceExport(
  specifier: string = JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER,
): string {
  if (specifier !== JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER) {
    throw new Error(
      `JavaScript runtime reference Turbopack resolver only accepts "${JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER}", got "${specifier}".`,
    );
  }
  return pathToFileURL(resolveJavascriptRuntimeReferenceFsPath()).href;
}

/**
 * W03 resolve dependencies that work inside Next/Turbopack server pages.
 */
export function javascriptRuntimeReferenceTurbopackLoadDependencies(): ApiPackageArtifactResolverDependencies {
  return {
    resolveExport: resolveJavascriptRuntimeReferenceExport,
  };
}
