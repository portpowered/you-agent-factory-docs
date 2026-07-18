/**
 * Child-process assertion for W01 single-page OpenAPI projection.
 *
 * Run with plain `bun` (not `bun test`) so happy-dom is not registered —
 * happy-dom's URL/fs polyfills break `@apidevtools/json-schema-ref-parser`
 * inside fumadocs-openapi document processing.
 */

import { readFileSync } from "node:fs";
import { load as loadYaml } from "js-yaml";
import { countOpenApiOperations } from "./count-openapi-operations";
import { loadOpenApiSpikeSinglePageProjection } from "./openapi-server";
import {
  OPENAPI_SPIKE_SCHEMA_ID,
  resolveOpenApiArtifactPath,
} from "./resolve-openapi-artifact";

const artifactPath = resolveOpenApiArtifactPath();
const document = loadYaml(readFileSync(artifactPath, "utf8")) as {
  paths?: Record<string, Record<string, unknown>>;
};
const publishedOperationCount = countOpenApiOperations(document);
const projection = await loadOpenApiSpikeSinglePageProjection();

if (projection.pageCount !== 1) {
  throw new Error(`Expected 1 page, got ${projection.pageCount}`);
}
if (!projection.pagePath.includes("references-openapi-spike")) {
  throw new Error(`Unexpected page path: ${projection.pagePath}`);
}
if (!projection.pagePath.includes(OPENAPI_SPIKE_SCHEMA_ID)) {
  throw new Error(`Expected schema id in page path: ${projection.pagePath}`);
}
if (projection.operations.length !== publishedOperationCount) {
  throw new Error(
    `Expected ${publishedOperationCount} operations, got ${projection.operations.length}`,
  );
}
if (projection.apiPageProps.document !== OPENAPI_SPIKE_SCHEMA_ID) {
  throw new Error(
    `Expected document id ${OPENAPI_SPIKE_SCHEMA_ID}, got ${String(projection.apiPageProps.document)}`,
  );
}

const uniqueKeys = new Set(
  projection.operations.map((op) => `${op.method.toUpperCase()} ${op.path}`),
);
if (uniqueKeys.size !== publishedOperationCount) {
  throw new Error(
    `Expected ${publishedOperationCount} unique method+path keys, got ${uniqueKeys.size}`,
  );
}

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    pageCount: projection.pageCount,
    pagePath: projection.pagePath,
    operationCount: projection.operations.length,
    document: projection.apiPageProps.document,
  })}\n`,
);
