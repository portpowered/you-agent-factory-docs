/**
 * Turbopack-safe CLI public-export resolution for Next.js server/docs pages.
 *
 * Next/Turbopack does not expose `import.meta.resolve` the same way Bun does.
 * Resolve the package `manifest` JSON export via `createRequire`, then join to
 * `cli/commands.json` beside it under `generated/` — same pattern as W07 schema
 * verification and W09 events OpenAPI Turbopack helpers.
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
export const CLI_REFERENCE_GENERATED_RELATIVE_PATH =
  "cli/commands.json" as const;

export const CLI_REFERENCE_PUBLIC_SUBPATH = "cli" as const;

export const CLI_REFERENCE_EXPORT_SPECIFIER = toApiPackageExportSpecifier(
  CLI_REFERENCE_PUBLIC_SUBPATH,
);

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeCliReferenceFsPath(resolvedPath: string): string {
  if (resolvedPath.startsWith(TURBOPACK_PROJECT_PREFIX)) {
    return join(
      process.cwd(),
      resolvedPath.slice(TURBOPACK_PROJECT_PREFIX.length),
    );
  }
  return resolvedPath;
}

/**
 * Absolute filesystem path for the packaged CLI commands JSON, resolved through
 * the package manifest (avoids Turbopack `import.meta.resolve` gaps).
 */
export function resolveCliReferenceFsPath(): string {
  const manifestPath = normalizeCliReferenceFsPath(
    require.resolve("@you-agent-factory/api/manifest"),
  );
  const generatedDir = dirname(manifestPath);
  const absolutePath = join(
    generatedDir,
    CLI_REFERENCE_GENERATED_RELATIVE_PATH,
  );
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Packaged CLI artifact missing at ${absolutePath} (from ${CLI_REFERENCE_EXPORT_SPECIFIER} via manifest ${manifestPath}).`,
    );
  }

  const packageJsonPath = join(generatedDir, "..", "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      exports?: Record<string, string>;
    };
    const cliExport = packageJson.exports?.["./cli"];
    if (
      cliExport !== undefined &&
      cliExport !== `./generated/${CLI_REFERENCE_GENERATED_RELATIVE_PATH}`
    ) {
      throw new Error(
        `@you-agent-factory/api exports["./cli"] is ${JSON.stringify(cliExport)}; expected "./generated/${CLI_REFERENCE_GENERATED_RELATIVE_PATH}".`,
      );
    }
  }

  return absolutePath;
}

/**
 * Resolve `@you-agent-factory/api/cli` to a `file:` URL under Next/Turbopack.
 */
export function resolveCliReferenceExport(
  specifier: string = CLI_REFERENCE_EXPORT_SPECIFIER,
): string {
  if (specifier !== CLI_REFERENCE_EXPORT_SPECIFIER) {
    throw new Error(
      `CLI reference Turbopack resolver only accepts "${CLI_REFERENCE_EXPORT_SPECIFIER}", got "${specifier}".`,
    );
  }
  return pathToFileURL(resolveCliReferenceFsPath()).href;
}

/**
 * W03 resolve dependencies that work inside Next/Turbopack server pages.
 */
export function cliReferenceTurbopackLoadDependencies(): ApiPackageArtifactResolverDependencies {
  return {
    resolveExport: resolveCliReferenceExport,
  };
}
