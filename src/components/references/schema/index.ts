/**
 * W07 shared JSON Schema renderer ownership surface.
 *
 * Prefer importing from `@/components/references/schema` for schema UI.
 * Keep overlay validators (W06) and CLI/MCP/JS family renderers (W10) outside
 * this tree.
 */

export { formatSchemaValue } from "./format-schema-value";
export {
  listSchemaConstraintEntries,
  type SchemaConstraintEntry,
  type SchemaConstraintSource,
} from "./schema-constraint-entries";
export {
  SchemaConstraintList,
  type SchemaConstraintListProps,
  schemaConstraintListPropsFromField,
  schemaConstraintListPropsFromProjection,
} from "./schema-constraint-list";
export {
  SchemaDefaultValue,
  type SchemaDefaultValueProps,
} from "./schema-default-value";
export {
  schemaFieldHasRefTarget,
  schemaFieldLeafName,
  schemaFieldTreeNodeCanExpand,
  schemaFieldTreeNodesFromFields,
  schemaFieldTreeNodesFromProperties,
} from "./schema-field-path";
export {
  SchemaFieldRow,
  type SchemaFieldRowProps,
} from "./schema-field-row";
export {
  SchemaFieldTree,
  type SchemaFieldTreeProps,
} from "./schema-field-tree";
export {
  SchemaRequiredBadge,
  type SchemaRequiredBadgeProps,
} from "./schema-required-badge";
export { SchemaStatus } from "./schema-status";
export { SchemaSurface, type SchemaSurfaceProps } from "./schema-surface";
export {
  SchemaTypeBadge,
  type SchemaTypeBadgeProps,
  schemaTypeBadgePropsFromProjection,
} from "./schema-type-badge";
export {
  SCHEMA_UI_STATUS_DEFAULT_MESSAGES,
  SCHEMA_UI_STATUS_DEFAULT_TITLES,
  SCHEMA_UI_STATUS_KINDS,
  type SchemaDefinitionInput,
  type SchemaDisplayInput,
  type SchemaFieldInput,
  type SchemaFieldTreeNode,
  type SchemaStatusProps,
  type SchemaUiStatus,
  type SchemaUiStatusKind,
} from "./types";
