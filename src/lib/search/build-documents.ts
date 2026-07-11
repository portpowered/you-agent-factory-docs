import type { DocsPageSource } from "@/lib/content/pages";
import type { RegistryIndexes } from "@/lib/content/registry";
import { buildBaseSearchDocument } from "./build-base-document";
import {
  type BlogSearchPostSource,
  buildBlogSearchDocuments,
} from "./build-blog-search-document";
import { enrichSearchDocument } from "./enrich-search-document";
import { assertNoDeletedAiSearchDocuments } from "./factory-search-deleted-records";
import { assertFactorySearchDocuments } from "./factory-search-kinds";
import type { SearchDocument } from "./types";

export function buildSearchDocuments(
  pages: DocsPageSource[],
  indexes: RegistryIndexes,
): SearchDocument[] {
  const documents = pages.map((page) =>
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
): SearchDocument[] {
  if (locale.trim() === "") {
    throw new Error("Search document locale must be non-empty.");
  }

  const documents = [
    ...buildSearchDocuments(pages, indexes),
    ...buildBlogSearchDocuments(blogPosts, indexes),
  ];
  assertFactorySearchDocuments(documents);
  assertNoDeletedAiSearchDocuments(documents);
  return documents;
}
