import type * as PageTree from "fumadocs-core/page-tree";
import {
  isDirectDocsRouteFamilyId,
  isDirectDocsRouteFamilySlug,
} from "@/lib/content/docs-catch-all-static-params";
import type { DirectDocsRouteFamilyId } from "@/lib/docs/collection-definition-contract";
import {
  buildLocalizedRoute,
  defaultLocale,
  matchLocalizedRoute,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
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

export type FamilyDocsFooterIndexOptions = {
  /** Reader-visible family index label (topology `messages.nav.*`). */
  indexLabel: string;
  locale?: SiteLocale;
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
 * Resolve the W15 direct route family for a docs URL (index or nested),
 * including locale-prefixed paths. Non-family docs URLs return null.
 */
export function resolveDirectDocsRouteFamilyFromUrl(
  url: string,
): DirectDocsRouteFamilyId | null {
  const match = matchLocalizedRoute(url);
  if (match.kind !== "matched") {
    return null;
  }
  if (match.destination.surface !== "docs-page") {
    return null;
  }
  if (!isDirectDocsRouteFamilySlug(match.destination.slug)) {
    return null;
  }
  const section = match.destination.slug.split("/")[0];
  if (!section || !isDirectDocsRouteFamilyId(section)) {
    return null;
  }
  return section;
}

/**
 * Linearize one W15 family for previous/next: family index (synthetic when
 * absent from the page tree) followed by that family's published nested pages
 * in page-tree order. Keeps neighbors inside the family topology.
 */
export function collectFamilyDocsFooterPageItems(
  root: PageTree.Root,
  familyId: DirectDocsRouteFamilyId,
  options: FamilyDocsFooterIndexOptions,
): FactoryFooterNeighbor[] {
  const locale = options.locale ?? defaultLocale;
  const indexUrl = buildLocalizedRoute(
    { surface: "docs-page", slug: familyId },
    locale,
  );
  const nestedPrefix = `${indexUrl}/`;
  const nested = collectDocsFooterPageItems(root).filter(
    (item) => item.url === indexUrl || item.url.startsWith(nestedPrefix),
  );

  const withoutDuplicateIndex = nested.filter((item) => item.url !== indexUrl);
  return [
    { name: options.indexLabel, url: indexUrl },
    ...withoutDuplicateIndex,
  ];
}

/**
 * Resolve previous/next for a W15 family page from that family's settled
 * page-tree linearization only. Returns null when the URL is outside the four
 * route families so callers can keep the global footer. Omits a direction at
 * family edges instead of crossing into another family or CLI collection.
 */
export function resolveFamilyScopedDocsFooterNeighbors(
  root: PageTree.Root,
  url: string,
  options: FamilyDocsFooterIndexOptions,
): FactoryFooterNeighbors | null {
  const familyId = resolveDirectDocsRouteFamilyFromUrl(url);
  if (!familyId) {
    return null;
  }

  const match = matchLocalizedRoute(url);
  const locale =
    match.kind === "matched" ? match.locale : (options.locale ?? defaultLocale);
  const footerList = collectFamilyDocsFooterPageItems(root, familyId, {
    indexLabel: options.indexLabel,
    locale,
  });
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
 * DocsPage `footer` prop for a family URL: custom items when a neighbor
 * exists, otherwise disable the footer. Returns undefined for non-family URLs
 * so the default global Fumadocs footer remains.
 */
export function toFamilyDocsPageFooterOptions(
  neighbors: FactoryFooterNeighbors | null,
): { items: FactoryFooterNeighbors } | { enabled: false } | undefined {
  if (neighbors === null) {
    return undefined;
  }
  if (!neighbors.previous && !neighbors.next) {
    return { enabled: false };
  }
  return { items: neighbors };
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
