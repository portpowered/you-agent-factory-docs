import type { SortedResult } from "fumadocs-core/search";
import {
  ontologyRelationshipPriority,
  relationshipOutranksClassificationSibling,
} from "@/lib/content/ontology-peer-policy";
import type { SearchClassificationScope } from "./classification-scope";
import {
  isReferenceItemSearchDocument,
  pageBaseUrl,
  referenceItemDocumentForResultUrl,
  resolveReferenceItemDeepLinkUrl,
} from "./collapse-search-results-to-page-hits";
import {
  BLOG_SEARCH_DOCUMENT_KIND,
  REFERENCE_SEARCH_DOCUMENT_KIND,
} from "./factory-search-kinds";
import { expandTopologySearchTerm } from "./topology-search-terms";
import type { SearchDocument } from "./types";

/**
 * Cross-collection bands for non-exact search hits (lower = higher rank).
 * Exact / near-exact page and exact inventory wins stay above this ladder.
 */
export const SEARCH_COLLECTION_BAND = {
  guide: 0,
  curatedReferencePage: 1,
  other: 2,
  blog: 3,
  referenceSubfield: 4,
} as const;

export type SearchCollectionBand =
  (typeof SEARCH_COLLECTION_BAND)[keyof typeof SEARCH_COLLECTION_BAND];

/**
 * Classify a hit into the locked non-exact collection ladder:
 * guides → curated reference owning pages → other → blog → reference
 * subheaders / subfields.
 */
export function searchCollectionBand(
  result: SortedResult,
  document: SearchDocument | undefined,
): SearchCollectionBand {
  if (isReferenceHeadingSpamResult(result)) {
    return SEARCH_COLLECTION_BAND.referenceSubfield;
  }

  // Avoid `isReferenceItemSearchDocument` here: its type predicate narrows the
  // false branch to `undefined`, which breaks later `document.kind` reads.
  if (
    document !== undefined &&
    document.kind === REFERENCE_SEARCH_DOCUMENT_KIND &&
    document.url.includes("#")
  ) {
    return SEARCH_COLLECTION_BAND.referenceSubfield;
  }

  const deepLink = resolveReferenceItemDeepLinkUrl(result.url);
  if (deepLink !== undefined) {
    return SEARCH_COLLECTION_BAND.referenceSubfield;
  }

  const kind = document?.kind;
  if (kind === "guide") {
    return SEARCH_COLLECTION_BAND.guide;
  }

  if (kind === REFERENCE_SEARCH_DOCUMENT_KIND) {
    return SEARCH_COLLECTION_BAND.curatedReferencePage;
  }

  if (kind === BLOG_SEARCH_DOCUMENT_KIND) {
    return SEARCH_COLLECTION_BAND.blog;
  }

  const base = pageBaseUrl(result.url);
  if (base.startsWith("/docs/guides/") || base === "/docs/guides") {
    return SEARCH_COLLECTION_BAND.guide;
  }

  if (base.startsWith("/docs/references/") || base === "/docs/references") {
    return SEARCH_COLLECTION_BAND.curatedReferencePage;
  }

  if (base.startsWith("/blog/") || base === "/blog") {
    return SEARCH_COLLECTION_BAND.blog;
  }

  return SEARCH_COLLECTION_BAND.other;
}

function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function slugFromUrl(url: string): string {
  const segment = url.split("/").pop() ?? "";
  return segment.replace(/-/g, " ");
}

function hasExactTagMatch(query: string, document: SearchDocument): boolean {
  const normalizedQuery = normalizeSearchTerm(query);
  return document.tags.some(
    (tag) => normalizeSearchTerm(tag) === normalizedQuery,
  );
}

function normalizedTopologyTermVariants(value: string): string[] {
  return expandTopologySearchTerm(value).map(normalizeSearchTerm);
}

