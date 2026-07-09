/**
 * Thin host wrapper for `@you-agent-factory/components/graphs`.
 *
 * Re-exports package graph primitives for rewrite-era pages. Adds no domain
 * data fetching, registry IDs, Atlas copy, or business workflow logic.
 * Package styles load once from `src/app/globals.css` — do not import them here.
 */

export {
  buildGraphEdgePathThroughWaypoints,
  COMPONENTS_CATEGORY as FACTORY_UI_GRAPHS_CATEGORY,
  type ComponentsCategory as FactoryUiGraphsCategory,
  defaultGraphNodeStateLabel,
  GRAPH_EDGE_TYPES,
  GRAPH_NODE_BUTTON_BASE_CLASS,
  GRAPH_NODE_CONTENT_MIN_HEIGHT_CLASS,
  GRAPH_NODE_STATE_INDICATOR_HEIGHT_CLASS,
  GraphEdge,
  type GraphEdgeData,
  type GraphEdgeProps,
  type GraphEdgeWaypoint,
  GraphNodeButton,
  type GraphNodeButtonProps,
  type GraphNodeHandle,
  GraphNodeHandleBadge,
  type GraphNodeHandleBadgeProps,
  type GraphNodeHandleTone,
  GraphNodeShell,
  type GraphNodeShellProps,
  type GraphNodeState,
  GraphNodeStateIndicator,
  type GraphNodeStateIndicatorProps,
  GraphViewportSurface,
  type GraphViewportSurfaceProps,
  graphNodeButtonIsDisabled,
  graphNodeButtonStateAttributes,
  graphNodeButtonStateClassName,
  graphNodeShellStateAttributes,
  graphNodeShellStateClassName,
} from "@you-agent-factory/components/graphs";
