/**
 * Fumadocs OpenAPI server + page factory for the W02 SSE spike.
 *
 * Loads the unmodified packaged OpenAPI document and disables playground /
 * proxy so the spike never opens a live Factory connection.
 *
 * Build/server-only. Temporary non-production surface — not the shipped
 * `/docs/references/api` page.
 */

import { defaultShikiFactory } from "fumadocs-core/highlight/shiki/full";
import { createOpenAPI } from "fumadocs-openapi/server";
import { createAPIPage } from "fumadocs-openapi/ui";
import { resolvePackagedOpenApiAbsolutePath } from "./load-packaged-openapi";
import { SSE_SPIKE_DOCUMENT_ID, SSE_SPIKE_SAFETY } from "./sse-operations";

export type CreateSseSpikeOpenApiOptions = {
  /** Absolute OpenAPI path override (tests). Defaults to packaged export. */
  openApiAbsolutePath?: string;
};

/**
 * Create the spike OpenAPI server bound to the packaged artifact path.
 * Intentionally omits `proxyUrl` so no CORS proxy is configured.
 */
export function createSseSpikeOpenApiServer(
  options: CreateSseSpikeOpenApiOptions = {},
) {
  const openApiAbsolutePath =
    options.openApiAbsolutePath ?? resolvePackagedOpenApiAbsolutePath();

  return createOpenAPI({
    // SchemaMap form keeps a stable document id for <APIPage document=...>.
    input: () => ({
      [SSE_SPIKE_DOCUMENT_ID]: openApiAbsolutePath,
    }),
    // Explicitly leave proxyUrl unset — spike must not add a proxy.
  });
}

/**
 * API page renderer with playground disabled. Pass the three SSE operations
 * from `SSE_SPIKE_API_PAGE_OPERATIONS` at the call site.
 */
export function createSseSpikeApiPage(
  options: CreateSseSpikeOpenApiOptions = {},
) {
  const server = createSseSpikeOpenApiServer(options);

  if (SSE_SPIKE_SAFETY.playgroundEnabled !== false) {
    throw new Error(
      "SSE spike safety contract violated: playground must stay disabled.",
    );
  }

  if (SSE_SPIKE_SAFETY.proxyUrl !== undefined) {
    throw new Error(
      "SSE spike safety contract violated: proxyUrl must stay unset.",
    );
  }

  const APIPage = createAPIPage(server, {
    shiki: defaultShikiFactory,
    shikiOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
    playground: {
      enabled: false,
    },
  });

  return { server, APIPage, documentId: SSE_SPIKE_DOCUMENT_ID };
}

let sseSpikeOpenApiSingleton:
  | ReturnType<typeof createSseSpikeApiPage>
  | undefined;

/**
 * Lazy singleton for the Next.js spike route. Avoids resolving the packaged
 * OpenAPI path at module-evaluation time during unrelated imports.
 */
export function getSseSpikeOpenApi(
  options: CreateSseSpikeOpenApiOptions = {},
): ReturnType<typeof createSseSpikeApiPage> {
  if (options.openApiAbsolutePath) {
    return createSseSpikeApiPage(options);
  }
  if (!sseSpikeOpenApiSingleton) {
    sseSpikeOpenApiSingleton = createSseSpikeApiPage();
  }
  return sseSpikeOpenApiSingleton;
}
