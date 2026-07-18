/**
 * Story 007 — temporary @fumadocs/asyncapi projection + server loader for the
 * regenerated AsyncAPI fixture.
 *
 * Loads packaged OpenAPI → regenerates AsyncAPI via the temporary projector →
 * binds createAsyncAPI for load proofs. UI rendering lives in the client
 * component `SseAsyncApiSpikeRenderer` because `createAsyncAPIPage` is client-
 * only. Does not hand-edit generated AsyncAPI. Temporary non-production
 * surface — not a production dependency pin.
 */

import type { AsyncAPI } from "@fumadocs/asyncapi";
import { createAsyncAPI } from "@fumadocs/asyncapi/server";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import type { OpenApiLike } from "./observe-sse-operations";
import { parseOpenApiYamlText } from "./parse-openapi-yaml";
import {
  channelIdForSelectedStream,
  type OpenApiToAsyncApiProjection,
  type ProjectedAsyncApiDocument,
  projectOpenApiSseToAsyncApi,
} from "./project-openapi-to-asyncapi";
import { SSE_SPIKE_DOCUMENT_ID, SSE_SPIKE_SAFETY } from "./sse-operations";

/**
 * Spike projection is AsyncAPI-shaped but keeps a narrower local type for
 * inventory/envelope assertions. Cast at the renderer boundary only — never
 * hand-edit the regenerated document to satisfy typings.
 */
export function asFumadocsAsyncApiObject(
  doc: ProjectedAsyncApiDocument,
): AsyncAPI.AsyncAPIObject {
  return doc as unknown as AsyncAPI.AsyncAPIObject;
}

export const SSE_SPIKE_ASYNCAPI_DOCUMENT_ID = SSE_SPIKE_DOCUMENT_ID;

export const SSE_SPIKE_ASYNCAPI_ROUTE = "/spikes/sse-asyncapi" as const;

/** Temporary spike-only pin — W08 decides production deps after W01/W02. */
export const SSE_SPIKE_ASYNCAPI_PACKAGE = "@fumadocs/asyncapi" as const;
export const SSE_SPIKE_ASYNCAPI_VERSION = "0.2.1" as const;

export type AsyncApiSpikeOperationItem = {
  id: string;
  action: "receive";
};

export type CreateSseSpikeAsyncApiResult = {
  documentId: typeof SSE_SPIKE_ASYNCAPI_DOCUMENT_ID;
  projection: OpenApiToAsyncApiProjection;
  asyncapi: ProjectedAsyncApiDocument;
  /** Same regenerated document typed for @fumadocs/asyncapi (cast at boundary). */
  bundled: AsyncAPI.AsyncAPIObject;
  operations: AsyncApiSpikeOperationItem[];
  server: ReturnType<typeof createAsyncAPI>;
  packagePin: {
    name: typeof SSE_SPIKE_ASYNCAPI_PACKAGE;
    version: typeof SSE_SPIKE_ASYNCAPI_VERSION;
    permanentProductionPin: false;
  };
};

export type CreateSseSpikeAsyncApiOptions = {
  /** Override packaged OpenAPI parse (tests). */
  openApiDoc?: OpenApiLike & {
    components?: { schemas?: Record<string, unknown> };
  };
  /** Override packaged OpenAPI source text for hashing (tests). */
  sourceText?: string;
};

/**
 * Project packaged OpenAPI SSE streams and construct a temporary AsyncAPI
 * server loader. Generated AsyncAPI is regenerated each call — never loaded
 * from a hand-edited second corpus.
 */
export function createSseSpikeAsyncApi(
  options: CreateSseSpikeAsyncApiOptions = {},
): CreateSseSpikeAsyncApiResult {
  if (SSE_SPIKE_SAFETY.opensLiveFactoryConnection) {
    throw new Error(
      "SSE AsyncAPI spike safety contract violated: must not open a live Factory connection.",
    );
  }

  const artifact =
    options.openApiDoc && options.sourceText
      ? null
      : loadPackagedOpenApiArtifact();
  const sourceText = options.sourceText ?? artifact?.rawText;
  if (typeof sourceText !== "string") {
    throw new Error("SSE AsyncAPI spike requires packaged OpenAPI sourceText.");
  }

  const openApiDoc =
    options.openApiDoc ??
    parseOpenApiYamlText<
      OpenApiLike & {
        components?: { schemas?: Record<string, unknown> };
      }
    >(sourceText);

  const projection = projectOpenApiSseToAsyncApi(openApiDoc, { sourceText });

  const bundled = asFumadocsAsyncApiObject(projection.asyncapi);

  const server = createAsyncAPI({
    input: {
      [SSE_SPIKE_ASYNCAPI_DOCUMENT_ID]: bundled,
    },
    // Spike always regenerates from packaged OpenAPI — skip stale caches.
    disableCache: true,
  });

  const operations: AsyncApiSpikeOperationItem[] =
    projection.selectedStreams.map((stream) => ({
      id: `receive_${channelIdForSelectedStream(stream)}`,
      action: "receive" as const,
    }));

  return {
    documentId: SSE_SPIKE_ASYNCAPI_DOCUMENT_ID,
    projection,
    asyncapi: projection.asyncapi,
    bundled,
    operations,
    server,
    packagePin: {
      name: SSE_SPIKE_ASYNCAPI_PACKAGE,
      version: SSE_SPIKE_ASYNCAPI_VERSION,
      permanentProductionPin: false,
    },
  };
}

let sseSpikeAsyncApiSingleton: CreateSseSpikeAsyncApiResult | undefined;

/**
 * Lazy singleton for the Next.js AsyncAPI spike route.
 */
export function getSseSpikeAsyncApi(
  options: CreateSseSpikeAsyncApiOptions = {},
): CreateSseSpikeAsyncApiResult {
  if (options.openApiDoc || options.sourceText) {
    return createSseSpikeAsyncApi(options);
  }
  if (!sseSpikeAsyncApiSingleton) {
    sseSpikeAsyncApiSingleton = createSseSpikeAsyncApi();
  }
  return sseSpikeAsyncApiSingleton;
}