function topologyTermMatchesQuery(query: string, term: string): boolean {
  const queryVariants = normalizedTopologyTermVariants(query);
  const termVariants = normalizedTopologyTermVariants(term);

  return queryVariants.some((queryVariant) => {
    if (queryVariant.length < 3) {
      return termVariants.includes(queryVariant);
    }

    return termVariants.some(
      (termVariant) =>
        termVariant === queryVariant ||
        termVariant.startsWith(queryVariant) ||
        termVariant.includes(` ${queryVariant} `),
    );
  });
}

function topologyTermsMatchQuery(query: string, terms: string[]): boolean {
  return terms.some((term) => topologyTermMatchesQuery(query, term));
}

function topologyRelationshipTerms(document: SearchDocument): string[] {
  return document.topology.relationships.flatMap((relationship) => [
    relationship.relationshipType,
    relationship.targetId,
    relationship.targetSlug ?? "",
    ...relationship.targetAliases,
  ]);
}

function matchingRelationshipPriority(
  predicate: (
    relationship: SearchDocument["topology"]["relationships"][number],
  ) => boolean,
  document: SearchDocument,
): { priority: number; outranksClassificationSibling: boolean } | undefined {
  const matchingRelationships =
    document.topology.relationships.filter(predicate);
  if (matchingRelationships.length === 0) {
    return undefined;
  }

  let bestPriority = Number.POSITIVE_INFINITY;
  let outranksSibling = false;

  for (const relationship of matchingRelationships) {
    bestPriority = Math.min(
      bestPriority,
      ontologyRelationshipPriority(relationship.relationshipType),
    );
    if (
      relationshipOutranksClassificationSibling(relationship.relationshipType)
    ) {
      outranksSibling = true;
    }
  }

  return {
    priority: bestPriority,
    outranksClassificationSibling: outranksSibling,
  };
}

function topologyMatchPriority(
  query: string,
  document: SearchDocument | undefined,
): number {
  if (!document || !query.trim()) {
    return 3;
  }

  if (
    document.topology.primaryClassification &&
    topologyTermsMatchQuery(
      query,
      document.topology.primaryClassification.terms,
    )
  ) {
    return 0;
  }

  const relationshipPriority = matchingRelationshipPriority(
    (relationship) =>
      topologyTermsMatchQuery(query, [
        relationship.relationshipType,
        relationship.targetId,
        relationship.targetSlug ?? "",
        ...relationship.targetAliases,
      ]),
    document,
  );
  if (relationshipPriority?.outranksClassificationSibling) {
    return 1 + relationshipPriority.priority;
  }

  if (
    document.topology.secondaryClassifications.some((classification) =>
      topologyTermsMatchQuery(query, classification.terms),
    )
  ) {
    return 10;
  }

  if (relationshipPriority) {
    return 20 + relationshipPriority.priority;
  }

  if (topologyTermsMatchQuery(query, topologyRelationshipTerms(document))) {
    return 30;
  }

  return 40;
}

function classificationScopePriority(
  scope: SearchClassificationScope | undefined,
  document: SearchDocument | undefined,
): number {
  if (!scope || !document) {
    return 3;
  }

  if (document.topology.primaryClassificationId === scope.id) {
    return 0;
  }

  if (document.topology.secondaryClassificationIds.includes(scope.id)) {
    return 1;
  }

  if (document.topology.ancestorClassificationIds?.includes(scope.id)) {
    return 2;
  }

  const relationshipPriority = matchingRelationshipPriority(
    (relationship) => relationship.targetId === scope.id,
    document,
  );
  if (relationshipPriority?.outranksClassificationSibling) {
    return 3 + relationshipPriority.priority;
  }

  if (
    topologyTermsMatchQuery(scope.label, document.topology.terms) ||
    topologyTermsMatchQuery(scope.slug, document.topology.terms) ||
    topologyTermsMatchQuery(scope.requested, document.topology.terms)
  ) {
    return 20;
  }

  if (relationshipPriority) {
    return 30 + relationshipPriority.priority;
  }

  return 40;
}

