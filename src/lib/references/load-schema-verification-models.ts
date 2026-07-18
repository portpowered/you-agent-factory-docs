/**
 * Server/build helper: acquire the three W03 public schema subpaths and
 * normalize them into W04 models for the W07 verification harness.
 *
 * Do not import from client/browser UI bundles — depends on Node package
 * resolution via `resolveApiPackageArtifact`.
 *
 * Next/Turbopack note: do not `require.resolve` JSON schema exports directly —
 * Turbopack rewrites them into non-readable virtual module ids. Resolve the
 * package `manifest` JSON export (static string), then join to
 * `schemas/<name>.schema.json` (same pattern as the OpenAPI spike).
 */

import { createRequire } from "node:module";
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

const require = createRequire(import.meta.url);
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
 * Absolute filesystem path for a schema public export, resolved through the
 * package manifest (avoids Turbopack JSON-export virtualization).
 */
export function resolveSchemaVerificationFsPath(
  subpath: SchemaVerificationPublicSubpath,
): string {
  // Resolve a JSON export so the bundler does not invent a virtual schema id.
  const manifestPath = normalizeSchemaVerificationFsPath(
    require.resolve("@you-agent-factory/api/manifest"),
  );
  return join(dirname(manifestPath), "schemas", schemaFileName(subpath));
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
