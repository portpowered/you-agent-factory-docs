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

/** Host-owned sort direction for a single attribute column. */
export type SortDirection = "asc" | "desc";

/**
 * Display model after transpose: columns = entities, rows = attributes.
 * Internal storage remains entity-as-row; this shape is view-only.
 */
export type TransposedMatrixDisplayModel = {
  /** Column headers / entity axis, in visible-id order. */
  columnEntityIds: string[];
  /** Row axis: attribute defs in matrix order (`order` when set, else input order). */
  attributeDefs: AttributeDef[];
  /**
   * Cell grid aligned as `cells[attributeRowIndex][entityColumnIndex]`.
   * Values come from `getAttributeValue` for each entity × attribute.
   */
  cells: unknown[][];
};

/**
 * Orchestrator entity for the feature matrix (registries.md shape).
 * Attributes are keyed by AttributeDef.id; value shape matches AttributeDef.type.
 */
export type OrchestratorRecord = {
  id: string;
  kind?: "orchestrator";
  name: string;
  attributes: Record<string, boolean | string | string[]>;
  tags?: string[];
  defaultSummaryKey?: string;
};
