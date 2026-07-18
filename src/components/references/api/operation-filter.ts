/**
 * Pure operation-list filter projectors for the W08 production API surface.
 *
 * Filtering is projection-only: helpers return new groups / models and never
 * mutate the tag-grouped nav model or W04 operation summaries. Match fields:
 * HTTP method, path, summary, and operation ID (case-insensitive substrings).
 */

import type {
  ApiOperationNavGroup,
  ApiOperationNavItem,
  ApiOperationNavModel,
} from "./operation-navigation";

/** Marker attribute on the operation filter host. */
export const API_OPERATION_FILTER_ATTR = "data-api-operation-filter" as const;

/** Accessible label for the operation filter search control. */
export const API_OPERATION_FILTER_LABEL =
  "Filter operations by method, path, summary, or operation ID" as const;

/** Placeholder shown in the filter search input. */
export const API_OPERATION_FILTER_PLACEHOLDER =
  "Filter by method, path, summary, or operation ID…" as const;

/** Empty-results title when a non-empty query matches nothing. */
export const API_OPERATION_FILTER_EMPTY_TITLE =
  "No matching operations" as const;

/** Empty-results message when a non-empty query matches nothing. */
export const API_OPERATION_FILTER_EMPTY_MESSAGE =
  "No operations match this filter. Clear the filter to restore the full tag-grouped list." as const;

/** Normalize a user query for case-insensitive substring matching. */
export function normalizeApiOperationFilterQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** True when the normalized query is empty (show the full nav set). */
export function apiOperationFilterQueryIsEmpty(query: string): boolean {
  return normalizeApiOperationFilterQuery(query).length === 0;
}

/**
 * Case-insensitive substring match against optional text.
 * Empty normalized query matches everything.
 */
export function apiOperationTextMatchesFilter(
  text: string | undefined,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }
  if (text === undefined || text.length === 0) {
    return false;
  }
  return text.toLowerCase().includes(normalizedQuery);
}

/**
 * Whether a nav item matches the filter by method, path, summary, or
 * operation ID. Empty query matches every item.
 */
export function apiOperationNavItemMatchesFilter(
  item: ApiOperationNavItem,
  query: string,
): boolean {
  const normalized = normalizeApiOperationFilterQuery(query);
  if (normalized.length === 0) {
    return true;
  }

  return (
    apiOperationTextMatchesFilter(item.method, normalized) ||
    apiOperationTextMatchesFilter(item.path, normalized) ||
    apiOperationTextMatchesFilter(item.summary, normalized) ||
    apiOperationTextMatchesFilter(item.operationId, normalized) ||
    apiOperationTextMatchesFilter(item.id, normalized)
  );
}

/**
 * Filter tag groups without mutating the input. Empty groups are dropped.
 * Empty query returns a shallow copy that preserves group and item order.
 */
export function filterApiOperationNavGroups(
  groups: readonly ApiOperationNavGroup[],
  query: string,
): ApiOperationNavGroup[] {
  const normalized = normalizeApiOperationFilterQuery(query);
  if (normalized.length === 0) {
    return groups.map((group) => ({
      ...group,
      items: [...group.items],
    }));
  }

  const filtered: ApiOperationNavGroup[] = [];
  for (const group of groups) {
    const items = group.items.filter((item) =>
      apiOperationNavItemMatchesFilter(item, normalized),
    );
    if (items.length === 0) continue;
    filtered.push({
      ...group,
      items,
    });
  }
  return filtered;
}

/**
 * Project a filtered nav model from an existing model + query.
 * Recounts linkCount / operationCount over the filtered projection.
 */
export function filterApiOperationNavModel(
  model: ApiOperationNavModel,
  query: string,
): ApiOperationNavModel {
  const groups = filterApiOperationNavGroups(model.groups, query);
  const linkCount = groups.reduce((sum, group) => sum + group.items.length, 0);
  const operationCount = new Set(
    groups.flatMap((group) => group.items.map((item) => item.id)),
  ).size;
  return { groups, linkCount, operationCount };
}

/**
 * True when a non-empty query yields zero matching operations.
 */
export function apiOperationFilterHasNoMatches(
  model: ApiOperationNavModel,
  query: string,
): boolean {
  if (apiOperationFilterQueryIsEmpty(query)) {
    return false;
  }
  return filterApiOperationNavModel(model, query).operationCount === 0;
}
