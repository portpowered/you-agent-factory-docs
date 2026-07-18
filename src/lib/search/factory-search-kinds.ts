import { pageKindSchema } from "@/lib/content/schemas";

/** Search document kind for published blog posts. */
export const BLOG_SEARCH_DOCUMENT_KIND = "blog" as const;

/**
 * Search document kind for reference pages and addressable reference items
 * (API operations, schema fields, CLI commands, MCP tools, JS symbols,
 * event variants). Matches `pageKindSchema` + W04/W09
 * `REFERENCE_SEARCH_DOCUMENT_KIND` so page-level and item-level Orama
 * documents share one public category.
 */
export const REFERENCE_SEARCH_DOCUMENT_KIND = "reference" as const;

/**
 * Public search result kinds / category labels for the factory-only site.
 * Matches docs page kinds plus blog; retired Atlas kinds are not included.
 * `reference` is first-class for both page and item documents (W16).
 */
export const FACTORY_SEARCH_RESULT_KINDS = [
  ...pageKindSchema.options,
  BLOG_SEARCH_DOCUMENT_KIND,
] as const;

const FACTORY_SEARCH_RESULT_KIND_LIST: readonly string[] =
  FACTORY_SEARCH_RESULT_KINDS;

if (!FACTORY_SEARCH_RESULT_KIND_LIST.includes(REFERENCE_SEARCH_DOCUMENT_KIND)) {
  throw new Error(
    `REFERENCE_SEARCH_DOCUMENT_KIND "${REFERENCE_SEARCH_DOCUMENT_KIND}" must remain in FACTORY_SEARCH_RESULT_KINDS.`,
  );
}

export type FactorySearchResultKind =
  (typeof FACTORY_SEARCH_RESULT_KINDS)[number];

/**
 * Retired Model Atlas product kinds that must not appear as live search
 * categories or result-kind labels after domain cleanup.
 */
export const RETIRED_ATLAS_SEARCH_RESULT_KINDS = [
  "model",
  "module",
  "paper",
  "training",
  "training-regime",
  "system",
] as const;

export type RetiredAtlasSearchResultKind =
  (typeof RETIRED_ATLAS_SEARCH_RESULT_KINDS)[number];

const FACTORY_SEARCH_RESULT_KIND_SET = new Set<string>(
  FACTORY_SEARCH_RESULT_KINDS,
);

const RETIRED_ATLAS_SEARCH_RESULT_KIND_SET = new Set<string>(
  RETIRED_ATLAS_SEARCH_RESULT_KINDS,
);

export function isFactorySearchResultKind(
  kind: string,
): kind is FactorySearchResultKind {
  return FACTORY_SEARCH_RESULT_KIND_SET.has(kind);
}

export function isRetiredAtlasSearchResultKind(
  kind: string,
): kind is RetiredAtlasSearchResultKind {
  return RETIRED_ATLAS_SEARCH_RESULT_KIND_SET.has(kind);
}

/**
 * Fail closed when a search document carries a non-factory kind so public
 * search never advertises retired Atlas result categories.
 */
export function assertFactorySearchResultKind(
  kind: string,
  context: string,
): asserts kind is FactorySearchResultKind {
  if (isFactorySearchResultKind(kind)) {
    return;
  }

  throw new Error(
    `Search document kind "${kind}" is outside the factory search category set (${FACTORY_SEARCH_RESULT_KINDS.join(", ")})${context ? ` (${context})` : ""}.`,
  );
}

export function assertFactorySearchDocuments(
  documents: ReadonlyArray<{ kind: string; url: string }>,
): void {
  for (const document of documents) {
    assertFactorySearchResultKind(document.kind, document.url);
  }
}
