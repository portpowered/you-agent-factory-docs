/**
 * Load the packaged OpenAPI artifact for the W08 production API surface.
 *
 * Always acquires through W03 public-subpath resolution
 * (`@you-agent-factory/api/openapi` / `resolveApiPackageArtifact`). Never use
 * package-root imports, package-internal `generated/...` paths, or
 * `node_modules` patches.
 *
 * Next/Turbopack note: do not rely on bare `import.meta.resolve` from bundled
 * RSC pages — Turbopack may omit it. Resolve the package `manifest` JSON
 * export via `createRequire`, then join to `openapi/openapi.yaml` (same pattern
 * as the W01 spike and W07 schema harness). Still pass the result through
 * `resolveApiPackageArtifact` so illegal targets stay rejected. YAML parse uses
 * `js-yaml` because Next RSC runs under Node (no `Bun.YAML`).
 *
 * Build/server-only — depends on Node filesystem + package export resolution.
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { load as loadYaml } from "js-yaml";
import {
  type ApiPackageArtifactResolverDependencies,
  type ResolvedApiPackageArtifact,
  resolveApiPackageArtifact,
} from "@/lib/references/api-package-artifact-resolver";

/** Documented public export that publishes the OpenAPI YAML. */
export const API_OPENAPI_PACKAGE_EXPORT =
  "@you-agent-factory/api/openapi" as const;

/** Schema id used by `createOpenAPI` input map / virtual source. */
export const API_OPENAPI_SCHEMA_ID = "you-agent-factory-api" as const;

/** Virtual-source base directory for the production single-page projection. */
export const API_OPENAPI_SOURCE_BASE_DIR = "references/api" as const;

const require = createRequire(import.meta.url);
const TURBOPACK_PROJECT_PREFIX = "[project]/";

export type LoadedApiOpenApiArtifact = {
  /** Canonical public export specifier. */
  specifier: typeof API_OPENAPI_PACKAGE_EXPORT;
  /** Schema map key for fumadocs-openapi. */
  schemaId: typeof API_OPENAPI_SCHEMA_ID;
  /** W03-resolved package artifact (parsed document + path metadata). */
  artifact: ResolvedApiPackageArtifact;
  /** Structured OpenAPI document object for `createOpenAPI` input. */
  document: object;
};

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeApiOpenApiBundlerFsPath(resolvedPath: string): string {
  if (resolvedPath.startsWith(TURBOPACK_PROJECT_PREFIX)) {
    return join(
      process.cwd(),
      resolvedPath.slice(TURBOPACK_PROJECT_PREFIX.length),
    );
  }
  return resolvedPath;
}

/**
 * Absolute filesystem path for the installed OpenAPI YAML export.
 * Resolves via the package `manifest` JSON export so Turbopack does not
 * ingest the YAML as a JS module.
 */
export function resolveApiOpenApiArtifactFsPath(): string {
  const manifestPath = normalizeApiOpenApiBundlerFsPath(
    require.resolve("@you-agent-factory/api/manifest"),
  );
  return join(dirname(manifestPath), "openapi", "openapi.yaml");
}

/**
 * `file:` URL for `@you-agent-factory/api/openapi` under Next/Turbopack.
 */
export function resolveApiOpenApiExportUrl(): string {
  return pathToFileURL(resolveApiOpenApiArtifactFsPath()).href;
}

function requireOpenApiDocumentObject(
  data: unknown,
  specifier: string,
): object {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      `Resolved ${specifier} did not yield an OpenAPI document object.`,
    );
  }

  const openapiVersion = (data as { openapi?: unknown }).openapi;
  if (typeof openapiVersion !== "string" || openapiVersion.length === 0) {
    throw new Error(
      `Resolved ${specifier} is missing a non-empty string "openapi" version field.`,
    );
  }

  return data;
}

/**
 * Resolve and parse `@you-agent-factory/api/openapi` via W03 public exports.
 *
 * Defaults to `js-yaml` for YAML parse so Next/Node RSC (no `Bun.YAML`) can
 * load the artifact. Callers may still override `parseYaml` / `resolveExport`.
 */
export function loadApiOpenApiArtifact(
  dependencies: ApiPackageArtifactResolverDependencies = {},
): LoadedApiOpenApiArtifact {
  const artifact = resolveApiPackageArtifact(API_OPENAPI_PACKAGE_EXPORT, {
    resolveExport: resolveApiOpenApiExportUrl,
    parseYaml: (text) => loadYaml(text),
    ...dependencies,
  });
  const document = requireOpenApiDocumentObject(
    artifact.data,
    API_OPENAPI_PACKAGE_EXPORT,
  );

  return {
    specifier: API_OPENAPI_PACKAGE_EXPORT,
    schemaId: API_OPENAPI_SCHEMA_ID,
    artifact,
    document,
  };
}
