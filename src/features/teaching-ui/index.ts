/**
 * Public teaching-ui barrel.
 *
 * W-table owns tables/** exports here. Sibling lanes (charts, lists, focus)
 * append their public exports to this barrel without removing table exports.
 */

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
