/**
 * CLI entrypoint for the shipped OpenAPI JSON asset.
 *
 *   bun ./scripts/emit-openapi-public-artifact.ts
 */

import { emitApiOpenApiPublicArtifact } from "@/lib/references/emit-openapi-public-artifact";

const { result } = emitApiOpenApiPublicArtifact({ cwd: process.cwd() });

console.log(
  `OpenAPI public asset ${result.changed ? "updated" : "unchanged"}: ${result.absolutePath} ` +
    `(${result.bytes} bytes, ${result.operationCount} operations, ${result.schemaCount} schemas).`,
);
