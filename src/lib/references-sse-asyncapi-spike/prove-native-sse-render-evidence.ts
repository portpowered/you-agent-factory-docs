/**
 * Subprocess proof that fumadocs-openapi processDocument retains plain-string
 * `text/event-stream` schemas and `x-event-schema` without traversing the
 * extension into the response schema root.
 *
 * Run with plain `bun` (no happy-dom preload).
 */

import { createSseSpikeApiPage } from "./create-sse-spike-openapi";
import { resolvePackagedOpenApiAbsolutePath } from "./load-packaged-openapi";
import {
  mediaSchemaDoesNotTraverseXEventSchema,
  NATIVE_FUMADOCS_SSE_RENDER,
  schemaIsPlainString,
} from "./native-sse-render-evidence";
import { SSE_SPIKE_DOCUMENT_ID, SSE_SPIKE_OPERATIONS } from "./sse-operations";

const openApiAbsolutePath = resolvePackagedOpenApiAbsolutePath();
const { server } = createSseSpikeApiPage({ openApiAbsolutePath });
const schema = await server.getSchema(SSE_SPIKE_DOCUMENT_ID);
const paths = schema.dereferenced.paths ?? {};

const operations = SSE_SPIKE_OPERATIONS.map((operation) => {
  const pathItem = paths[operation.path];
  if (!pathItem?.get) {
    throw new Error(`Missing operation ${operation.method} ${operation.path}`);
  }
  const stream =
    pathItem.get.responses?.["200"]?.content?.["text/event-stream"];
  if (!stream || typeof stream !== "object") {
    throw new Error(`Missing text/event-stream on ${operation.path}`);
  }
  const media = stream as {
    schema?: unknown;
    "x-event-schema"?: unknown;
  };
  const xEventSchema = media["x-event-schema"];
  if (typeof xEventSchema !== "string" || xEventSchema.length === 0) {
    throw new Error(`Missing x-event-schema on ${operation.path}`);
  }
  if (!schemaIsPlainString(media.schema)) {
    throw new Error(
      `Expected plain string schema on ${operation.path}, got ${JSON.stringify(media.schema)}`,
    );
  }
  if (!mediaSchemaDoesNotTraverseXEventSchema(media.schema, xEventSchema)) {
    throw new Error(
      `Expected media schema not to traverse x-event-schema on ${operation.path}`,
    );
  }

  return {
    path: operation.path,
    role: operation.role,
    schemaIsPlainString: true,
    xEventSchema,
    mediaSchemaDoesNotTraverseXEventSchema: true,
    schema: media.schema,
  };
});

console.log(
  JSON.stringify({
    ok: true,
    documentId: SSE_SPIKE_DOCUMENT_ID,
    openApiAbsolutePath,
    classification: NATIVE_FUMADOCS_SSE_RENDER,
    operations,
  }),
);
