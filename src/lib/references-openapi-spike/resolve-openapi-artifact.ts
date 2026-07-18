/**
 * Resolve the packaged OpenAPI artifact from `@you-agent-factory/api`.
 *
 * Spike pages must load this package artifact — not a hand-copied page-local
 * fork.
 *
 * Path resolution notes:
 * - Do not `require.resolve("@you-agent-factory/api/openapi")` from Next-bundled
 *   modules; fumadocs-mdx/webpack tries to parse the YAML as JS.
 * - Turbopack may rewrite `createRequire().resolve(...)` to a virtual
 *   `[project]/...` path that `fs.readFileSync` cannot open. Normalize that
 *   prefix back to `process.cwd()` before reading.
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

/** Public package export that points at the generated OpenAPI YAML. */
export const OPENAPI_SPIKE_PACKAGE_EXPORT =
  "@you-agent-factory/api/openapi" as const;

/** Schema id used by the spike `createOpenAPI` input map / virtual source. */
export const OPENAPI_SPIKE_SCHEMA_ID = "you-agent-factory-api" as const;

const TURBOPACK_PROJECT_PREFIX = "[project]/";

/**
 * Convert bundler-virtual paths (Turbopack `[project]/...`) into real fs paths.
 */
export function normalizeBundlerFsPath(resolvedPath: string): string {
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
 * Throws if the package cannot be resolved.
 */
export function resolveOpenApiArtifactPath(): string {
  // Resolve a JSON export so the bundler does not ingest the YAML as a module.
  const manifestPath = normalizeBundlerFsPath(
    require.resolve("@you-agent-factory/api/manifest"),
  );
  return join(dirname(manifestPath), "openapi", "openapi.yaml");
}
