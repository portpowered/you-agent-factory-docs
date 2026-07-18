/**
 * Tag-grouped operation navigation model for the W08 production API surface.
 *
 * Builds pure projection data from W04 `OpenApiOperationSummary` rows (same
 * corpus as the single-page OpenAPI projection). Does not invent tags or
 * anchors — uses published OpenAPI tags and provisional W04 anchors.
 */

import type {
  OpenApiHttpMethod,
  OpenApiOperationSummary,
} from "@/lib/references/family-normalized-models";

/** Sentinel tag label for operations that omit OpenAPI tags. */
export const API_OPERATION_UNTAGGED_GROUP = "Untagged" as const;

/** Accessible name for page-local operation navigation. */
export const API_OPERATION_NAV_ARIA_LABEL = "API operations by tag" as const;

/** Marker attribute on the desktop tag-grouped navigator host. */
export const API_OPERATION_NAV_ATTR = "data-api-operation-navigator" as const;

/** Marker attribute on the phone/tablet collapsible navigator host. */
export const API_MOBILE_NAV_ATTR = "data-api-mobile-navigator" as const;

/** Marker attribute on the mobile open-list scroll region. */
export const API_MOBILE_NAV_LIST_ATTR =
  "data-api-mobile-navigator-list" as const;

/** Marker attribute on each operation deep-link. */
export const API_OPERATION_NAV_LINK_ATTR =
  "data-api-operation-nav-link" as const;

/** Phone viewport used for W08 mobile nav probes (matches CRITICAL_VIEWPORTS.mobile). */
export const API_PHONE_VIEWPORT = {
  id: "mobile",
  label: "Mobile",
  width: 390,
  height: 844,
} as const;

export type ApiOperationNavItem = {
  /** Stable item id from W04 (prefer published operationId). */
  id: string;
  method: OpenApiHttpMethod;
  path: string;
  summary?: string;
  operationId?: string;
  /** URL fragment without `#` — matches the operation section id. */
  anchor: string;
  /** Published OpenAPI tags for this operation (may be empty). */
  tags: readonly string[];
};

export type ApiOperationNavGroup = {
  /** OpenAPI tag name (or {@link API_OPERATION_UNTAGGED_GROUP}). */
  tag: string;
  /** Optional document-level tag description when provided. */
  description?: string;
  items: readonly ApiOperationNavItem[];
};

export type ApiOperationNavModel = {
  groups: readonly ApiOperationNavGroup[];
  /** Flat item count across groups (multi-tag ops may appear more than once). */
  linkCount: number;
  /** Distinct operation ids represented in the model. */
  operationCount: number;
};

export type ApiMobileNavContract = {
  phoneViewport: typeof API_PHONE_VIEWPORT;
  collapseMechanism: "details-summary";
  defaultOpen: false;
  openListMaxHeightClass: "max-h-[50vh]";
  pageOverflowPolicy: "no-unintended-page-overflow";
};

export const API_MOBILE_NAV_CONTRACT: ApiMobileNavContract = {
  phoneViewport: API_PHONE_VIEWPORT,
  collapseMechanism: "details-summary",
  defaultOpen: false,
  openListMaxHeightClass: "max-h-[50vh]",
  pageOverflowPolicy: "no-unintended-page-overflow",
};

/**
 * Map a W04 operation summary into a navigator item.
 * Anchors stay as published by normalization (operationId-based when present).
 */
export function toApiOperationNavItem(
  operation: OpenApiOperationSummary,
): ApiOperationNavItem {
  const item: ApiOperationNavItem = {
    id: operation.id,
    method: operation.method,
    path: operation.path,
    anchor: operation.anchor,
    tags: operation.tags ?? [],
  };
  if (operation.summary !== undefined) {
    item.summary = operation.summary;
  }
  if (operation.operationId !== undefined) {
    item.operationId = operation.operationId;
  }
  return item;
}

/**
 * Build tag-grouped navigation from normalized operations.
 *
 * @param operations - W04 summaries from the same package artifact as the
 *   single-page projection (order preserved within each tag).
 * @param documentTagOrder - Optional OpenAPI document `tags[].name` order.
 *   Unknown tags discovered on operations append after the document order;
 *   untagged ops land in a final {@link API_OPERATION_UNTAGGED_GROUP} group.
 */
