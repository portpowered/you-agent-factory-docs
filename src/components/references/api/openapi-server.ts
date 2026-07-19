/**
 * Fumadocs OpenAPI server for the W08 production API reference surface.
 *
 * Feeds the W03 package-resolved OpenAPI artifact into a `per: "file"` virtual
 * source so every published operation projects onto one logical page.
 *
 * Uses a document-object input (not a filesystem path string) because
 * happy-dom's URL polyfill breaks `@apidevtools/json-schema-ref-parser` when
 * createOpenAPI is given an absolute file path under `bun test`. The document
 * still originates from `@you-agent-factory/api/openapi` via W03 resolution.
 *
 * Build/server-only — do not import from client bundles.
 */

import { createOpenAPI, openapiSource } from "fumadocs-openapi/server";
import type { ApiPageProps } from "fumadocs-openapi/ui";
import { apiOpenApiTurbopackLoadDependencies } from "@/lib/references/api-openapi-turbopack";
import type { OpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import { normalizeOpenApiOperationsFromArtifact } from "@/lib/references/normalize-family-artifacts";
import {
  API_OPENAPI_PACKAGE_EXPORT,
  API_OPENAPI_SCHEMA_ID,
  API_OPENAPI_SOURCE_BASE_DIR,
  loadApiOpenApiArtifact,
} from "./load-openapi-artifact";
import {
  API_PROXY_POLICY,
  assertsNoApiProxyUrl,
} from "./playground-suppression";

/**
 * Production OpenAPI server bound to the package-resolved document.
 * `proxyUrl` is intentionally omitted (see {@link API_PROXY_POLICY}) — the
 * production surface is static-only and must never configure a CORS proxy for
 * live playground fetches.
 *
 * Input uses Turbopack-/webpack-safe package resolution so Next RSC pages can
 * load the same `@you-agent-factory/api/openapi` document that CLI/tests load
 * via the W03 resolver (ancestor `node_modules` walk, not bare `createRequire`
 * paths that become `[externals]/…` under Turbopack).
 */
export const apiOpenApiServer = createOpenAPI({
  input: () => {
    const loaded = loadApiOpenApiArtifact(
      apiOpenApiTurbopackLoadDependencies(),
    );
    return {
      [API_OPENAPI_SCHEMA_ID]: loaded.document,
    };
  },
  // Static-only: leave proxyUrl unset — aligned with API_PROXY_POLICY.
});

/** True when the production OpenAPI server matches the no-proxy policy. */
export function apiOpenApiServerOmitsProxyUrl(): boolean {
  return (
    API_PROXY_POLICY.proxyUrl === undefined &&
    assertsNoApiProxyUrl(apiOpenApiServer.options)
  );
}

export type ApiOpenApiOperation = NonNullable<
  ApiPageProps["operations"]
>[number];

export type ApiOpenApiSinglePageProjection = {
  /** Number of virtual pages produced by `per: "file"` (must be 1). */
  pageCount: number;
  /** Virtual page path inside the production source base. */
  pagePath: string;
  /** Props for `createAPIPage` / `<APIPage />` (later UI stories). */
  apiPageProps: ApiPageProps;
  /** Operations projected onto the single page. */
  operations: ApiOpenApiOperation[];
  /**
   * W04 normalized operation summaries from the same package artifact
   * (cross-links / display) — not a second OpenAPI corpus.
   */
  normalizedOperations: OpenApiOperationSummary[];
  /** Schema map document id. */
  schemaId: typeof API_OPENAPI_SCHEMA_ID;
  /** Public export specifier that fed the projection. */
  specifier: typeof API_OPENAPI_PACKAGE_EXPORT;
};

/**
 * Project the packaged OpenAPI document onto one virtual page via `per: "file"`.
 */
export async function loadApiOpenApiSinglePageProjection(): Promise<ApiOpenApiSinglePageProjection> {
  const loaded = loadApiOpenApiArtifact(apiOpenApiTurbopackLoadDependencies());
  const source = await openapiSource(apiOpenApiServer, {
    per: "file",
    baseDir: API_OPENAPI_SOURCE_BASE_DIR,
  });

  const pages = source.files.filter((file) => file.type === "page");
  if (pages.length !== 1) {
    throw new Error(
      `Expected exactly one per:"file" OpenAPI production page, got ${pages.length}`,
    );
  }

  const page = pages[0];
  if (page?.type !== "page") {
    throw new Error(
      'OpenAPI production virtual page missing after per:"file" projection',
    );
  }

  const apiPageProps = page.data.getAPIPageProps();
  const operations = apiPageProps.operations ?? [];
  const normalizedOperations = normalizeOpenApiOperationsFromArtifact(
    loaded.document,
    {
      publicArtifactId: API_OPENAPI_PACKAGE_EXPORT,
      sourcePath: loaded.artifact.resolvedPath.includes(
        "generated/openapi/openapi.yaml",
      )
        ? "generated/openapi/openapi.yaml"
        : undefined,
    },
  );

  return {
    pageCount: pages.length,
    pagePath: page.path,
    apiPageProps,
    operations,
    normalizedOperations,
    schemaId: API_OPENAPI_SCHEMA_ID,
    specifier: API_OPENAPI_PACKAGE_EXPORT,
  };
}
