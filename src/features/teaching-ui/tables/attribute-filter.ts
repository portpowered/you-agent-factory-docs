/**
 * Pure attribute-filter helpers for teaching-ui tables.
 *
 * Multi-tag policy is AND-only for v1: a row must include every selected tag.
 * Filter shapes match docs/temp/graph-pages/contracts.md AttributeFilterState.
 */

import type {
  AttributeDef,
  AttributeFilterState,
  GetAttributeValue,
} from "./types";

export type {
  AttributeDef,
  AttributeFilterState,
  AttributeType,
  GetAttributeValue,
} from "./types";

function matchesBooleanFilter(
  value: unknown,
  filter: true | false | "any" | undefined,
): boolean {
  if (filter === undefined || filter === "any") {
    return true;
  }
  return value === filter;
}

function matchesStringFilter(
  value: unknown,
  filter: string | undefined,
): boolean {
  if (filter === undefined || filter.trim() === "") {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  return value.toLowerCase().includes(filter.toLowerCase());
}

function matchesSingleTagFilter(
  value: unknown,
  filter: string | "any" | undefined,
): boolean {
  if (filter === undefined || filter === "any") {
    return true;
  }
  return value === filter;
}

/**
 * AND multi-tag: every selected tag must be present in the row's string[] value.
 * Empty / missing selection does not exclude the row.
 */
function matchesMultiTagFilter(
  value: unknown,
  selectedTags: string[] | undefined,
): boolean {
  if (selectedTags === undefined || selectedTags.length === 0) {
    return true;
  }
  if (!Array.isArray(value)) {
    return false;
  }
  const tags = value.filter(
    (entry): entry is string => typeof entry === "string",
  );
  return selectedTags.every((tag) => tags.includes(tag));
}

function rowMatchesAttributeDef<Row>(
  row: Row,
  def: AttributeDef,
  filters: AttributeFilterState,
  getAttributeValue: GetAttributeValue<Row>,
): boolean {
  const value = getAttributeValue(row, def.id);

  switch (def.type) {
    case "boolean":
      return matchesBooleanFilter(value, filters.boolean?.[def.id]);
    case "string":
      return matchesStringFilter(value, filters.string?.[def.id]);
    case "single-tag":
      return matchesSingleTagFilter(value, filters.singleTag?.[def.id]);
    case "multi-tag":
      return matchesMultiTagFilter(value, filters.multiTag?.[def.id]);
    default: {
      const _exhaustive: never = def.type;
      void _exhaustive;
      return true;
    }
  }
}

/**
 * Filters rows by AttributeFilterState using AttributeDef types.
 * Only defs marked `filterable` participate. Non-filterable defs are ignored
 * even if stray keys appear in filters.
 */
export function filterRowsByAttributes<Row>(
  rows: readonly Row[],
  attributeDefs: readonly AttributeDef[],
  filters: AttributeFilterState,
  getAttributeValue: GetAttributeValue<Row>,
): Row[] {
  const filterableDefs = attributeDefs.filter((def) => def.filterable);

  if (filterableDefs.length === 0) {
    return [...rows];
  }

  return rows.filter((row) =>
    filterableDefs.every((def) =>
      rowMatchesAttributeDef(row, def, filters, getAttributeValue),
    ),
  );
}
