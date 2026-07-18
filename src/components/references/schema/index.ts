/**
 * W07 shared JSON Schema renderer ownership surface.
 *
 * Prefer importing from `@/components/references/schema` for schema UI.
 * Keep overlay validators (W06) and CLI/MCP/JS family renderers (W10) outside
 * this tree.
 */

export { formatSchemaValue } from "./format-schema-value";
export {
  type SchemaDeepLink,
  schemaAddressDeepLink,
  schemaFieldPathBreadcrumbSegments,
  schemaPointerAnchor,
  schemaPointerBreadcrumbSegments,
} from "./schema-anchor";
export {
  SchemaBreadcrumb,
  type SchemaBreadcrumbProps,
} from "./schema-breadcrumb";
export {
  SchemaComposition,
  type SchemaCompositionProps,
} from "./schema-composition";
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
  SchemaDefinition,
  type SchemaDefinitionProps,
} from "./schema-definition";
export {
  type ProjectSchemaExamplesOptions,
  projectSchemaExamplesFromInputs,
  projectSchemaExamplesFromValues,
  SCHEMA_EXAMPLE_ORIGINS,
  type SchemaExampleDisplay,
  type SchemaExampleInput,
  type SchemaExampleOrigin,
  schemaExampleOriginLabel,
} from "./schema-example-display";
export {
  SchemaExamplePanel,
  type SchemaExamplePanelProps,
} from "./schema-example-panel";
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
  SchemaFilter,
  type SchemaFilterProps,
} from "./schema-filter";
export {
  filterSchemaDefinitions,
  filterSchemaFieldTreeNodes,
  normalizeSchemaFilterQuery,
  schemaDefinitionMatchesFilter,
  schemaFilterHasNoMatches,
  schemaFilterQueryIsEmpty,
  schemaTextMatchesFilter,
} from "./schema-filter-display";
export {
  projectSchemaCompositionDisplay,
  projectSchemaDiscriminatorDisplay,
  type SchemaCompositionBranchDisplay,
  type SchemaCompositionDisplay,
  type SchemaDiscriminatorDisplay,
  type SchemaDiscriminatorMappingDisplay,
  type SchemaRefLinkDisplay,
  type SchemaRefLinkKind,
  schemaCompositionKindLabel,
  schemaRefCompactLabel,
  schemaRefLinkDisplayFromAddress,
  schemaRefLinkDisplayFromOutcome,
} from "./schema-ref-display";
export {
  SchemaRefLink,
  type SchemaRefLinkProps,
} from "./schema-ref-link";
export {
  SchemaReference,
  type SchemaReferenceProps,
} from "./schema-reference";
export {
  collectSchemaReferenceCatalog,
  findSchemaDefinitionByAddress,
  type ResolveSchemaReferenceInput,
  resolveSchemaReferenceInput,
  type SchemaReferenceMode,
  type SchemaReferenceReadyResolution,
  type SchemaReferenceResolution,
  type SchemaReferenceStatusResolution,
  schemaAddressesEqual,
} from "./schema-reference-display";
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
  SchemaVariantApplicabilityBadge,
  type SchemaVariantApplicabilityBadgeProps,
} from "./schema-variant-applicability-badge";
export {
  annotateSchemaFieldTreeWithVariant,
  indexSchemaVariantFieldApplicability,
  isSchemaVariantOverlayPresentation,
  type ResolveSchemaVariantInput,
  resolveSchemaVariantInput,
  SCHEMA_VARIANT_FIELD_APPLICABILITIES,
  type SchemaVariantFieldApplicability,
  type SchemaVariantFieldPresentation,
  type SchemaVariantOverlayPresentation,
  type SchemaVariantReadyResolution,
  type SchemaVariantResolution,
  type SchemaVariantStatusResolution,
  schemaVariantApplicabilityLabel,
} from "./schema-variant-display";
export {
  SchemaVariantReference,
  type SchemaVariantReferenceProps,
} from "./schema-variant-reference";
export {
  SCHEMA_UI_STATUS_DEFAULT_MESSAGES,
  SCHEMA_UI_STATUS_DEFAULT_TITLES,
  SCHEMA_UI_STATUS_KINDS,
  type SchemaDefinitionInput,
  type SchemaDisplayInput,
  type SchemaFieldInput,
  type SchemaFieldTreeNode,
  type SchemaFieldVariantApplicability,
  type SchemaStatusProps,
  type SchemaUiStatus,
  type SchemaUiStatusKind,
} from "./types";
