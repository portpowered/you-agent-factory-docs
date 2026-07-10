import { pageKindSchema } from "@/lib/content/schemas";
import {
  DELETED_ATLAS_BLOG_URLS,
  isDeletedAiSearchUrl,
  RETIRED_ATLAS_SEARCH_URL_PREFIXES,
} from "@/lib/search/factory-search-deleted-records";
import {
  BLOG_SEARCH_DOCUMENT_KIND,
  FACTORY_SEARCH_RESULT_KINDS,
} from "@/lib/search/factory-search-kinds";

/**
 * Published factory tag slugs that remain live after Atlas tag purge.
 * Tags index / landings must stay within this set (or future factory tags),
 * never reintroducing deleted Atlas-only tags.
 */
export const FACTORY_PUBLISHED_TAG_SLUGS = [
  "taxonomy",
  "foundations",
  "local-models",
] as const;

export type FactoryPublishedTagSlug =
  (typeof FACTORY_PUBLISHED_TAG_SLUGS)[number];

/**
 * Deleted Atlas-only tag slugs that must not appear as live tag-index or
 * tag-landing destinations after domain cleanup.
 */
export const DELETED_ATLAS_TAG_SLUGS = [
  "model-family",
  "inference",
  "alignment",
] as const;

export type DeletedAtlasTagSlug = (typeof DELETED_ATLAS_TAG_SLUGS)[number];

/**
 * Kind order for tag-landing resource groups on the factory-only site.
 * Matches public search/page kinds; retired Atlas kinds are omitted.
 */
export const FACTORY_TAG_RESOURCE_KIND_ORDER = [
  ...pageKindSchema.options,
  BLOG_SEARCH_DOCUMENT_KIND,
] as const;

export type FactoryTagResourceKind =
  (typeof FACTORY_TAG_RESOURCE_KIND_ORDER)[number];

/**
 * Live tag-category sort order for the factory tags index. Atlas-era category
 * ids may still exist in the schema for residual records, but published
 * factory tags today use architecture / inference.
 */
export const FACTORY_TAG_CATEGORY_ORDER = [
  "architecture",
  "inference",
  "systems",
  "difficulty",
] as const;

const DELETED_ATLAS_TAG_SLUG_SET = new Set<string>(DELETED_ATLAS_TAG_SLUGS);

const FACTORY_TAG_RESOURCE_KIND_SET = new Set<string>(
  FACTORY_TAG_RESOURCE_KIND_ORDER,
);

export function isDeletedAtlasTagSlug(slug: string): boolean {
  return DELETED_ATLAS_TAG_SLUG_SET.has(slug);
}

export function isFactoryTagResourceKind(
  kind: string,
): kind is FactoryTagResourceKind {
  return FACTORY_TAG_RESOURCE_KIND_SET.has(kind);
}

/**
 * Fail closed when a published tag slug is a deleted Atlas-only tag so the
 * tags index never advertises retired destinations.
 */
export function assertNoDeletedAtlasTagSlug(slug: string): void {
  if (!isDeletedAtlasTagSlug(slug)) {
    return;
  }

  throw new Error(
    `Tag slug "${slug}" is a deleted Atlas-only tag and must not appear on the public tags index or tag landings.`,
  );
}

export function assertNoDeletedAtlasTagSlugs(slugs: Iterable<string>): void {
  for (const slug of slugs) {
    assertNoDeletedAtlasTagSlug(slug);
  }
}

/**
 * Fail closed when a tag-landing resource URL points at deleted Atlas
 * inventory (retired collection routes or deleted Atlas blog posts).
 */
export function assertFactoryTagResourceUrl(url: string): void {
  if (!isDeletedAiSearchUrl(url)) {
    return;
  }

  throw new Error(
    `Tag resource URL "${url}" points at deleted Atlas inventory and must not appear on factory tag landings.`,
  );
}

export function assertFactoryTagResourceEntries(
  entries: ReadonlyArray<{ url: string; kind: string }>,
): void {
  for (const entry of entries) {
    assertFactoryTagResourceUrl(entry.url);
    if (!isFactoryTagResourceKind(entry.kind)) {
      throw new Error(
        `Tag resource kind "${entry.kind}" at "${entry.url}" is outside the factory tag-resource kind set (${FACTORY_SEARCH_RESULT_KINDS.join(", ")}).`,
      );
    }
  }
}

export { DELETED_ATLAS_BLOG_URLS, RETIRED_ATLAS_SEARCH_URL_PREFIXES };
