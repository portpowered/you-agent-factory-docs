/**
 * Server/build helper: acquire the three W03 public schema subpaths and
 * normalize them into W04 models for the W07 verification harness.
 *
 * Do not import from client/browser UI bundles — depends on Node package
 * resolution via `resolveApiPackageArtifact`.
 *
 * Next/bundler notes:
 * - Do not `require.resolve` / `import` JSON schema exports directly —
 *   Turbopack/webpack rewrite them into non-readable virtual module ids.
 * - Do not rely on `createRequire(...).resolve("@you-agent-factory/api/manifest")`
 *   either — webpack production server chunks stub `createRequire` with a
 *   MODULE_NOT_FOUND resolver. Locate the installed package via ancestor
 *   `node_modules` filesystem walk (same class of approach as the SSE spike
 *   packaged-OpenAPI loader), then join to `generated/schemas/<name>.schema.json`.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveApiPackageArtifact } from "./api-package-artifact-resolver";
import { toApiPackageExportSpecifier } from "./api-package-public-exports";
import {
  type NormalizedJsonSchemaArtifact,
  normalizeJsonSchemaArtifact,
  SCHEMA_VERIFICATION_PUBLIC_SUBPATHS,
  type SchemaVerificationPublicSubpath,
} from "./normalize-json-schema-artifact";
import type { SchemaDefinitionModel } from "./schema-model";

const API_PACKAGE_NAME = "@you-agent-factory/api";
const MANIFEST_RELATIVE_PATH = join("generated", "manifest.json");
const TURBOPACK_PROJECT_PREFIX = "[project]/";

export type SchemaVerificationPackageModel = {
  subpath: SchemaVerificationPublicSubpath;
  specifier: string;
  root: SchemaDefinitionModel;
  definitions: SchemaDefinitionModel[];
};

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeSchemaVerificationFsPath(
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

function schemaFileName(subpath: SchemaVerificationPublicSubpath): string {
  switch (subpath) {
    case "schemas/factory":
      return "factory.schema.json";
    case "schemas/you-config":
      return "you-config.schema.json";
    case "schemas/mock-workers":
      return "mock-workers.schema.json";
    default: {
      const _exhaustive: never = subpath;
      throw new Error(
        `Unsupported schema verification subpath: ${_exhaustive}`,
      );
    }
  }
}

/**
 * Walk ancestors from `startDir` for `node_modules/@you-agent-factory/api`.
 * Supports worktree checkouts that hoist dependencies to a parent repo root.
 */
export function findInstalledApiPackageRoot(
  startDir: string = process.cwd(),
): string {
  let dir = startDir;
  for (;;) {
    const packageJsonPath = join(
      dir,
      "node_modules",
      API_PACKAGE_NAME,
      "package.json",
    );
    if (existsSync(packageJsonPath)) {
      return dirname(packageJsonPath);
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error(
    `Installed ${API_PACKAGE_NAME} package.json not found walking up from ${startDir}. Run bun install.`,
  );
}

/**
 * Resolve the package manifest JSON export to a real filesystem path.
 *
 * Uses ancestor `node_modules` lookup instead of `createRequire().resolve`,
 * which webpack stubs in production server chunks.
 */
export function resolveApiPackageManifestFsPath(
  startDir: string = process.cwd(),
): string {
  const packageRoot = findInstalledApiPackageRoot(startDir);
  const manifestPath = join(packageRoot, MANIFEST_RELATIVE_PATH);
  if (!existsSync(manifestPath)) {
    throw new Error(
      `Packaged API manifest missing at ${manifestPath} (from ${API_PACKAGE_NAME}).`,
    );
  }
  return normalizeSchemaVerificationFsPath(manifestPath);
}

/**
 * Absolute filesystem path for a schema public export, resolved through the
 * package manifest (avoids Turbopack/webpack JSON-export virtualization).
 */
export function resolveSchemaVerificationFsPath(
  subpath: SchemaVerificationPublicSubpath,
  startDir: string = process.cwd(),
): string {
  return join(
    dirname(resolveApiPackageManifestFsPath(startDir)),
    "schemas",
    schemaFileName(subpath),
  );
}

/**
 * Resolve a known schema public export to a `file:` URL under Next/Turbopack.
 */
export function resolveSchemaVerificationExport(
  subpath: SchemaVerificationPublicSubpath,
): string {
  return pathToFileURL(resolveSchemaVerificationFsPath(subpath)).href;
}

export function loadSchemaVerificationPackageModel(
  subpath: SchemaVerificationPublicSubpath,
): SchemaVerificationPackageModel {
  const artifact = resolveApiPackageArtifact(subpath, {
    resolveExport: () => resolveSchemaVerificationExport(subpath),
  });
  const normalized: NormalizedJsonSchemaArtifact = normalizeJsonSchemaArtifact(
    artifact.data,
    {
      publicArtifactId: artifact.specifier,
      rootPointer: `/schemas/${subpath.split("/").at(-1) ?? "schema"}`,
      sourcePath: artifact.resolvedPath,
    },
  );
  return {
    subpath,
    specifier: artifact.specifier,
    root: normalized.root,
    definitions: normalized.definitions,
  };
}

export function loadAllSchemaVerificationPackageModels(): SchemaVerificationPackageModel[] {
  return SCHEMA_VERIFICATION_PUBLIC_SUBPATHS.map((subpath) =>
    loadSchemaVerificationPackageModel(subpath),
  );
}

export function schemaVerificationSpecifier(
  subpath: SchemaVerificationPublicSubpath,
): string {
  return toApiPackageExportSpecifier(subpath);
}