export function buildApiOperationNavModel(
  operations: readonly OpenApiOperationSummary[],
  documentTagOrder: readonly string[] = [],
): ApiOperationNavModel {
  const items = operations.map(toApiOperationNavItem);
  const byTag = new Map<string, ApiOperationNavItem[]>();

  for (const item of items) {
    const tags =
      item.tags.length > 0 ? item.tags : [API_OPERATION_UNTAGGED_GROUP];
    for (const tag of tags) {
      const bucket = byTag.get(tag);
      if (bucket) {
        bucket.push(item);
      } else {
        byTag.set(tag, [item]);
      }
    }
  }

  const orderedTagNames: string[] = [];
  const seen = new Set<string>();

  for (const tag of documentTagOrder) {
    if (byTag.has(tag) && !seen.has(tag)) {
      orderedTagNames.push(tag);
      seen.add(tag);
    }
  }

  for (const tag of byTag.keys()) {
    if (tag === API_OPERATION_UNTAGGED_GROUP) continue;
    if (!seen.has(tag)) {
      orderedTagNames.push(tag);
      seen.add(tag);
    }
  }

  if (byTag.has(API_OPERATION_UNTAGGED_GROUP)) {
    orderedTagNames.push(API_OPERATION_UNTAGGED_GROUP);
  }

  const groups: ApiOperationNavGroup[] = orderedTagNames.map((tag) => ({
    tag,
    items: byTag.get(tag) ?? [],
  }));

  const linkCount = groups.reduce((sum, group) => sum + group.items.length, 0);
  const operationCount = new Set(items.map((item) => item.id)).size;

  return { groups, linkCount, operationCount };
}

/**
 * Extract document-level OpenAPI tag names in published order.
 */
export function readOpenApiDocumentTagOrder(document: unknown): string[] {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    return [];
  }
  const tags = (document as { tags?: unknown }).tags;
  if (!Array.isArray(tags)) {
    return [];
  }

  const names: string[] = [];
  const seen = new Set<string>();
  for (const entry of tags) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const name = (entry as { name?: unknown }).name;
    if (typeof name !== "string") continue;
    const trimmed = name.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    names.push(trimmed);
  }
  return names;
}

export type ApiMobileNavHtmlProbe = {
  hasDetailsHost: boolean;
  hasSummary: boolean;
  detailsOpenByDefault: boolean;
  navAriaLabelPresent: boolean;
  deepLinkCount: number;
  listMarkerPresent: boolean;
  tagGroupCount: number;
};

/**
 * Pure HTML probe for collapsible mobile navigator markup (no DOM required).
 */
export function probeApiMobileNavHtml(html: string): ApiMobileNavHtmlProbe {
  const detailsMatch = html.match(
    new RegExp(`<details[^>]*\\b${API_MOBILE_NAV_ATTR}\\b[^>]*>`, "i"),
  );
  const hasDetailsHost = detailsMatch !== null;
  const detailsOpenByDefault = Boolean(
    detailsMatch?.[0]?.match(/\bopen(?:="[^"]*")?\b/i),
  );
  const hasSummary = /<summary\b/i.test(html);
  const navAriaLabelPresent = html.includes(
    `aria-label="${API_OPERATION_NAV_ARIA_LABEL}"`,
  );
  const listMarkerPresent = html.includes(API_MOBILE_NAV_LIST_ATTR);
  const deepLinkCount = [
    ...html.matchAll(
      new RegExp(`${API_OPERATION_NAV_LINK_ATTR}="([^"]+)"`, "g"),
    ),
  ].length;
  const tagGroupCount = [
    ...html.matchAll(/data-api-operation-nav-tag="([^"]+)"/g),
  ].length;

  return {
    hasDetailsHost,
    hasSummary,
    detailsOpenByDefault,
    navAriaLabelPresent,
    deepLinkCount,
    listMarkerPresent,
    tagGroupCount,
  };
}

export function isApiMobileNavMarkupReady(
  probe: ApiMobileNavHtmlProbe,
  expectedDeepLinks: number,
  expectedTagGroups?: number,
): boolean {
  const tagGroupsOk =
    expectedTagGroups === undefined ||
    probe.tagGroupCount === expectedTagGroups;
  return (
    probe.hasDetailsHost &&
    probe.hasSummary &&
    !probe.detailsOpenByDefault &&
    probe.navAriaLabelPresent &&
    probe.listMarkerPresent &&
    probe.deepLinkCount === expectedDeepLinks &&
    tagGroupsOk
  );
}
