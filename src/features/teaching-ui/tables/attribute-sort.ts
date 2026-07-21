/**
 * Pure attribute-sort helpers for teaching-ui tables.
 *
 * Multi-tag values sort by lexicographic join of tags (see graph-pages
 * registries.md). Equal values keep input order (stable).
 */

import type {
  AttributeDef,
  AttributeType,
  GetAttributeValue,
  SortDirection,
} from "./types";

export type { SortDirection } from "./types";

function normalizeSortKey(
  value: unknown,
  type: AttributeType | undefined,
): string {
  if (type === "boolean") {
    if (value === true) {
      return "1";
    }
    if (value === false) {
      return "0";
    }
    return "";
  }

  if (type === "multi-tag") {
    if (!Array.isArray(value)) {
      return "";
    }
    const tags = value.filter(
      (entry): entry is string => typeof entry === "string",
    );
    return [...tags].sort((a, b) => a.localeCompare(b)).join("\u0000");
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function compareSortKeys(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  if (left === "") {
    return 1;
  }
  if (right === "") {
    return -1;
  }
  return left.localeCompare(right);
}

/**
 * Orders rows by a single attribute id and direction.
 * Missing / empty values sort after defined values in both directions.
 * Ties preserve original relative order (stable).
 */
export function sortRowsByAttribute<Row>(
  rows: readonly Row[],
  attributeDefs: readonly AttributeDef[],
  sortAttributeId: string | undefined,
  sortDirection: SortDirection | undefined,
  getAttributeValue: GetAttributeValue<Row>,
): Row[] {
  if (!sortAttributeId || !sortDirection) {
    return [...rows];
  }

  const def = attributeDefs.find((entry) => entry.id === sortAttributeId);
  const directionFactor = sortDirection === "asc" ? 1 : -1;

  return rows
    .map((row, index) => ({
      row,
      index,
      key: normalizeSortKey(getAttributeValue(row, sortAttributeId), def?.type),
    }))
    .sort((a, b) => {
      const compared = compareSortKeys(a.key, b.key);
      if (compared !== 0) {
        return compared * directionFactor;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.row);
}
