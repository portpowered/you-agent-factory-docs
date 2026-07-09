/**
 * Thin host wrapper for `@you-agent-factory/components/charts`.
 *
 * Re-exports package chart primitives for rewrite-era pages. Adds no domain
 * chart data models, Atlas-only assumptions, or business workflow logic.
 * Package styles load once from `src/app/globals.css` — do not import them here.
 */

export {
  type ChartConfig,
  type ChartConfigEntry,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartPresentation,
  ChartStatePanel,
  type ChartStatePanelProps,
  type ChartStateStatus,
  ChartTooltip,
  ChartTooltipContent,
  COMPONENTS_CATEGORY as FACTORY_UI_CHARTS_CATEGORY,
  type ComponentsCategory as FactoryUiChartsCategory,
} from "@you-agent-factory/components/charts";
