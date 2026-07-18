/**
 * W09 production event-stream / event-corpus renderer ownership surface.
 *
 * Prefer importing from `@/components/references/events`. Keep the W02 spike
 * tree (`src/lib/references-sse-asyncapi-spike/`), W07 schema UI, W08 API UI,
 * and W10 family renderers outside this tree.
 */

export { EventsStatus } from "./events-status";
export {
  EventsSurface,
  type EventsSurfaceProps,
} from "./events-surface";
export {
  EVENTS_UI_STATUS_DEFAULT_MESSAGES,
  EVENTS_UI_STATUS_DEFAULT_TITLES,
  EVENTS_UI_STATUS_KINDS,
  type EventsStatusProps,
  type EventsUiStatus,
  type EventsUiStatusKind,
} from "./types";