function scoreDocumentMatch(query: string, document: SearchDocument): number {
  const normalizedQuery = normalizeSearchTerm(query);
  const normalizedTitle = normalizeSearchTerm(document.title);

  if (normalizedTitle === normalizedQuery) {
    return 100;
  }

  for (const alias of document.directAliases) {
    if (normalizeSearchTerm(alias) === normalizedQuery) {
      return 95;
    }
  }

  const normalizedSlug = normalizeSearchTerm(slugFromUrl(document.url));
  if (normalizedSlug === normalizedQuery) {
    return 90;
  }

  return 0;
}

function titleMatchKindPriority(kind: string): number {
  if (kind === "concept") {
    return 0;
  }
  if (kind === "glossary") {
    return 1;
  }
  if (kind === "paper") {
    return 2;
  }
  if (kind === "module") {
    return 3;
  }
  return 4;
}

function shouldReplaceBestTitleMatch(
  currentBestUrl: string | undefined,
  currentBestScore: number,
  candidateUrl: string,
  candidateScore: number,
  documentsByUrl: Map<string, SearchDocument>,
): boolean {
  if (candidateScore > currentBestScore) {
    return true;
  }

  if (
    candidateScore < 90 ||
    candidateScore !== currentBestScore ||
    !currentBestUrl
  ) {
    return false;
  }

  const currentBestDocument = documentsByUrl.get(currentBestUrl);
  const candidateDocument = documentsByUrl.get(candidateUrl);
  if (!currentBestDocument || !candidateDocument) {
    return false;
  }

  return (
    titleMatchKindPriority(candidateDocument.kind) <
    titleMatchKindPriority(currentBestDocument.kind)
  );
}

export function findBestTitleMatchPageUrl(
  query: string,
  documentsByUrl: Map<string, SearchDocument>,
): string | undefined {
  let bestUrl: string | undefined;
  let bestScore = 0;

  for (const [url, document] of documentsByUrl) {
    // Page-title seeding is for bare owning pages only; reference item
    // deep-links are ranked separately so they are not reduced to a page seed.
    if (isReferenceItemSearchDocument(document)) {
      continue;
    }

    const score = scoreDocumentMatch(query, document);
    if (
      shouldReplaceBestTitleMatch(
        bestUrl,
        bestScore,
        url,
        score,
        documentsByUrl,
      )
    ) {
      bestScore = score;
      bestUrl = url;
    }
  }

  if (bestScore < 90 || !bestUrl) {
    return undefined;
  }

  const bestDocument = documentsByUrl.get(bestUrl);
  if (bestDocument?.kind !== "glossary" || !bestDocument.registryId) {
    return bestUrl;
  }

  for (const [url, document] of documentsByUrl) {
    if (
      document.kind === "concept" &&
      document.registryId === bestDocument.registryId &&
      scoreDocumentMatch(query, document) >= 95
    ) {
      return url;
    }
  }

  return bestUrl;
}

function resolveResultDocument(
  resultUrl: string,
  documentsByUrl: Map<string, SearchDocument>,
): SearchDocument | undefined {
  return (
    referenceItemDocumentForResultUrl(resultUrl, documentsByUrl) ??
    documentsByUrl.get(pageBaseUrl(resultUrl))
  );
}

/**
 * Leftover Fumadocs heading rows under `/docs/references/**` (including
 * `#heading-N` fragments) must not outrank page-title hits for generic queries.
 */
function isReferenceHeadingSpamResult(result: SortedResult): boolean {
  const base = pageBaseUrl(result.url);
  const isReferencePath =
    base === "/docs/references" || base.startsWith("/docs/references/");
  if (!isReferencePath) {
    return false;
  }

  if (result.type === "heading") {
    return true;
  }

  const hashIndex = result.url.indexOf("#");
  if (hashIndex < 0) {
    return false;
  }

  const firstFragment = result.url.slice(hashIndex + 1).split("#")[0] ?? "";
  return /^heading-\d+$/i.test(firstFragment);
}

