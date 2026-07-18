/**
 * Fumadocs OpenAPI server for the W01 non-production spike.
 *
 * Loads the installed `@you-agent-factory/api/openapi` artifact and exposes a
 * `per: "file"` virtual source so every operation projects onto one page.
 *
 * Uses a document-object input (not a filesystem path string) because
 * happy-dom's URL polyfill breaks `@apidevtools/json-schema-ref-parser` when
 * createOpenAPI is given an absolute file path under `bun test`. The document
 * is still read from the packaged export via Node fs + js-yaml (Next runs under
 * Node, not Bun).
 */

import { readFileSync } from "node:fs";
import { createOpenAPI, openapiSource } from "fumadocs-openapi/server";
import type { ApiPageProps } from "fumadocs-openapi/ui";
import { load as loadYaml } from "js-yaml";
import {
  OPENAPI_SPIKE_SCHEMA_ID,
  resolveOpenApiArtifactPath,
} from "./resolve-openapi-artifact";

/** Virtual-source base directory for the spike (not a production content tree). */
export const OPENAPI_SPIKE_SOURCE_BASE_DIR =
  "references-openapi-spike" as const;

function loadPackagedOpenApiDocument(): object {
  const artifactPath = resolveOpenApiArtifactPath();
  const text = readFileSync(artifactPath, "utf8");
  return loadYaml(text) as object;
}

export const openapiSpikeServer = createOpenAPI({
  // Schema map keyed by spike id; value is the packaged YAML document.
  input: () => ({
    [OPENAPI_SPIKE_SCHEMA_ID]: loadPackagedOpenApiDocument(),
  }),
});

export type OpenApiSpikeOperation = NonNullable<
  ApiPageProps["operations"]
>[number];

export type OpenApiSpikePageProjection = {
  /** Number of virtual pages produced by `per: "file"` (must be 1). */
  pageCount: number;
  /** Virtual page path inside the spike source. */
  pagePath: string;
  /** Props for `createAPIPage` / `<APIPage />`. */
  apiPageProps: ApiPageProps;
  operations: OpenApiSpikeOperation[];
};

/**
 * Project the packaged OpenAPI document onto one virtual page via `per: "file"`.
 */
export async function loadOpenApiSpikeSinglePageProjection(): Promise<OpenApiSpikePageProjection> {
  const source = await openapiSource(openapiSpikeServer, {
    per: "file",
    baseDir: OPENAPI_SPIKE_SOURCE_BASE_DIR,
  });

  const pages = source.files.filter((file) => file.type === "page");
  if (pages.length !== 1) {
    throw new Error(
      `Expected exactly one per:"file" OpenAPI spike page, got ${pages.length}`,
    );
  }

  const page = pages[0];
  if (page?.type !== "page") {
    throw new Error(
      'OpenAPI spike virtual page missing after per:"file" projection',
    );
  }

  const apiPageProps = page.data.getAPIPageProps();
  const operations = apiPageProps.operations ?? [];

  return {
    pageCount: pages.length,
    pagePath: page.path,
    apiPageProps,
    operations,
  };
}
