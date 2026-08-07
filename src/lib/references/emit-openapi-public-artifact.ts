/**
 * Emit the packaged OpenAPI document as a static JSON asset under `public/`.
 *
 * `/docs/references/api` renders operation detail on the client from this file
 * rather than expanding all 44 operations against 442 component schemas into
 * server-rendered HTML. The spec is a single ~360 KB artifact; the HTML
 * expansion was ~10 MB, and static export duplicated it once per locale plus
 * once again into each route's RSC sidecar.
 *
 * Refs are left unresolved on purpose. `#/components/schemas/*` pointers stay
 * in place and the client resolves them against the shipped `components` map,
 * so a schema referenced by twenty operations ships once instead of twenty
 * times — dereferencing here would reintroduce the duplication this file
 * exists to remove.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadApiOpenApiArtifact } from "@/features/references/api";

/** Public URL path (before any base-path prefix) of the shipped document. */
export const API_OPENAPI_PUBLIC_ASSET_PATH = "/generated/openapi.json" as const;

/** Repo-relative path the emitter writes. */
export const API_OPENAPI_PUBLIC_ASSET_RELATIVE_PATH =
  "public/generated/openapi.json" as const;

export type EmitApiOpenApiPublicArtifactResult = {
  absolutePath: string;
  bytes: number;
  operationCount: number;
  schemaCount: number;
  changed: boolean;
};

function countOperations(document: unknown): number {
  const methods = [
    "get",
    "put",
    "post",
    "delete",
    "patch",
    "head",
    "options",
    "trace",
  ];
  const paths = (document as { paths?: Record<string, unknown> }).paths;
  if (typeof paths !== "object" || paths === null) {
    return 0;
  }
  let total = 0;
  for (const item of Object.values(paths)) {
    if (typeof item !== "object" || item === null) continue;
    for (const method of methods) {
      if ((item as Record<string, unknown>)[method] !== undefined) total += 1;
    }
  }
  return total;
}

function countSchemas(document: unknown): number {
  const schemas = (
    document as { components?: { schemas?: Record<string, unknown> } }
  ).components?.schemas;
  return typeof schemas === "object" && schemas !== null
    ? Object.keys(schemas).length
    : 0;
}

/**
 * Serialize the installed package document to `public/generated/openapi.json`.
 *
 * Minified — this is a fetch payload, not a file anyone reads by hand, and the
 * pretty-printed form is roughly twice the bytes over the wire.
 */
export function emitApiOpenApiPublicArtifact(options: { cwd: string }): {
  result: EmitApiOpenApiPublicArtifactResult;
} {
  const loaded = loadApiOpenApiArtifact();
  const contents = JSON.stringify(loaded.document);
  const absolutePath = join(
    options.cwd,
    API_OPENAPI_PUBLIC_ASSET_RELATIVE_PATH,
  );

  let previous: string | undefined;
  try {
    previous = readFileSync(absolutePath, "utf8");
  } catch {
    previous = undefined;
  }

  const changed = previous !== contents;
  if (changed) {
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents, "utf8");
  }

  return {
    result: {
      absolutePath,
      bytes: Buffer.byteLength(contents, "utf8"),
      operationCount: countOperations(loaded.document),
      schemaCount: countSchemas(loaded.document),
      changed,
    },
  };
}
