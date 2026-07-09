/**
 * Server-safe AI domain exports for SSR and Node evaluation.
 * Import from `@/features/ai` (this module) when shell code needs helpers
 * without pulling client-only renderers into module evaluation.
 *
 * Model Atlas at-a-glance / graph renderers were removed with
 * `src/features/models`; this surface now re-exports topology and timeline
 * helpers only.
 */

export {
  loadPreloadedTimelineSelections,
  OntologyTimelinePage,
} from "@/features/docs/timeline/OntologyTimelinePage";
export {
  buildTimelineClassificationHref,
  getCanonicalTimelineSelectorForOutput,
  getDefaultTimelineClassificationSelector,
  normalizeTimelineClassificationSelector,
  TIMELINE_CLASSIFICATION_QUERY_KEY,
} from "@/features/docs/timeline/timeline-query";
export type {
  TopologyDocsPageContent,
  TopologyDocsPageContentByRegistryId,
} from "@/features/topology/topology-content";
export {
  buildTopologyGraph,
  getDefaultTopologyClassificationSelectors,
  resolveTopologyClassificationId,
  type TopologyClassificationSelection,
  type TopologyEdge,
  type TopologyGraph,
  type TopologyGraphResult,
  type TopologyNode,
} from "@/features/topology/topology-data";
export {
  buildTopologyHref,
  getCanonicalTopologySelectorsForOutput,
  getDefaultTopologySelectors,
  parseTopologyQuery,
  TOPOLOGY_CLASSIFICATION_QUERY_KEY,
  type TopologyQueryState,
} from "@/features/topology/topology-query";
