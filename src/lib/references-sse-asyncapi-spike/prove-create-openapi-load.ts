/**
 * Subprocess proof that fumadocs-openapi can load the packaged OpenAPI path.
 * Run with plain `bun` (no happy-dom preload). happy-dom's URL polyfill breaks
 * @apidevtools/json-schema-ref-parser filesystem resolution used by
 * fumadocs-openapi processDocument.
 */

import { createSseSpikeApiPage } from "./create-sse-spike-openapi";
import { resolvePackagedOpenApiAbsolutePath } from "./load-packaged-openapi";
import { SSE_SPIKE_DOCUMENT_ID, SSE_SPIKE_OPERATIONS } from "./sse-operations";

const openApiAbsolutePath = resolvePackagedOpenApiAbsolutePath();
const { server } = createSseSpikeApiPage({ openApiAbsolutePath });

if (server.options.proxyUrl !== undefined) {
  throw new Error("proxyUrl must be unset on the SSE spike OpenAPI server");
}

const schema = await server.getSchema(SSE_SPIKE_DOCUMENT_ID);
const paths = schema.dereferenced.paths ?? {};

for (const operation of SSE_SPIKE_OPERATIONS) {
  const pathItem = paths[operation.path];
  if (!pathItem?.get) {
    throw new Error(`Missing operation ${operation.method} ${operation.path}`);
  }
  const stream =
    pathItem.get.responses?.["200"]?.content?.["text/event-stream"];
  if (!stream) {
    throw new Error(`Missing text/event-stream on ${operation.path}`);
  }
  const xEventSchema = (stream as { "x-event-schema"?: unknown })[
    "x-event-schema"
  ];
  if (typeof xEventSchema !== "string" || xEventSchema.length === 0) {
    throw new Error(`Missing x-event-schema on ${operation.path}`);
  }
}

console.log(
  JSON.stringify({
    ok: true,
    documentId: SSE_SPIKE_DOCUMENT_ID,
    openApiAbsolutePath,
    operationCount: SSE_SPIKE_OPERATIONS.length,
    proxyUrl: server.options.proxyUrl ?? null,
  }),
);
