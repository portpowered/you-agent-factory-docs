import { defaultLocale, supportedLocales } from "@/lib/i18n/locale-routing";

/**
 * Retired Atlas public route families that must never appear as live search
 * document URLs after domain cleanup. Mirrors the governance denylist route
 * families without importing the audit module into the search boundary.
 */
export const RETIRED_ATLAS_SEARCH_URL_PREFIXES = [
  "/docs/models",
  "/docs/modules",
  "/docs/papers",
  "/docs/training",
  "/docs/systems",
] as const;

export type RetiredAtlasSearchUrlPrefix =
  (typeof RETIRED_ATLAS_SEARCH_URL_PREFIXES)[number];

/**
 * Deleted Atlas blog posts that must stay out of public search documents and
 * `/api/search` results.
 */
export const DELETED_ATLAS_BLOG_URLS = [
  "/blog/evolution-of-diffusion",
  "/blog/llms-no-longer-wholly-reliant-on-the-internet",
  "/blog/roofline-throughput-explorer",
] as const;

export type DeletedAtlasBlogUrl = (typeof DELETED_ATLAS_BLOG_URLS)[number];

/**
 * Representative deleted Atlas record URLs used by discovery proofs (module /
 * blog destinations that previously ranked for Atlas-era queries).
 */
export const DELETED_ATLAS_RECORD_URLS = [
  "/docs/modules/grouped-query-attention",
  ...DELETED_ATLAS_BLOG_URLS,
] as const;

export type DeletedAtlasRecordUrl = (typeof DELETED_ATLAS_RECORD_URLS)[number];

const DELETED_ATLAS_BLOG_URL_SET = new Set<string>(DELETED_ATLAS_BLOG_URLS);

function pathnameOnly(url: string): string {
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");
  const splitIndex =
    queryIndex === -1
      ? hashIndex
      : hashIndex === -1
        ? queryIndex
        : Math.min(queryIndex, hashIndex);

  return splitIndex === -1 ? url : url.slice(0, splitIndex);
}

/**
 * Strip a shipped non-default locale prefix so retired-route matching works for
 * `/ja/docs/modules/...` as well as `/docs/modules/...`.
 */
export function stripSearchUrlLocalePrefix(url: string): string {
  const path = pathnameOnly(url);

  for (const locale of supportedLocales) {
    if (locale === defaultLocale) {
      continue;
    }

    const prefix = `/${locale}`;
    if (path === prefix) {
      return "/";
    }
    if (path.startsWith(`${prefix}/`)) {
      return path.slice(prefix.length);
    }
  }

  return path;
}

export function isDeletedAiSearchUrl(url: string): boolean {
  const path = stripSearchUrlLocalePrefix(url);

  if (DELETED_ATLAS_BLOG_URL_SET.has(path)) {
    return true;
  }

  for (const prefix of RETIRED_ATLAS_SEARCH_URL_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  return false;
}

/**
 * Fail closed when a search document URL points at deleted Atlas inventory so
 * public search indexes never reintroduce retired models/modules/papers/
 * training/systems/blog destinations.
 */
export function assertNoDeletedAiSearchUrl(url: string): void {
  if (!isDeletedAiSearchUrl(url)) {
    return;
  }

  throw new Error(
    `Search document URL "${url}" points at deleted Atlas inventory and must not enter the public search index.`,
  );
}

export function assertNoDeletedAiSearchDocuments(
  documents: ReadonlyArray<{ url: string }>,
): void {
  for (const document of documents) {
    assertNoDeletedAiSearchUrl(document.url);
  }
}
