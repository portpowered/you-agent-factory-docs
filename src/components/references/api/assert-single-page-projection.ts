/**
 * Child-process assertion for W08 single-page OpenAPI projection.
 *
 * Run with plain `bun` (not `bun test`) so happy-dom is not registered —
 * happy-dom's URL/fs polyfills break `@apidevtools/json-schema-ref-parser`
 * inside fumadocs-openapi document processing.
 */

import {
  countOpenApiOperations,
  countOpenApiPaths,
} from "./count-openapi-operations";
import {
  API_OPENAPI_PACKAGE_EXPORT,
  API_OPENAPI_SCHEMA_ID,
  API_OPENAPI_SOURCE_BASE_DIR,
  loadApiOpenApiArtifact,
} from "./load-openapi-artifact";
import { loadApiOpenApiSinglePageProjection } from "./openapi-server";

const loaded = loadApiOpenApiArtifact();
const publishedOperationCount = countOpenApiOperations(
  loaded.document as { paths?: Record<string, Record<string, unknown>> },
);
const publishedPathCount = countOpenApiPaths(
  loaded.document as { paths?: Record<string, Record<string, unknown>> },
);
const projection = await loadApiOpenApiSinglePageProjection();

if (loaded.specifier !== API_OPENAPI_PACKAGE_EXPORT) {
  throw new Error(`Unexpected specifier: ${loaded.specifier}`);
}
if (projection.pageCount !== 1) {
  throw new Error(`Expected 1 page, got ${projection.pageCount}`);
}
if (!projection.pagePath.includes(API_OPENAPI_SOURCE_BASE_DIR)) {
  throw new Error(`Unexpected page path: ${projection.pagePath}`);
}
if (!projection.pagePath.includes(API_OPENAPI_SCHEMA_ID)) {
  throw new Error(`Expected schema id in page path: ${projection.pagePath}`);
}
if (projection.operations.length !== publishedOperationCount) {
  throw new Error(
    `Expected ${publishedOperationCount} operations, got ${projection.operations.length}`,
  );
}
if (projection.normalizedOperations.length !== publishedOperationCount) {
  throw new Error(
    `Expected ${publishedOperationCount} W04 normalized operations, got ${projection.normalizedOperations.length}`,
  );
}
if (projection.apiPageProps.document !== API_OPENAPI_SCHEMA_ID) {
  throw new Error(
    `Expected document id ${API_OPENAPI_SCHEMA_ID}, got ${String(projection.apiPageProps.document)}`,
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

const normalizedKeys = new Set(
  projection.normalizedOperations.map(
    (op) => `${op.method.toUpperCase()} ${op.path}`,
  ),
);
for (const key of uniqueKeys) {
  if (!normalizedKeys.has(key)) {
    throw new Error(
      `W04 normalized inventory missing projected operation ${key}`,
    );
  }
}

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    pageCount: projection.pageCount,
    pagePath: projection.pagePath,
    operationCount: projection.operations.length,
    pathCount: publishedPathCount,
    normalizedOperationCount: projection.normalizedOperations.length,
    document: projection.apiPageProps.document,
    specifier: projection.specifier,
  })}\n`,
);
