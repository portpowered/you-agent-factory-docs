import type * as PageTree from "fumadocs-core/page-tree";
import {
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  isDeletedAiSearchUrl,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
} from "@/lib/search/factory-search-deleted-records";

/**
 * Reader-visible previous/next and related-link destinations must stay on
 * published factory pages after domain cleanup. Deleted Atlas inventory must
 * never appear as footer neighbors or related hrefs.
 */
export {
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
};

export type FactoryFooterNeighbor = {
  name: string;
  url: string;
};

export type FactoryFooterNeighbors = {
  previous?: FactoryFooterNeighbor;
  next?: FactoryFooterNeighbor;
};

/**
 * Linearize the docs page tree the same way Fumadocs `useFooterItems` does so
 * previous/next proofs match the live footer cards.
 */
export function collectDocsFooterPageItems(
  root: PageTree.Root,
): FactoryFooterNeighbor[] {
  const list: FactoryFooterNeighbor[] = [];

  function onNode(node: PageTree.Node): void {
    if (node.type === "folder") {
      if (node.index) {
        onNode(node.index);
      }
      for (const child of node.children) {
        onNode(child);
      }
      return;
    }

    if (node.type === "page" && !node.external) {
      list.push({
        name: String(node.name),
        url: node.url,
      });
    }
  }

  for (const child of root.children) {
    onNode(child);
  }

  return list;
}

/**
 * Resolve previous/next footer neighbors for a docs URL from the live page
 * tree. Omits a direction when there is no neighbor. Fail-closed on deleted
 * Atlas destinations.
 */
export function resolveFactoryDocsFooterNeighbors(
  root: PageTree.Root,
  url: string,
): FactoryFooterNeighbors {
  const footerList = collectDocsFooterPageItems(root);
  const idx = footerList.findIndex((item) => item.url === url);
  if (idx === -1) {
    return {};
  }

  const neighbors: FactoryFooterNeighbors = {
    previous: footerList[idx - 1],
    next: footerList[idx + 1],
  };
  assertFactoryFooterNeighbors(neighbors);
  return neighbors;
}

/**
 * Fail closed when a previous/next or related href points at deleted Atlas
 * inventory (retired collection routes or deleted Atlas blog posts).
 */
export function assertFactoryNavDestinationUrl(url: string): void {
  if (!isDeletedAiSearchUrl(url)) {
    return;
  }

  throw new Error(
    `Navigation destination "${url}" points at deleted Atlas inventory and must not appear in previous/next or related links.`,
  );
}

export function assertFactoryNavDestinationUrls(urls: Iterable<string>): void {
  for (const url of urls) {
    assertFactoryNavDestinationUrl(url);
  }
}

/**
 * Fail closed when footer previous/next neighbors advertise deleted Atlas
 * destinations.
 */
export function assertFactoryFooterNeighbors(
  neighbors: FactoryFooterNeighbors,
): void {
  if (neighbors.previous) {
    assertFactoryNavDestinationUrl(neighbors.previous.url);
  }
  if (neighbors.next) {
    assertFactoryNavDestinationUrl(neighbors.next.url);
  }
}

/**
 * Fail closed when related-link items include deleted Atlas hrefs. Items
 * without an href (planned / unavailable) are allowed and skipped.
 */
export function assertFactoryRelatedLinkItems(
  items: ReadonlyArray<{ href?: string | null }>,
): void {
  for (const item of items) {
    if (!item.href) {
      continue;
    }
    assertFactoryNavDestinationUrl(item.href);
  }
}
