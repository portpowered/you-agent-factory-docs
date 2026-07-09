/**
 * Server-safe AI domain exports for SSR and Node evaluation.
 * Import from `@/features/ai` (this module) when shell code needs helpers
 * without pulling client-only renderers into module evaluation.
 *
 * Model Atlas at-a-glance / graph renderers were removed with
 * `src/features/models`. Topology explorer helpers were removed with
 * `src/features/topology`. This surface now re-exports timeline helpers only.
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
