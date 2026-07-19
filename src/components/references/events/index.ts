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
  EventCatalogAnchorsSection,
  type EventCatalogAnchorsSectionProps,
} from "./event-catalog-anchors-section";
export {
  EventCatalogNavigation,
  type EventCatalogNavigationProps,
} from "./event-catalog-navigation";
export {
  EventDiscriminatorMap,
  type EventDiscriminatorMapProps,
} from "./event-discriminator-map";
export {
  EventEnvelopeComponents,
  type EventEnvelopeComponentsProps,
} from "./event-envelope-components";
export {
  type EventEnvelopeJsonExampleProps,
  EventEnvelopeJsonExampleView,
} from "./event-envelope-json-example";
export {
  EventEnvelopeReference,
  type EventEnvelopeReferenceProps,
} from "./event-envelope-reference";
export {
  EventHashNavigation,
  type EventHashNavigationProps,
  focusEventHashTarget,
} from "./event-hash-navigation";
export {
  EventIdentityHandshake,
  type EventIdentityHandshakeProps,
} from "./event-identity-handshake";
export {
  EventJsonReconnectProbe,
  type EventJsonReconnectProbeProps,
} from "./event-json-reconnect-probe";
export {
  EventPayloadCatalog,
  type EventPayloadCatalogProps,
} from "./event-payload-catalog";
export {
  EventPayloadVariant,
  type EventPayloadVariantProps,
} from "./event-payload-variant";
export {
  EventReconnectContract,
  type EventReconnectContractProps,
} from "./event-reconnect-contract";
export {
  EventReconnectLifecycleSection,
  type EventReconnectLifecycleSectionProps,
} from "./event-reconnect-lifecycle-section";
export {
  type EventCanonicalityPresentation,
  type EventStreamOperationSummaryModel,
  eventCanonicalityPresentationForRole,
  eventPreferredSessionStreamLabel,
  eventStreamOperationSummaryModelFromSelected,
  eventStreamOperationSummaryModelsFromCorpus,
} from "./event-stream-display";
export {
  EventStreamLifecycle,
  type EventStreamLifecycleProps,
} from "./event-stream-lifecycle";
export {
  EventStreamOperationSummary,
  type EventStreamOperationSummaryProps,
} from "./event-stream-operation-summary";
export {
  EventStreamOperationsList,
  type EventStreamOperationsListProps,
} from "./event-stream-operations-list";
export {
  EventsSchemaDefinition,
  type EventsSchemaDefinitionProps,
} from "./events-schema-definition";
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
  SseFrameExample,
  type SseFrameExampleProps,
} from "./sse-frame-example";
export {
  SseReconnectExample,
  type SseReconnectExampleProps,
} from "./sse-reconnect-example";
export {
  SseStaticExamplesSection,
  type SseStaticExamplesSectionProps,
} from "./sse-static-examples-section";
export {
  EVENTS_UI_STATUS_DEFAULT_MESSAGES,
  EVENTS_UI_STATUS_DEFAULT_TITLES,
  EVENTS_UI_STATUS_KINDS,
  type EventsStatusProps,
  type EventsUiStatus,
  type EventsUiStatusKind,
} from "./types";