function resultPriority(
  query: string,
  scope: SearchClassificationScope | undefined,
  bestPageUrl: string | undefined,
  result: SortedResult,
  document: SearchDocument | undefined,
): number {
  const resultUrl = result.url;
  const resultBaseUrl = pageBaseUrl(resultUrl);

  // Demote residual reference heading / #heading-N spam first so owning-page
  // title resolution cannot promote those fragment rows.
  if (isReferenceHeadingSpamResult(result)) {
    return 40;
  }

  // Every page-level title/slug/alias match ranks above weak inventory noise.
  // Generic queries like "mcp" must surface /docs/references/mcp-reference and
  // documentation MCP pages ahead of tool/session item floods — not only the
  // single best seeded URL. Fragment URLs that are not inventory items must
  // not inherit the owning page's title score.
  if (
    document &&
    !resultUrl.includes("#") &&
    !isReferenceItemSearchDocument(document) &&
    scoreDocumentMatch(query, document) >= 90
  ) {
    return 0;
  }

  if (resultUrl === bestPageUrl || resultBaseUrl === bestPageUrl) {
    // Only bare page URLs (or the seeded best URL itself) receive the seed
    // boost — not heading fragments that share the same base path.
    if (!resultUrl.includes("#") || resultUrl === bestPageUrl) {
      return 0;
    }
  }

  // Exact title / direct-alias matches on reference items outrank incidental
  // owning-page body hits for the same query.
  if (
    isReferenceItemSearchDocument(document) &&
    scoreDocumentMatch(query, document) >= 95
  ) {
    return 1;
  }

  const scopePriority = classificationScopePriority(scope, document);
  if (scopePriority < 3) {
    return 5 + scopePriority;
  }

  const topologyPriority = topologyMatchPriority(query, document);
  if (topologyPriority < 3) {
    return 10 + topologyPriority;
  }

  if (document && hasExactTagMatch(query, document)) {
    return document.kind === "module" ? 20 : 21;
  }

  return 30;
}

/**
 * Boost exact title, direct-alias, slug, and topology matches so canonical and
 * ontology-near pages rank above incidental body hits. After those exact /
 * near-exact and inventory wins, non-exact ties follow the locked collection
 * ladder (guides → curated reference pages → blog → reference subfields).
 */
export function rerankSearchResults(
  query: string,
  results: SortedResult[],
  documentsByUrl: Map<string, SearchDocument>,
  options: { classificationScope?: SearchClassificationScope } = {},
): SortedResult[] {
  const bestPageUrl = findBestTitleMatchPageUrl(query, documentsByUrl);
  const { classificationScope } = options;

  return results
    .map((result, index) => ({ result, index }))
    .sort((left, right) => {
      const leftDocument = resolveResultDocument(
        left.result.url,
        documentsByUrl,
      );
      const rightDocument = resolveResultDocument(
        right.result.url,
        documentsByUrl,
      );

      const leftPriority = resultPriority(
        query,
        classificationScope,
        bestPageUrl,
        left.result,
        leftDocument,
      );
      const rightPriority = resultPriority(
        query,
        classificationScope,
        bestPageUrl,
        right.result,
        rightDocument,
      );

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      // Collection ladder applies among non-exact hits only (priority > 1).
      // Exact page (0) and exact inventory (1) wins keep their primary order.
      if (leftPriority > 1) {
        const leftBand = searchCollectionBand(left.result, leftDocument);
        const rightBand = searchCollectionBand(right.result, rightDocument);
        if (leftBand !== rightBand) {
          return leftBand - rightBand;
        }
      }

      return left.index - right.index;
    })
    .map(({ result }) => result);
}
