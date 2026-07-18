/**
 * Count published HTTP operations in an OpenAPI 3 document object.
 * Used to compare the package-resolved artifact against the single-page
 * projection without freezing a hard-coded product quota.
 */

type PathItemLike = Record<string, unknown>;

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

export function countOpenApiOperations(document: {
  paths?: Record<string, PathItemLike | undefined>;
}): number {
  const paths = document.paths ?? {};
  let count = 0;
  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }
    for (const method of HTTP_METHODS) {
      if (method in pathItem && pathItem[method] != null) {
        count += 1;
      }
    }
  }
  return count;
}

/** Count distinct path templates published under `paths`. */
export function countOpenApiPaths(document: {
  paths?: Record<string, PathItemLike | undefined>;
}): number {
  return Object.keys(document.paths ?? {}).length;
}
