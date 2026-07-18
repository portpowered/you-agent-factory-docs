/**
 * Load packaged OpenAPI as event truth for the W09 events corpus.
 *
 * Build/server-only. Resolves exclusively through the merged W03 public-subpath
 * artifact resolver (`@you-agent-factory/api/openapi`). Rejects package-root
 * imports, package-internal paths, and node_modules patches by construction.
 *
 * Do not import this module from client components.
 */

import {
  ApiPackageArtifactResolutionError,
  type ApiPackageArtifactResolverDependencies,
  type ResolvedApiPackageArtifact,
  resolveApiPackageArtifact,
} from "@/lib/references/api-package-artifact-resolver";
import type { EventsOpenApiDocument } from "./openapi-document";
import { EVENTS_OPENAPI_EXPORT } from "./stream-operations";

export type LoadedEventsOpenApi = {
  /** Canonical public export specifier. */
  specifier: typeof EVENTS_OPENAPI_EXPORT;
  /** Documented public subpath (`openapi`). */
  subpath: "openapi";
  /** Absolute filesystem path of the resolved artifact. */
  resolvedPath: string;
  /** Exact UTF-8 bytes from the packaged artifact (unmodified). */
  rawText: string;
  /** Parsed OpenAPI document (YAML → object via W03 resolver). */
  document: EventsOpenApiDocument;
};

export type LoadEventsOpenApiDependencies =
  ApiPackageArtifactResolverDependencies;

export class EventsOpenApiLoadError extends Error {
  readonly code:
    | "illegal-target"
    | "missing-export"
    | "parse-failed"
    | "invalid-document";
  readonly target: string;

  constructor(
    code: EventsOpenApiLoadError["code"],
    message: string,
    options: { target: string; cause?: unknown },
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "EventsOpenApiLoadError";
    this.code = code;
    this.target = options.target;
  }
}

function asOpenApiDocument(data: unknown): EventsOpenApiDocument {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new EventsOpenApiLoadError(
      "invalid-document",
      `Packaged OpenAPI artifact did not parse to an object document (got ${data === null ? "null" : typeof data}).`,
      { target: EVENTS_OPENAPI_EXPORT },
    );
  }
  return data as EventsOpenApiDocument;
}

/**
 * Resolve and parse `@you-agent-factory/api/openapi` via W03 public-subpath
 * resolution. OpenAPI remains the sole event-truth input.
 */
export function loadEventsOpenApi(
  dependencies: LoadEventsOpenApiDependencies = {},
): LoadedEventsOpenApi {
  let artifact: ResolvedApiPackageArtifact;
  try {
    artifact = resolveApiPackageArtifact(EVENTS_OPENAPI_EXPORT, dependencies);
  } catch (cause) {
    if (cause instanceof ApiPackageArtifactResolutionError) {
      throw new EventsOpenApiLoadError(cause.code, cause.message, {
        target: EVENTS_OPENAPI_EXPORT,
        cause,
      });
    }
    throw cause;
  }

  if (artifact.subpath !== "openapi") {
    throw new EventsOpenApiLoadError(
      "illegal-target",
      `Events corpus expected public subpath "openapi", resolved "${artifact.subpath}".`,
      { target: EVENTS_OPENAPI_EXPORT },
    );
  }

  return {
    specifier: EVENTS_OPENAPI_EXPORT,
    subpath: "openapi",
    resolvedPath: artifact.resolvedPath,
    rawText: artifact.rawText,
    document: asOpenApiDocument(artifact.data),
  };
}
