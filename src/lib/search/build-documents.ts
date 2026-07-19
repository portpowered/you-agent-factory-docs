import type { DocsPageSource } from "@/lib/content/pages";
import type { RegistryIndexes } from "@/lib/content/registry";
import { isDocumentationRouteMigrationOldBrowsePath } from "@/lib/seo/documentation-route-migration";
import { buildBaseSearchDocument } from "./build-base-document";
import {
  type BlogSearchPostSource,
  buildBlogSearchDocuments,
} from "./build-blog-search-document";
import { buildReferenceItemSearchDocuments } from "./build-reference-search-documents";
import { enrichSearchDocument } from "./enrich-search-document";
import { assertNoDeletedAiSearchDocuments } from "./factory-search-deleted-records";
import { assertFactorySearchDocuments } from "./factory-search-kinds";
import type { SearchDocument } from "./types";

export type BuildSearchDocumentsForLocaleOptions = {
  /**
   * Pre-built reference item documents (shared across locales). When omitted,
   * settled inventory shapes are adapted via `buildReferenceItemSearchDocuments`.
   */
  referenceItemDocuments?: readonly SearchDocument[];
};

/**
 * W18 move stubs keep static compatibility HTML but must not enter ordinary
 * public search documents. Family targets remain indexed via their own pages.
 */
function isOrdinarySearchDiscoverablePage(page: DocsPageSource): boolean {
  return (
    !isDocumentationRouteMigrationOldBrowsePath(page.url) &&
    !isDocumentationRouteMigrationOldBrowsePath(page.docsSlug)
  );
}

export function buildSearchDocuments(
  pages: DocsPageSource[],
  indexes: RegistryIndexes,
): SearchDocument[] {
  const documents = pages
    .filter(isOrdinarySearchDiscoverablePage)
    .map((page) =>
      enrichSearchDocument(buildBaseSearchDocument(page, indexes), indexes),
    );
  assertFactorySearchDocuments(documents);
  assertNoDeletedAiSearchDocuments(documents);
  return documents;
}

export function buildSearchDocument(
  page: DocsPageSource,
  indexes: RegistryIndexes,
): SearchDocument {
  const [document] = buildSearchDocuments([page], indexes);
  if (!document) {
    throw new Error("Expected a search document for the provided page.");
  }
  return document;
}

export function buildSearchDocumentsForLocale(
  locale: string,
  indexes: RegistryIndexes,
  pages: DocsPageSource[],
  blogPosts: BlogSearchPostSource[] = [],
  options: BuildSearchDocumentsForLocaleOptions = {},
): SearchDocument[] {
  if (locale.trim() === "") {
    throw new Error("Search document locale must be non-empty.");
  }

  const referenceItemDocuments =
    options.referenceItemDocuments ?? buildReferenceItemSearchDocuments();

  const documents = [
    ...buildSearchDocuments(pages, indexes),
    ...buildBlogSearchDocuments(blogPosts, indexes),
    ...referenceItemDocuments,
  ];
  assertFactorySearchDocuments(documents);
  assertNoDeletedAiSearchDocuments(documents);
  return documents;
}
