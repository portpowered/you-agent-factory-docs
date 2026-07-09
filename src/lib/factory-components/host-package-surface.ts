/**
 * Minimal host import surface for `@you-agent-factory/components`.
 *
 * Proves the docs host can resolve and typecheck the package's TypeScript
 * source export map (root + category entrypoints) without a prebuilt dist/.
 * Thin UI wrappers live under `src/features/factory-ui` in later stories.
 */

export {
  COMPONENTS_PACKAGE_NAME,
  type ComponentsPackageName,
} from "@you-agent-factory/components";
export {
  COMPONENTS_CATEGORY as FACTORY_COMPONENTS_CHARTS_CATEGORY,
  type ComponentsCategory as FactoryComponentsChartsCategory,
} from "@you-agent-factory/components/charts";
export {
  COMPONENTS_CATEGORY as FACTORY_COMPONENTS_DATA_DISPLAY_CATEGORY,
  type ComponentsCategory as FactoryComponentsDataDisplayCategory,
} from "@you-agent-factory/components/data-display";
export {
  COMPONENTS_CATEGORY as FACTORY_COMPONENTS_GRAPHS_CATEGORY,
  type ComponentsCategory as FactoryComponentsGraphsCategory,
} from "@you-agent-factory/components/graphs";
