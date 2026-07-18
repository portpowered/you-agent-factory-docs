/**
 * Count published HTTP operations in an OpenAPI 3 document object.
 * Used by spike tests to compare the package artifact against the projection.
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
