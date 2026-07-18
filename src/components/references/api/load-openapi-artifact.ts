/**
 * Load the packaged OpenAPI artifact for the W08 production API surface.
 *
 * Always acquires through W03 public-subpath resolution
 * (`@you-agent-factory/api/openapi` / `resolveApiPackageArtifact`). Never use
 * package-root imports, package-internal `generated/...` paths, or
 * `node_modules` patches.
 *
 * Build/server-only — depends on Node filesystem + package export resolution.
 */

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
 */
export function loadApiOpenApiArtifact(
  dependencies: ApiPackageArtifactResolverDependencies = {},
): LoadedApiOpenApiArtifact {
  const artifact = resolveApiPackageArtifact(
    API_OPENAPI_PACKAGE_EXPORT,
    dependencies,
  );
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
