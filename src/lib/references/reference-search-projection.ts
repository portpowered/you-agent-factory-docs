/**
 * Search projection helpers for W04 normalized reference items.
 *
 * Emits search-document *shapes* (including owning-page anchor URLs) for later
 * Orama wiring (W16). Does not register documents, build indexes, or touch
 * navigation / sitemap inventories.
 */

import {
  cloneReferenceLifecycle,
  cloneReferenceSourcePointer,
} from "./reference-display-projection";
import type {
  ReferenceFamily,
  ReferenceItem,
  ReferenceLifecycle,
  ReferenceSourcePointer,
} from "./reference-item";

/**
 * Default owning page paths for each reference family. Matches plan §11.2 /
 * route inventory (`/docs/references/api#…`, javascript-runtime, …).
 */
export const REFERENCE_FAMILY_PAGE_PATHS: Record<ReferenceFamily, string> = {
  api: "/docs/references/api",
  schema: "/docs/references/schema",
  cli: "/docs/references/cli",
  mcp: "/docs/references/mcp",
  javascript: "/docs/references/javascript-runtime",
  events: "/docs/references/events",
};

/** Search document kind reserved for addressable reference items. */
export const REFERENCE_SEARCH_DOCUMENT_KIND = "reference" as const;

/**
 * Orama-ready search document *shape* for one addressable reference item.
 * Intentionally separate from display projection fields so search and display
 * can evolve independently. Not wired into the live Orama index in this lane.
 */
export type ReferenceSearchDocumentShape = {
  id: string;
  kind: typeof REFERENCE_SEARCH_DOCUMENT_KIND;
  family: ReferenceFamily;
  title: string;
  /**
   * Published description when present. Absent when the contract omits it —
   * callers must not invent copy. W16 may coerce absent → `""` for Orama.
   */
  description?: string;
  /** Concatenated searchable text (title, description, aliases, extras). */
  bodyText: string;
  aliases: string[];
  /** Facet-style tags; always includes the family id. */
  tags: string[];
  /**
   * Owning-page URL with fragment (for example
   * `/docs/references/api#submitWorkBySessionId`).
   */
  url: string;
  /** URL fragment without `#`. */
  anchor: string;
  relatedIds: string[];
  source: ReferenceSourcePointer;
  lifecycle?: ReferenceLifecycle;
};

export type BuildReferenceSearchDocumentOptions = {
  /** Override the default family page path. */
  pagePath?: string;
  /** Extra searchable text appended to the default body. */
  extraBodyText?: string;
  /** Additional tags (family is always included). */
  tags?: readonly string[];
  relatedIds?: readonly string[];
};

/**
 * Resolve the default owning page path for a reference family.
 */
export function referencePagePathForFamily(family: ReferenceFamily): string {
  return REFERENCE_FAMILY_PAGE_PATHS[family];
}

/**
 * Build an owning-page anchor URL (`/docs/references/api#submitWorkBySessionId`).
 */
export function referenceAnchorUrl(pagePath: string, anchor: string): string {
  const base = pagePath.trim().replace(/\/$/, "");
  const fragment = anchor.trim().replace(/^#/, "");
  if (base.length === 0) {
    throw new Error(
      "Cannot build a reference anchor URL from an empty page path.",
    );
  }
  if (fragment.length === 0) {
    throw new Error(
      "Cannot build a reference anchor URL from an empty anchor fragment.",
    );
  }
  return `${base}#${fragment}`;
}

function buildBodyText(
  item: ReferenceItem,
  extraBodyText: string | undefined,
): string {
  const parts: string[] = [item.title];
  if (item.description !== undefined && item.description.length > 0) {
    parts.push(item.description);
  }
  for (const alias of item.aliases) {
    if (alias.length > 0) {
      parts.push(alias);
    }
  }
  if (extraBodyText !== undefined && extraBodyText.trim().length > 0) {
    parts.push(extraBodyText.trim());
  }
  return parts.join("\n");
}

function mergeTags(
  family: ReferenceFamily,
  extra: readonly string[] | undefined,
): string[] {
  const tags: string[] = [family];
  if (extra === undefined) {
    return tags;
  }
  for (const tag of extra) {
    if (tag.length > 0 && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

/**
 * Project one `ReferenceItem` into a search-document shape with an owning-page
 * anchor URL. Does not mutate the input item.
 */
export function projectReferenceItemToSearchDocument(
  item: ReferenceItem,
  options: BuildReferenceSearchDocumentOptions = {},
): ReferenceSearchDocumentShape {
  const pagePath = options.pagePath ?? referencePagePathForFamily(item.family);
  const document: ReferenceSearchDocumentShape = {
    id: item.id,
    kind: REFERENCE_SEARCH_DOCUMENT_KIND,
    family: item.family,
    title: item.title,
    bodyText: buildBodyText(item, options.extraBodyText),
    aliases: [...item.aliases],
    tags: mergeTags(item.family, options.tags),
    url: referenceAnchorUrl(pagePath, item.anchor),
    anchor: item.anchor,
    relatedIds: options.relatedIds !== undefined ? [...options.relatedIds] : [],
    source: cloneReferenceSourcePointer(item.source),
    lifecycle: cloneReferenceLifecycle(item.lifecycle),
  };

  if (item.description !== undefined) {
    document.description = item.description;
  }

  return document;
}

/**
 * Builder that emits one search-document shape per addressable item.
 * Stateful only for optional default page-path overrides; never touches Orama.
 */
export class ReferenceSearchDocumentBuilder {
  private readonly defaultPagePathByFamily: Partial<
    Record<ReferenceFamily, string>
  >;

  constructor(
    options: {
      pagePathByFamily?: Partial<Record<ReferenceFamily, string>>;
    } = {},
  ) {
    this.defaultPagePathByFamily = {
      ...(options.pagePathByFamily ?? {}),
    };
  }

  /**
   * Build one search document for an addressable item.
   */
  build(
    item: ReferenceItem,
    options: BuildReferenceSearchDocumentOptions = {},
  ): ReferenceSearchDocumentShape {
    const pagePath =
      options.pagePath ??
      this.defaultPagePathByFamily[item.family] ??
      referencePagePathForFamily(item.family);

    return projectReferenceItemToSearchDocument(item, {
      ...options,
      pagePath,
    });
  }

  /**
   * Build one search document per item (many items may share one public page).
   */
  buildMany(
    items: readonly ReferenceItem[],
    options: BuildReferenceSearchDocumentOptions = {},
  ): ReferenceSearchDocumentShape[] {
    return items.map((item) => this.build(item, options));
  }
}

/** Convenience factory matching other W04 `create*` helpers. */
export function createReferenceSearchDocumentBuilder(
  options: { pagePathByFamily?: Partial<Record<ReferenceFamily, string>> } = {},
): ReferenceSearchDocumentBuilder {
  return new ReferenceSearchDocumentBuilder(options);
}
