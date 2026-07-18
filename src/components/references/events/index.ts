/**
 * W09 production event-stream / event-corpus renderer ownership surface.
 *
 * Prefer importing from `@/components/references/events`. Keep the W02 spike
 * tree (`src/lib/references-sse-asyncapi-spike/`), W07 schema UI, W08 API UI,
 * and W10 family renderers outside this tree.
 */

export {
  EventCanonicalityBadge,
  type EventCanonicalityBadgeProps,
} from "./event-canonicality-badge";
export {
  EventDiscriminatorMap,
  type EventDiscriminatorMapProps,
} from "./event-discriminator-map";
export {
  EventEnvelopeReference,
  type EventEnvelopeReferenceProps,
} from "./event-envelope-reference";
export {
  EventPayloadCatalog,
  type EventPayloadCatalogProps,
} from "./event-payload-catalog";
export {
  EventPayloadVariant,
  type EventPayloadVariantProps,
} from "./event-payload-variant";
export {
  type EventCanonicalityPresentation,
  type EventStreamOperationSummaryModel,
  eventCanonicalityPresentationForRole,
  eventPreferredSessionStreamLabel,
  eventStreamOperationSummaryModelFromSelected,
  eventStreamOperationSummaryModelsFromCorpus,
} from "./event-stream-display";
export {
  EventStreamOperationSummary,
  type EventStreamOperationSummaryProps,
} from "./event-stream-operation-summary";
export {
  EventStreamOperationsList,
  type EventStreamOperationsListProps,
} from "./event-stream-operations-list";
export { EventsStatus } from "./events-status";
export {
  EventsSurface,
  type EventsSurfaceProps,
} from "./events-surface";
export {
  EventsVerificationHarness,
  type EventsVerificationHarnessProps,
} from "./events-verification-harness";
export {
  FactoryEventCatalogSection,
  type FactoryEventCatalogSectionProps,
} from "./factory-event-catalog-section";
export {
  FactoryResponseEventCatalogSection,
  type FactoryResponseEventCatalogSectionProps,
} from "./factory-response-event-catalog-section";
export {
  ResponseEventEnvelopeReference,
  type ResponseEventEnvelopeReferenceProps,
} from "./response-event-envelope-reference";
export {
  ResponseEventMatrix,
  type ResponseEventMatrixProps,
} from "./response-event-matrix";
export {
  ResponseEventPayloadCatalog,
  type ResponseEventPayloadCatalogProps,
} from "./response-event-payload-catalog";
export {
  ResponseEventPayloadVariant,
  type ResponseEventPayloadVariantProps,
} from "./response-event-payload-variant";
export {
  EVENTS_UI_STATUS_DEFAULT_MESSAGES,
  EVENTS_UI_STATUS_DEFAULT_TITLES,
  EVENTS_UI_STATUS_KINDS,
  type EventsStatusProps,
  type EventsUiStatus,
  type EventsUiStatusKind,
} from "./types";
