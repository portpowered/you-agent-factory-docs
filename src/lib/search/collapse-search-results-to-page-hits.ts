/**
 * Collapse fragment, heading, and duplicate page hits to one canonical row per
 * page URL — except reference item deep links (`/docs/references/…#…`), which
 * keep their registry-anchor URLs so item hits are not crowded out by the
 * owning page.
 *
 * Item identity may come from a registered document in `documentsByUrl` or,
 * when layout meta omits item rows for payload size (W16), from the URL shape
 * alone.
 */

import type { SortedResult } from "fumadocs-core/search";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "./factory-search-kinds";
import type { SearchDocument } from "./types";

export function pageBaseUrl(url: string): string {
  return url.split("#")[0] ?? url;
}

/**
 * True when the document is an addressable reference item (API operation,
 * schema field, CLI command, MCP tool, JS symbol, event variant) rather than
 * an owning reference page or ordinary docs page.
 */
export function isReferenceItemSearchDocument(
  document: SearchDocument | undefined,
): document is SearchDocument {
  return (
    document !== undefined &&
    document.kind === REFERENCE_SEARCH_DOCUMENT_KIND &&
    document.url.includes("#")
  );
}

/**
 * Canonical deep-link URL for a `/docs/references/…#…` hit (first fragment
 * only). Used when client layout meta omits item documents.
 */
export function resolveReferenceItemDeepLinkUrl(
  resultUrl: string,
): string | undefined {
  const hashIndex = resultUrl.indexOf("#");
  if (hashIndex < 0) {
    return undefined;
  }

  const base = resultUrl.slice(0, hashIndex);
  if (!base.includes("/docs/references/")) {
    return undefined;
  }

  const firstFragment = resultUrl.slice(hashIndex + 1).split("#")[0];
  if (!firstFragment) {
    return undefined;
  }
  // Fumadocs auto heading ids are not registry item anchors.
  if (/^heading-\d+$/i.test(firstFragment)) {
    return undefined;
  }

  return `${base}#${firstFragment}`;
}

/**
 * Resolve a search-hit URL to its registered reference item document.
 * Fumadocs may append extra heading fragments (`#item#heading-0`); match the
 * first fragment against the registry item URL.
 */
export function referenceItemDocumentForResultUrl(
  resultUrl: string,
  documentsByUrl: Map<string, SearchDocument>,
): SearchDocument | undefined {
  const exact = documentsByUrl.get(resultUrl);
  if (isReferenceItemSearchDocument(exact)) {
    return exact;
  }

  const candidate = resolveReferenceItemDeepLinkUrl(resultUrl);
  if (candidate === undefined) {
    return undefined;
  }

  const document = documentsByUrl.get(candidate);
  return isReferenceItemSearchDocument(document) ? document : undefined;
}

function isCanonicalPageHit(result: SortedResult): boolean {
  return result.type === "page" && result.url === pageBaseUrl(result.url);
}

function pickCanonicalHit(
  group: SortedResult[],
  document: SearchDocument | undefined,
): SortedResult {
  const baseUrl = pageBaseUrl(group[0]?.url ?? "");

  const canonicalPage = group.find(isCanonicalPageHit);
  if (canonicalPage) {
    return { ...canonicalPage, url: baseUrl };
  }

  const pageHit = group.find((result) => result.type === "page");
  if (pageHit) {
    return {
      ...pageHit,
      type: "page",
      url: baseUrl,
      content: document?.title ?? pageHit.content,
      id: document?.id ?? baseUrl,
    };
  }

  const title = document?.title ?? group[0]?.content ?? baseUrl;
  const seed = group[0];
  if (!seed) {
    return {
      id: baseUrl,
      type: "page",
      url: baseUrl,
      content: title,
    };
  }

  return {
    ...seed,
    type: "page",
    url: baseUrl,
    id: document?.id ?? baseUrl,
    content: title,
  };
}

function normalizeReferenceItemHit(
  result: SortedResult,
  itemUrl: string,
  document: SearchDocument | undefined,
): SortedResult {
  const titleFromFragment = itemUrl.split("#")[1] ?? itemUrl;
  return {
    ...result,
    type: "page",
    url: itemUrl,
    id: document?.id ?? itemUrl,
    content:
      result.type === "page" && result.content.trim().length > 0
        ? result.content
        : (document?.title ?? titleFromFragment),
  };
}

type CollapseBucket =
  | { kind: "item"; url: string }
  | { kind: "page"; baseUrl: string };

function documentsByUrlIncludesReferenceItems(
  documentsByUrl: Map<string, SearchDocument>,
): boolean {
  for (const document of documentsByUrl.values()) {
    if (isReferenceItemSearchDocument(document)) {
      return true;
    }
  }
  return false;
}

/**
 * Collapse fragment, heading, and duplicate page hits to one canonical row per
 * page URL — except reference item deep links, which keep their registry-anchor
 * URLs so item hits are not crowded out by the owning page.
 */
export function collapseSearchResultsToPageHits(
  results: SortedResult[],
  documentsByUrl: Map<string, SearchDocument>,
): SortedResult[] {
  const order: CollapseBucket[] = [];
  const pageGroups = new Map<string, SortedResult[]>();
  const itemHits = new Map<string, SortedResult>();
  // Server/API catalogs include item documents — require membership so ordinary
  // reference-page headings still collapse. Layout meta omits items for payload
  // size; then preserve `/docs/references/…#…` via URL shape alone.
  const allowUrlHeuristic =
    !documentsByUrlIncludesReferenceItems(documentsByUrl);

  for (const result of results) {
    const itemDocument = referenceItemDocumentForResultUrl(
      result.url,
      documentsByUrl,
    );
    const itemUrl =
      itemDocument?.url ??
      (allowUrlHeuristic
        ? resolveReferenceItemDeepLinkUrl(result.url)
        : undefined);
    if (itemUrl !== undefined) {
      if (!itemHits.has(itemUrl)) {
        itemHits.set(
          itemUrl,
          normalizeReferenceItemHit(result, itemUrl, itemDocument),
        );
        order.push({ kind: "item", url: itemUrl });
      }
      continue;
    }

    const base = pageBaseUrl(result.url);
    const existing = pageGroups.get(base);
    if (existing) {
      existing.push(result);
      continue;
    }
    order.push({ kind: "page", baseUrl: base });
    pageGroups.set(base, [result]);
  }

  return order.map((bucket) => {
    if (bucket.kind === "item") {
      const hit = itemHits.get(bucket.url);
      if (!hit) {
        throw new Error(
          `Missing preserved reference item hit for ${bucket.url}`,
        );
      }
      return hit;
    }

    return pickCanonicalHit(
      pageGroups.get(bucket.baseUrl) ?? [],
      documentsByUrl.get(bucket.baseUrl),
    );
  });
}
