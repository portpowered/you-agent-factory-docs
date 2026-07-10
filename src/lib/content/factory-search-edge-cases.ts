import { DELETED_ATLAS_TAG_SLUGS } from "@/lib/content/factory-tags-browse";
import {
  buildLocalizedRoute,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import {
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  isDeletedAiSearchUrl,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
} from "@/lib/search/factory-search-deleted-records";

/**
 * Factory-only empty-state suggestion used when `/search` has a query with no
 * hits. Must point readers at live factory docs, never Atlas GQA/attention
 * handoffs.
 */
export const FACTORY_SEARCH_EMPTY_SUGGESTION_TERM = "harness" as const;

/**
 * Live factory docs destination linked from the empty-results suggestion.
 */
export const FACTORY_SEARCH_EMPTY_SUGGESTION_DOCS_SLUG =
  "techniques/ralph" as const;

export const FACTORY_SEARCH_EMPTY_SUGGESTION_HREF =
  `/docs/${FACTORY_SEARCH_EMPTY_SUGGESTION_DOCS_SLUG}` as const;

/**
 * Atlas-era empty-state / handoff phrases that must never appear in factory
 * search empty copy or suggestion chrome.
 */
export const RETIRED_ATLAS_SEARCH_HANDOFF_TERMS = [
  "GQA",
  "attention",
  "grouped-query",
  "Model Atlas",
  "KV cache",
] as const;

export type RetiredAtlasSearchHandoffTerm =
  (typeof RETIRED_ATLAS_SEARCH_HANDOFF_TERMS)[number];

/**
 * Representative malformed `/search` params that must fall back to the empty
 * or unscoped factory search experience without advertising retired Atlas
 * destinations.
 */
export const FACTORY_MALFORMED_SEARCH_CLASSIFICATIONS = [
  "unknown-topic",
  "not-a-real-classification",
  "module.attention",
] as const;

/**
 * Reader-facing search unavailable / error chrome test ids. Bootstrap failure
 * must surface these rather than silently querying a wrong Atlas index.
 */
export const FACTORY_SEARCH_UNAVAILABLE_TEST_IDS = [
  "search-page-error",
  "search-dialog-error",
] as const;

export {
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  DELETED_ATLAS_TAG_SLUGS,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
};

const ATLAS_HANDOFF_PATTERN = new RegExp(
  RETIRED_ATLAS_SEARCH_HANDOFF_TERMS.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|"),
  "i",
);

/**
 * True when reader-facing copy still advertises retired Atlas search handoffs.
 */
export function containsRetiredAtlasSearchHandoff(text: string): boolean {
  return ATLAS_HANDOFF_PATTERN.test(text);
}

export type FactorySearchEmptySuggestionCopy = {
  emptySuggestionTerm: string;
  emptySuggestionLinkLabel: string;
  emptySuggestionPrefix?: string;
  emptySuggestionMiddle?: string;
  emptySuggestionSuffix?: string;
  noResults?: string;
};

/**
 * Fail closed when empty-state suggestion copy drifts off the factory contract
 * or reintroduces Atlas GQA/attention handoffs.
 */
export function assertFactorySearchEmptySuggestionCopy(
  copy: FactorySearchEmptySuggestionCopy,
): void {
  if (copy.emptySuggestionTerm !== FACTORY_SEARCH_EMPTY_SUGGESTION_TERM) {
    throw new Error(
      `Search empty suggestion term "${copy.emptySuggestionTerm}" must be "${FACTORY_SEARCH_EMPTY_SUGGESTION_TERM}".`,
    );
  }

  const combined = [
    copy.emptySuggestionTerm,
    copy.emptySuggestionLinkLabel,
    copy.emptySuggestionPrefix ?? "",
    copy.emptySuggestionMiddle ?? "",
    copy.emptySuggestionSuffix ?? "",
    copy.noResults ?? "",
  ].join(" ");

  if (containsRetiredAtlasSearchHandoff(combined)) {
    throw new Error(
      `Search empty suggestion copy must not advertise retired Atlas handoffs (${RETIRED_ATLAS_SEARCH_HANDOFF_TERMS.join(", ")}).`,
    );
  }
}

/**
 * Fail closed when an empty-state suggestion href is not the live factory
 * ralph technique page (or a locale-prefixed equivalent ending in that path).
 */
export function assertFactorySearchEmptySuggestionHref(href: string): void {
  const normalized = href.replace(/\/$/, "");
  if (
    normalized === FACTORY_SEARCH_EMPTY_SUGGESTION_HREF ||
    normalized.endsWith(FACTORY_SEARCH_EMPTY_SUGGESTION_HREF)
  ) {
    return;
  }

  throw new Error(
    `Search empty suggestion href "${href}" must resolve to "${FACTORY_SEARCH_EMPTY_SUGGESTION_HREF}".`,
  );
}

export type FactorySearchEmptySuggestion = {
  term: typeof FACTORY_SEARCH_EMPTY_SUGGESTION_TERM;
  docsSlug: typeof FACTORY_SEARCH_EMPTY_SUGGESTION_DOCS_SLUG;
  href: string;
};

/**
 * Resolve the factory empty-results suggestion for the active locale and fail
 * closed when copy or href drifts onto Atlas handoffs.
 */
export function resolveFactorySearchEmptySuggestion(
  locale: SiteLocale,
  copy: FactorySearchEmptySuggestionCopy,
): FactorySearchEmptySuggestion {
  assertFactorySearchEmptySuggestionCopy(copy);
  const href = buildLocalizedRoute(
    {
      surface: "docs-page",
      slug: FACTORY_SEARCH_EMPTY_SUGGESTION_DOCS_SLUG,
    },
    locale,
  );
  assertFactorySearchEmptySuggestionHref(href);
  return {
    term: FACTORY_SEARCH_EMPTY_SUGGESTION_TERM,
    docsSlug: FACTORY_SEARCH_EMPTY_SUGGESTION_DOCS_SLUG,
    href,
  };
}

/**
 * Fail closed when unavailable-index / bootstrap error copy is missing or
 * still points readers at Atlas inventory.
 */
export function assertFactorySearchUnavailableCopy(copy: {
  error: string;
  retry: string;
}): void {
  if (copy.error.trim().length === 0) {
    throw new Error("Search unavailable error copy must be non-empty.");
  }
  if (copy.retry.trim().length === 0) {
    throw new Error("Search unavailable retry copy must be non-empty.");
  }
  if (containsRetiredAtlasSearchHandoff(`${copy.error} ${copy.retry}`)) {
    throw new Error(
      `Search unavailable copy must not advertise retired Atlas handoffs (${RETIRED_ATLAS_SEARCH_HANDOFF_TERMS.join(", ")}).`,
    );
  }
}

/**
 * Fail closed when a navigation or search chrome href points at deleted Atlas
 * inventory after domain cleanup.
 */
export function assertFactorySearchNavOmitsDeletedContent(
  hrefs: Iterable<string>,
): void {
  for (const href of hrefs) {
    if (!isDeletedAiSearchUrl(href)) {
      continue;
    }
    throw new Error(
      `Search/nav chrome href "${href}" points at deleted Atlas inventory and must not be discoverable.`,
    );
  }
}

export { isDeletedAiSearchUrl };
