/**
 * W09 production event-stream / event-corpus lib helpers.
 *
 * Prefer importing from `@/lib/references/events`. Keep W02 spike routes and
 * W07/W08/W10 ownership trees outside this module.
 */

export {
  EVENTS_ASYNCAPI_DEPENDENCY_POLICY,
  type EventsAsyncApiDependencyPolicy,
  type EventsAsyncApiDependencyPolicyInput,
  eventsSurfaceAllowsPermanentAsyncApiPin,
} from "./asyncapi-dependency-policy";
export {
  assertLockedHybridPlacement,
  HYBRID_EVENT_STREAM_OWNERSHIP,
  isLockedHybridPlacement,
  LOCKED_EVENT_STREAM_PLACEMENT,
  type LockedEventStreamPlacement,
} from "./hybrid-placement";
export {
  EVENT_STREAM_OPERATIONS,
  EVENT_STREAM_ROLES,
  EVENT_STREAM_SAFETY,
  EVENTS_OPENAPI_EXPORT,
  type EventStreamOperation,
  type EventStreamOperationItem,
  type EventStreamRole,
  eventStreamOperationByRole,
  isPreferredEventStreamRole,
} from "./stream-operations";
