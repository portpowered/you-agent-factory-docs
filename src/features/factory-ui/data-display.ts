/**
 * Thin host wrapper for `@you-agent-factory/components/data-display`.
 *
 * Re-exports DataTable and CodePanel for rewrite-era harness matrices and CLI
 * examples. Column definitions, row data, and code content stay caller-owned.
 * Package styles load once from `src/app/globals.css` — do not import them here.
 */

export {
  COMPONENTS_CATEGORY as FACTORY_UI_DATA_DISPLAY_CATEGORY,
  CodePanel,
  type CodePanelProps,
  type ComponentsCategory as FactoryUiDataDisplayCategory,
  codePanelVariants,
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  type DataTableState,
} from "@you-agent-factory/components/data-display";
