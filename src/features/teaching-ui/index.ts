/**
 * Public teaching-ui barrel.
 *
 * W-recipes owns focus tokens/helpers. W-table appends tables/** recipe
 * exports. Chart / list sibling lanes append their public APIs without
 * removing chassis or table exports.
 */

export {
  DEFAULT_FOCUS_COLOR_TOKENS,
  type FocusColorTokens,
  focusFill,
  mutedFill,
  resolveFocusColor,
} from "./focus";

export {
  type AttributeDef,
  AttributeFacetBar,
  type AttributeFacetBarProps,
  type AttributeFilterState,
  type AttributeType,
  FilterableSortableTable,
  type FilterableSortableTableProps,
  type GetAttributeValue,
  OrchestratorFeatureMatrix,
  type OrchestratorFeatureMatrixProps,
  type OrchestratorRecord,
  type SortDirection,
  type TransposedMatrixDisplayModel,
} from "./tables";
