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

  const hashIndex = resultUrl.indexOf("#");
  if (hashIndex < 0) {
    return undefined;
  }

  const base = resultUrl.slice(0, hashIndex);
  const firstFragment = resultUrl.slice(hashIndex + 1).split("#")[0];
  if (!firstFragment) {
    return undefined;
  }

  const candidate = `${base}#${firstFragment}`;
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
  document: SearchDocument,
): SortedResult {
  return {
    ...result,
    type: "page",
    url: document.url,
    id: document.id,
    content:
      result.type === "page" && result.content.trim().length > 0
        ? result.content
        : document.title,
  };
}

type CollapseBucket =
  | { kind: "item"; url: string }
  | { kind: "page"; baseUrl: string };

/**
 * Collapse fragment, heading, and duplicate page hits to one canonical row per
 * page URL — except registered reference item documents, which keep their
 * registry-anchor deep links so item hits are not crowded out by the owning page.
 */
export function collapseSearchResultsToPageHits(
  results: SortedResult[],
  documentsByUrl: Map<string, SearchDocument>,
): SortedResult[] {
  const order: CollapseBucket[] = [];
  const pageGroups = new Map<string, SortedResult[]>();
  const itemHits = new Map<string, SortedResult>();

  for (const result of results) {
    const itemDocument = referenceItemDocumentForResultUrl(
      result.url,
      documentsByUrl,
    );
    if (itemDocument) {
      if (!itemHits.has(itemDocument.url)) {
        itemHits.set(
          itemDocument.url,
          normalizeReferenceItemHit(result, itemDocument),
        );
        order.push({ kind: "item", url: itemDocument.url });
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
