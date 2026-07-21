/**
 * Locked attribute / facet contracts for teaching-ui tables.
 * Shapes match docs/temp/graph-pages/contracts.md (Attribute types + facets).
 */

export type AttributeType = "boolean" | "string" | "single-tag" | "multi-tag";

export type AttributeDef = {
  id: string;
  labelKey: string;
  type: AttributeType;
  tagEnum?: string[];
  filterable: boolean;
  sortable: boolean;
  /** Optional matrix row order; present when transpose needs stable attr order. */
  order?: number;
};

/**
 * Host-owned filter state. Only filterable defs should appear.
 * Multi-tag selections are AND: the row value must include every selected tag.
 */
export type AttributeFilterState = {
  boolean?: Record<string, true | false | "any">;
  string?: Record<string, string>;
  singleTag?: Record<string, string | "any">;
  multiTag?: Record<string, string[]>;
};

export type GetAttributeValue<Row> = (row: Row, attributeId: string) => unknown;
