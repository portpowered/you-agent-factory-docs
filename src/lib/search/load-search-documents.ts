/**
 * Shared load path for search documents used by the live search server and by
 * static-export search-index emission.
 *
 * Registry indexes are loaded once per call to `loadSearchDocumentsByLocale`
 * and reused across locales. Page/blog walks still run per locale (content
 * differs), but they go through the process-scoped page-load caches.
 */

import type { DocsPageSource } from "@/lib/content/pages";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { loadRegistry, type RegistryIndexes } from "@/lib/content/registry";
import { type SiteLocale, supportedLocales } from "@/lib/i18n/locale-routing";
import {
  type BlogSearchPostSource,
  loadBlogSearchPostSources,
} from "./build-blog-search-document";
import { buildSearchDocumentsForLocale } from "./build-documents";
import type { SearchDocument } from "./types";

export type LoadSearchDocumentsByLocaleOptions = {
  locales?: readonly SiteLocale[];
  loadRegistryFn?: () => Promise<RegistryIndexes>;
  loadPagesFn?: (locale: SiteLocale) => Promise<DocsPageSource[]>;
  loadBlogPostsFn?: (locale: SiteLocale) => Promise<BlogSearchPostSource[]>;
};

let searchDocumentBuildCount = 0;

export function buildSearchDocumentsFromParsedSources(
  locale: SiteLocale,
  indexes: RegistryIndexes,
  pages: DocsPageSource[],
  blogPosts: BlogSearchPostSource[] = [],
): SearchDocument[] {
  searchDocumentBuildCount += 1;
  return buildSearchDocumentsForLocale(locale, indexes, pages, blogPosts);
}

/**
 * Load registry once, then pages/blogs per locale, and build search documents
 * for every requested locale from that shared parsed data.
 */
export async function loadSearchDocumentsByLocale(
  options: LoadSearchDocumentsByLocaleOptions = {},
): Promise<ReadonlyMap<SiteLocale, SearchDocument[]>> {
  const locales = options.locales ?? supportedLocales;
  const loadRegistryFn = options.loadRegistryFn ?? (() => loadRegistry());
  const loadPagesFn =
    options.loadPagesFn ??
    ((locale: SiteLocale) => loadShippedLocalizedDocsPages(locale));
  const loadBlogPostsFn =
    options.loadBlogPostsFn ??
    ((locale: SiteLocale) => loadBlogSearchPostSources({ locale }));

  const indexes = await loadRegistryFn();
  const documentsByLocale = new Map<SiteLocale, SearchDocument[]>();

  for (const locale of locales) {
    const [pages, blogPosts] = await Promise.all([
      loadPagesFn(locale),
      loadBlogPostsFn(locale),
    ]);
    documentsByLocale.set(
      locale,
      buildSearchDocumentsFromParsedSources(locale, indexes, pages, blogPosts),
    );
  }

  return documentsByLocale;
}

/** Load search documents for one locale using the shared registry cache. */
export async function loadSearchDocumentsForLocale(
  locale: SiteLocale,
  options: Omit<LoadSearchDocumentsByLocaleOptions, "locales"> = {},
): Promise<SearchDocument[]> {
  const byLocale = await loadSearchDocumentsByLocale({
    ...options,
    locales: [locale],
  });
  return byLocale.get(locale) ?? [];
}

/** Test helper: reset document-build counter. */
export function resetSearchDocumentBuildCountForTests(): void {
  searchDocumentBuildCount = 0;
}

/** Test helper: how many times documents were built from parsed sources. */
export function getSearchDocumentBuildCountForTests(): number {
  return searchDocumentBuildCount;
}
